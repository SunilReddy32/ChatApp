package com.chatapp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AttachmentDTO {

    private String id;
    private String filename;
    private String contentType;
    private Long size;
    private String url;
    private String type;
}