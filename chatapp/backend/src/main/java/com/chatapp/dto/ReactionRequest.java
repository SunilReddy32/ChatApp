package com.chatapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ReactionRequest {

    @NotBlank
    private String messageId;

    @NotBlank
    @Size(max = 8)
    private String emoji;
}