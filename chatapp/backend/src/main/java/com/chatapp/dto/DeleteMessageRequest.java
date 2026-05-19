package com.chatapp.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DeleteMessageRequest {

    @NotBlank
    private String messageId;
}