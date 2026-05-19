package com.chatapp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class MessageHistoryDTO {

    private String channelId;
    private List<MessageDTO> messages;
}