package com.chatapp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DeletedMessageDTO {

    private String messageId;
    private String serverId;
    private String channelId;

    private final String type = "MESSAGE_DELETED";
}