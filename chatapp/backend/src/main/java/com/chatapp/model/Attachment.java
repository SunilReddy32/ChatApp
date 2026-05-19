package com.chatapp.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "attachments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attachment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    private Message message;

    @Column(nullable = false)
    private String filename;

    @Column(name = "content_type")
    private String contentType;

    private Long size;

    @Column(nullable = false)
    private String url;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private AttachmentType type = AttachmentType.FILE;

    public enum AttachmentType {
        IMAGE,
        FILE
    }
}