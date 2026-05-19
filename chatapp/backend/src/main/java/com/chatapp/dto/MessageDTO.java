package com.chatapp.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@Builder
public class MessageDTO {

    private String id;
    private String content;
    private String authorId;
    private String authorUsername;
    private String authorDisplayName;
    private String authorColor;
    private String channelId;
    private String serverId;
    private String replyToId;

    private List<ReactionDTO> reactions;
    private List<String> readers;
    private List<AttachmentDTO> attachments;

    private boolean pinned;
    private boolean edited;
    private boolean deleted;

    private Instant createdAt;
    private Instant updatedAt;

    private String type = "MESSAGE";
}