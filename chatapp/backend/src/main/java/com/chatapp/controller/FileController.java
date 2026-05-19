package com.chatapp.controller;

import com.chatapp.dto.AttachmentDTO;
import com.chatapp.model.Attachment;
import com.chatapp.repository.AttachmentRepository;
import com.chatapp.repository.MessageRepository;
import com.chatapp.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileUploadService uploadService;
    private final MessageRepository messageRepo;
    private final AttachmentRepository attachmentRepo;

    @PostMapping("/upload")
    public ResponseEntity<AttachmentDTO> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "messageId", required = false) String messageId,
            @AuthenticationPrincipal UserDetails user) throws IOException {

        FileUploadService.UploadResult result = uploadService.upload(file);

        boolean isImage = result.contentType() != null &&
                result.contentType().startsWith("image/");

        Attachment.AttachmentBuilder builder = Attachment.builder()
                .filename(file.getOriginalFilename())
                .contentType(result.contentType())
                .size(result.size())
                .url(result.url())
                .type(isImage
                        ? Attachment.AttachmentType.IMAGE
                        : Attachment.AttachmentType.FILE);

        if (messageId != null) {
            messageRepo.findById(messageId)
                    .ifPresent(builder::message);
        }

        Attachment saved = attachmentRepo.save(builder.build());

        return ResponseEntity.ok(
                new AttachmentDTO(
                        saved.getId(),
                        saved.getFilename(),
                        saved.getContentType(),
                        saved.getSize(),
                        saved.getUrl(),
                        saved.getType().name()));
    }

    @DeleteMapping("/{attachmentId}")
    public ResponseEntity<Void> delete(
            @PathVariable String attachmentId,
            @AuthenticationPrincipal UserDetails user) {
        attachmentRepo.deleteById(attachmentId);
        return ResponseEntity.noContent().build();
    }
}