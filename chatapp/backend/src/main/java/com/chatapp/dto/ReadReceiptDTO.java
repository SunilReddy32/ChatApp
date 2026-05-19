package com.chatapp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ReadReceiptDTO {

    private String messageId;
    private String readerUsername;

    private final String type = "READ_RECEIPT";
}