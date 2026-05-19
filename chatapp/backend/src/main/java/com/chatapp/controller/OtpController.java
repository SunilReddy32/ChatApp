package com.chatapp.controller;

import com.chatapp.dto.OtpRequestDTO;
import com.chatapp.service.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class OtpController {

    private final OtpService otpService;
    private final JavaMailSender mailSender;

    @PostMapping("/send-otp")
    public ResponseEntity<Map<String,String>> sendOtp(@RequestBody OtpRequestDTO req) {
        String code = otpService.generate(req.getEmail());

        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(req.getEmail());
        msg.setSubject("NexChat - Your verification code");
        msg.setText("Your NexChat verification code is: " + code + "\n\nThis code expires in 10 minutes. Do not share it with anyone.");
        mailSender.send(msg);

        return ResponseEntity.ok(Map.of("message", "OTP sent to " + req.getEmail()));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String,Object>> verifyOtp(@RequestBody OtpRequestDTO req) {
        boolean valid = otpService.verify(req.getEmail(), req.getOtp());
        if (!valid) return ResponseEntity.badRequest().body(Map.of("message", "Invalid or expired OTP"));
        return ResponseEntity.ok(Map.of("verified", true));
    }
}
