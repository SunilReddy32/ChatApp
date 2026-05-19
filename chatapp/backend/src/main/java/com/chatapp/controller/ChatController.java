package com.chatapp.controller;

import com.chatapp.dto.*;
import com.chatapp.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.stereotype.Controller;

import java.security.Principal;

/**
 * Handles all real-time WebSocket/STOMP chat events.
 *
 * Pairs with WebSocketConfig destinations.
 */
@Controller
@RequiredArgsConstructor
public class ChatController {

    private final MessageService messageService;
    private final SimpMessagingTemplate broker;

    // ── Send a message ────────────────────────────────────────────────
    @MessageMapping("/message.send")
    public void sendMessage(@Valid @Payload SendMessageRequest req, Principal sender) {
        MessageDTO saved = messageService.send(req, sender.getName());

        // Broadcast to all subscribers of the channel
        String dest = req.getServerId() != null
            ? "/topic/channel/" + req.getServerId() + "/" + req.getChannelId()
            : "/topic/dm/" + req.getRecipientId();

        broker.convertAndSend(dest, saved);

        // Confirm delivery to sender
        broker.convertAndSendToUser(sender.getName(), "/queue/sent", saved);
    }

    // ── Edit a message ────────────────────────────────────────────────
    @MessageMapping("/message.edit")
    public void editMessage(@Valid @Payload EditMessageRequest req, Principal sender) {
        MessageDTO updated = messageService.edit(req.getMessageId(), req.getNewContent(), sender.getName());
        broker.convertAndSend("/topic/channel/" + updated.getServerId() + "/" + updated.getChannelId(), updated);
    }

    // ── Delete a message ──────────────────────────────────────────────
    @MessageMapping("/message.delete")
    public void deleteMessage(@Payload DeleteMessageRequest req, Principal sender) {
        DeletedMessageDTO deleted = messageService.softDelete(req.getMessageId(), sender.getName());
        broker.convertAndSend("/topic/channel/" + deleted.getServerId() + "/" + deleted.getChannelId(), deleted);
    }

    // ── Toggle reaction ───────────────────────────────────────────────
    @MessageMapping("/reaction.toggle")
    public void toggleReaction(@Payload ReactionRequest req, Principal sender) {
        ReactionUpdateDTO update = messageService.toggleReaction(req.getMessageId(), req.getEmoji(), sender.getName());
        broker.convertAndSend("/topic/channel/" + update.getServerId() + "/" + update.getChannelId(), update);
    }

    // ── Typing indicator ──────────────────────────────────────────────
    @MessageMapping("/typing")
    public void typingIndicator(@Payload TypingEvent event, Principal sender) {
        event.setUsername(sender.getName());
        broker.convertAndSend("/topic/typing/" + event.getChannelId(), event);
    }

    // ── Mark messages as read ─────────────────────────────────────────
    @MessageMapping("/read.mark")
    public void markRead(@Payload MarkReadRequest req, Principal reader) {
        messageService.markRead(req.getMessageIds(), reader.getName());
        // Notify original senders their messages were read
        req.getMessageIds().forEach(msgId ->
            messageService.getAuthorUsername(msgId).ifPresent(authorUsername ->
                broker.convertAndSendToUser(authorUsername, "/queue/read", new ReadReceiptDTO(msgId, reader.getName()))
            )
        );
    }

    // ── Load message history on channel subscribe ─────────────────────
    @SubscribeMapping("/channel/{serverId}/{channelId}/history")
    public MessageHistoryDTO getHistory(
        @DestinationVariable String serverId,
        @DestinationVariable String channelId,
        Principal user
    ) {
        return messageService.getHistory(serverId, channelId, user.getName(), 50);
    }
}
