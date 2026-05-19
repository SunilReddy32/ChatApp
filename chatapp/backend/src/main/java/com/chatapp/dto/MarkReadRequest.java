package com.chatapp.dto;

import lombok.Data;

import java.util.List;

@Data
public class MarkReadRequest {

    private List<String> messageIds;
}