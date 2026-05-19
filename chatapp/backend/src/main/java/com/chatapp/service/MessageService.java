package com.chatapp.service;

import com.chatapp.dto.*;
import com.chatapp.model.*;
import com.chatapp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepo;
    private final UserRepository userRepo;
    private final ReactionRepository reactionRepo;
    private final ReadReceiptRepository readReceiptRepo;
    private final AttachmentRepository attachmentRepo;

    // ── Send ─────────────────────────────────────────────────────────
    @Transactional
    public MessageDTO send(SendMessageRequest req, String senderUsername) {
        User author = userRepo.findByUsername(senderUsername)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + senderUsername));

        Message.MessageBuilder builder = Message.builder()
            .content(req.getContent())
            .author(author)
            .channelId(req.getChannelId())
            .serverId(req.getServerId())
            .recipientId(req.getRecipientId());

        if (req.getReplyToId() != null) {
            messageRepo.findById(req.getReplyToId()).ifPresent(builder::replyTo);
        }

        Message saved = messageRepo.save(builder.build());
        return toDTO(saved, senderUsername);
    }

    // ── Edit ─────────────────────────────────────────────────────────
    @Transactional
    public MessageDTO edit(String messageId, String newContent, String editorUsername) {
        Message msg = messageRepo.findById(messageId)
            .orElseThrow(() -> new IllegalArgumentException("Message not found"));

        if (!msg.getAuthor().getUsername().equals(editorUsername)) {
            throw new SecurityException("Cannot edit another user's message");
        }
        if (msg.isDeleted()) throw new IllegalStateException("Cannot edit a deleted message");

        msg.setContent(newContent);
        msg.setEdited(true);
        return toDTO(messageRepo.save(msg), editorUsername);
    }

    // ── Soft Delete ───────────────────────────────────────────────────
    @Transactional
    public DeletedMessageDTO softDelete(String messageId, String requesterUsername) {
        Message msg = messageRepo.findById(messageId)
            .orElseThrow(() -> new IllegalArgumentException("Message not found"));

        boolean isOwner  = msg.getAuthor().getUsername().equals(requesterUsername);
        boolean isMod    = userRepo.findByUsername(requesterUsername)
            .map(u -> u.getRoles().contains("MODERATOR")).orElse(false);

        if (!isOwner && !isMod) throw new SecurityException("Cannot delete another user's message");

        msg.setDeletedAt(Instant.now());
        messageRepo.save(msg);
        return new DeletedMessageDTO(messageId, msg.getServerId(), msg.getChannelId());
    }

    // ── Reaction Toggle ───────────────────────────────────────────────
    @Transactional
    public ReactionUpdateDTO toggleReaction(String messageId, String emoji, String username) {
        Message msg  = messageRepo.findById(messageId)
            .orElseThrow(() -> new IllegalArgumentException("Message not found"));
        User user    = userRepo.findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Optional<Reaction> existing = reactionRepo.findByMessageAndUserAndEmoji(msg, user, emoji);
        if (existing.isPresent()) {
            reactionRepo.delete(existing.get());
        } else {
            reactionRepo.save(Reaction.builder().message(msg).user(user).emoji(emoji).build());
        }

        // Return fresh reaction counts for this message
        List<ReactionDTO> reactions = reactionRepo.findByMessage(msg).stream()
            .collect(Collectors.groupingBy(Reaction::getEmoji,
                Collectors.collectingAndThen(Collectors.toList(), list -> new ReactionDTO(
                    list.get(0).getEmoji(),
                    list.size(),
                    list.stream().anyMatch(r -> r.getUser().getUsername().equals(username))
                ))))
            .values().stream().toList();

        return new ReactionUpdateDTO(messageId, msg.getServerId(), msg.getChannelId(), reactions);
    }

    // ── Mark Read ─────────────────────────────────────────────────────
    @Transactional
    public void markRead(List<String> messageIds, String readerUsername) {
        User reader = userRepo.findByUsername(readerUsername)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        messageIds.forEach(id -> messageRepo.findById(id).ifPresent(msg -> {
            if (readReceiptRepo.findByMessageAndUser(msg, reader).isEmpty()) {
                readReceiptRepo.save(ReadReceipt.builder().message(msg).user(reader).build());
            }
        }));
    }

    // ── History ───────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public MessageHistoryDTO getHistory(String serverId, String channelId, String username, int limit) {
        Pageable page = PageRequest.of(0, limit, Sort.by("createdAt").descending());
        List<Message> messages = messageRepo
            .findByServerIdAndChannelIdAndDeletedAtIsNull(serverId, channelId, page)
            .stream()
            .sorted(Comparator.comparing(Message::getCreatedAt))
            .toList();

        List<MessageDTO> dtos = messages.stream()
            .map(m -> toDTO(m, username))
            .toList();

        return new MessageHistoryDTO(channelId, dtos);
    }

    // ── Helper ────────────────────────────────────────────────────────
    public Optional<String> getAuthorUsername(String messageId) {
        return messageRepo.findById(messageId)
            .map(m -> m.getAuthor().getUsername());
    }

    private MessageDTO toDTO(Message msg, String viewerUsername) {
        List<ReactionDTO> reactions = reactionRepo.findByMessage(msg).stream()
            .collect(Collectors.groupingBy(Reaction::getEmoji,
                Collectors.collectingAndThen(Collectors.toList(), list -> new ReactionDTO(
                    list.get(0).getEmoji(),
                    list.size(),
                    list.stream().anyMatch(r -> r.getUser().getUsername().equals(viewerUsername))
                ))))
            .values().stream().toList();

        List<String> readers = readReceiptRepo.findByMessage(msg).stream()
            .map(r -> r.getUser().getUsername())
            .toList();

        List<AttachmentDTO> attachments = attachmentRepo.findByMessage(msg).stream()
            .map(a -> new AttachmentDTO(a.getId(), a.getFilename(), a.getContentType(), a.getSize(), a.getUrl(), a.getType().name()))
            .toList();

        return MessageDTO.builder()
            .id(msg.getId())
            .content(msg.isDeleted() ? "[Message deleted]" : msg.getContent())
            .authorId(msg.getAuthor().getId())
            .authorUsername(msg.getAuthor().getUsername())
            .authorDisplayName(msg.getAuthor().getDisplayName())
            .authorColor(msg.getAuthor().getAvatarColor())
            .channelId(msg.getChannelId())
            .serverId(msg.getServerId())
            .replyToId(msg.getReplyTo() != null ? msg.getReplyTo().getId() : null)
            .reactions(reactions)
            .readers(readers)
            .attachments(attachments)
            .pinned(msg.isPinned())
            .edited(msg.isEdited())
            .deleted(msg.isDeleted())
            .createdAt(msg.getCreatedAt())
            .updatedAt(msg.getUpdatedAt())
            .build();
    }
}
