package com.chatapp.controller;

import com.chatapp.dto.AuthResponseDTO;
import com.chatapp.dto.LoginRequest;
import com.chatapp.dto.RegisterRequest;
import com.chatapp.dto.StatusUpdateRequest;
import com.chatapp.dto.UserProfileDTO;
import com.chatapp.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(authService.register(req));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponseDTO> refresh(@RequestHeader("Authorization") String bearerToken) {
        return ResponseEntity.ok(authService.refresh(bearerToken.substring(7)));
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileDTO> me(Principal principal) {
        return ResponseEntity.ok(authService.getProfile(principal.getName()));
    }

    @PatchMapping("/me/status")
    public ResponseEntity<Void> updateStatus(
            @RequestBody StatusUpdateRequest req,
            Principal principal) {
        authService.updateStatus(principal.getName(), req.getStatus());
        return ResponseEntity.noContent().build();
    }
}