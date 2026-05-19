package com.chatapp.repository;

import com.chatapp.model.Message;
import com.chatapp.model.Reaction;
import com.chatapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReactionRepository extends JpaRepository<Reaction, Long> {

    Optional<Reaction> findByMessageAndUserAndEmoji(
            Message message,
            User user,
            String emoji);

    List<Reaction> findByMessage(Message message);

    void deleteByMessageAndUserAndEmoji(
            Message message,
            User user,
            String emoji);
}