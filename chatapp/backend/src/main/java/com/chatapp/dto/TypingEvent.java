package com.chatapp.dto;

import lombok.Data;

@Data
public class TypingEvent {

    private String channelId;
    private String username;
    private boolean typing;
}