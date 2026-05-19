package com.chatapp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class ReactionUpdateDTO {

    private String messageId;
    private String serverId;
    private String channelId;

    private List<ReactionDTO> reactions;

    private final String type = "REACTION_UPDATE";
}