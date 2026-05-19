package com.chatapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDTO {

    private String id;
    private String username;
    private String displayName;
    private String discriminator;
    private String avatarUrl;
    private String avatarColor;
    private String status;
    private String createdAt;
}