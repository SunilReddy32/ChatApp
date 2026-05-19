package com.chatapp.service;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory OTP store. Replaces with Redis in production.
 * OTPs expire after 10 minutes.
 */
@Service
public class OtpService {

    private record OtpEntry(String code, Instant expiresAt) {}

    private final Map<String, OtpEntry> store = new ConcurrentHashMap<>();
    private final SecureRandom rng = new SecureRandom();

    public String generate(String email) {
        String code = String.format("%06d", rng.nextInt(1_000_000));
        store.put(email.toLowerCase(), new OtpEntry(code, Instant.now().plusSeconds(600)));
        return code;
    }

    public boolean verify(String email, String code) {
        OtpEntry entry = store.get(email.toLowerCase());
        if (entry == null) return false;
        if (Instant.now().isAfter(entry.expiresAt())) { store.remove(email.toLowerCase()); return false; }
        if (!entry.code().equals(code)) return false;
        store.remove(email.toLowerCase());
        return true;
    }
}
