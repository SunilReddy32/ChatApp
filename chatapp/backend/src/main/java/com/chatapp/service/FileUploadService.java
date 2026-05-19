package com.chatapp.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

/**
 * Handles file uploads for attachments (images, documents, etc.).
 * Toggle between local storage (dev) and S3 (production) via application.yml:
 * app.file.storage=local → saves files under ./uploads/
 * app.file.storage=s3 → uploads to AWS S3 (requires S3Client bean)
 */
@Service
public class FileUploadService {

    @Value("${app.file.storage}")
    private String storageMode;
    @Value("${app.file.local-path}")
    private String localPath;
    @Value("${app.file.s3-bucket}")
    private String s3Bucket;
    @Value("${server.port}")
    private int serverPort;

    // Optional: only needed when storage=s3. Autowired lazily so local mode
    // starts without AWS credentials on the classpath.
    @Autowired(required = false)
    private S3Client s3Client;

    private static final long MAX_FILE_SIZE = 50L * 1024 * 1024; // 50 MB
    private static final String[] ALLOWED_TYPES = {
            "image/png", "image/jpeg", "image/gif", "image/webp",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
            "application/zip"
    };

    public UploadResult upload(MultipartFile file) throws IOException {
        validateFile(file);
        String key = UUID.randomUUID() + "_" + sanitize(file.getOriginalFilename());

        if ("s3".equalsIgnoreCase(storageMode)) {
            if (s3Client == null) {
                throw new IllegalStateException(
                        "S3 storage mode selected but no S3Client bean is configured. " +
                                "Set app.file.storage=local for development.");
            }
            return uploadToS3(file, key);
        } else {
            return uploadToLocal(file, key);
        }
    }

    private UploadResult uploadToLocal(MultipartFile file, String key) throws IOException {
        Path dir = Path.of(localPath);
        Files.createDirectories(dir);
        Path dest = dir.resolve(key);
        Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);
        String url = "http://localhost:" + serverPort + "/uploads/" + key;
        return new UploadResult(key, url, file.getContentType(), file.getSize());
    }

    private UploadResult uploadToS3(MultipartFile file, String key) throws IOException {
        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(s3Bucket)
                        .key(key)
                        .contentType(file.getContentType())
                        .contentLength(file.getSize())
                        .build(),
                RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        String url = "https://" + s3Bucket + ".s3.amazonaws.com/" + key;
        return new UploadResult(key, url, file.getContentType(), file.getSize());
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty())
            throw new IllegalArgumentException("File is empty");
        if (file.getSize() > MAX_FILE_SIZE)
            throw new IllegalArgumentException("File exceeds 50 MB limit");
        boolean allowed = false;
        for (String type : ALLOWED_TYPES) {
            if (type.equals(file.getContentType())) {
                allowed = true;
                break;
            }
        }
        if (!allowed)
            throw new IllegalArgumentException("File type not allowed: " + file.getContentType());
    }

    private String sanitize(String filename) {
        if (filename == null)
            return "file";
        return filename.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    public record UploadResult(String key, String url, String contentType, long size) {
    }
}