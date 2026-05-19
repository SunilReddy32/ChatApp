package com.chatapp.repository;

import com.chatapp.model.Message;
import com.chatapp.model.ReadReceipt;
import com.chatapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReadReceiptRepository extends JpaRepository<ReadReceipt, Long> {

    Optional<ReadReceipt> findByMessageAndUser(
            Message message,
            User user);

    List<ReadReceipt> findByMessage(Message message);
}