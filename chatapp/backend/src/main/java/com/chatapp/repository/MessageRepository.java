package com.chatapp.repository;

import com.chatapp.model.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, String> {

    List<Message> findByServerIdAndChannelIdAndDeletedAtIsNull(
            String serverId,
            String channelId,
            Pageable pageable);

    List<Message> findByRecipientIdAndDeletedAtIsNull(
            String recipientId,
            Pageable pageable);

    @Query("""
            SELECT m
            FROM Message m
            WHERE m.channelId = :channelId
            AND m.pinned = true
            """)
    List<Message> findPinnedByChannelId(String channelId);
}