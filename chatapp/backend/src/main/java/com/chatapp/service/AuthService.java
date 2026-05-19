package com.chatapp.service;

import com.chatapp.dto.AuthResponseDTO;
import com.chatapp.dto.LoginRequest;
import com.chatapp.dto.RegisterRequest;
import com.chatapp.dto.UserProfileDTO;
import com.chatapp.model.User;
import com.chatapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Random;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authManager;

    @Transactional
    public AuthResponseDTO register(RegisterRequest req) {
        if (userRepo.existsByUsername(req.getUsername())) {
            throw new IllegalArgumentException("Username already taken: " + req.getUsername());
        }

        User user = User.builder()
                .username(req.getUsername())
                .email(req.getEmail())
                .displayName(req.getDisplayName())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .discriminator(generateDiscriminator())
                .status(User.UserStatus.ONLINE)
                .build();

        User saved = userRepo.save(user);
        String token = jwtService.generateToken(saved.getUsername());
        return toAuthResponse(saved, token);
    }

    public AuthResponseDTO login(LoginRequest req) {
        authManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword()));

        User user = userRepo.findByUsername(req.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setStatus(User.UserStatus.ONLINE);
        userRepo.save(user);

        String token = jwtService.generateToken(user.getUsername());
        return toAuthResponse(user, token);
    }

    public AuthResponseDTO refresh(String token) {
        String username = jwtService.extractUsername(token);
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        String newToken = jwtService.generateToken(username);
        return toAuthResponse(user, newToken);
    }

    public UserProfileDTO getProfile(String username) {
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return toProfileDTO(user);
    }

    @Transactional
    public void updateStatus(String username, String status) {
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        try {
            user.setStatus(User.UserStatus.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status: " + status);
        }
        userRepo.save(user);
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private AuthResponseDTO toAuthResponse(User user, String token) {
        return AuthResponseDTO.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .avatarColor(user.getAvatarColor())
                .status(user.getStatus().name())
                .build();
    }

    private UserProfileDTO toProfileDTO(User user) {
        return UserProfileDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .discriminator(user.getDiscriminator())
                .avatarUrl(user.getAvatarUrl())
                .avatarColor(user.getAvatarColor())
                .status(user.getStatus().name())
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                .build();
    }

    private String generateDiscriminator() {
        return String.format("%04d", new Random().nextInt(10000));
    }
}