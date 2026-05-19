package com.chatapp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ReactionDTO {

    private String emoji;
    private int count;
    private boolean mine;
}