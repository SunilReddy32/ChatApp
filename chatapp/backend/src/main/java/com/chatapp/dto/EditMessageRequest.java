package com.chatapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class EditMessageRequest {

    @NotBlank
    private String messageId;

    @NotBlank
    @Size(max = 4000)
    private String newContent;
}