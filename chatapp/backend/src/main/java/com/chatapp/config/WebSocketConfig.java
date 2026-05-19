package com.chatapp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

/**
 * WebSocket + STOMP configuration.
 *
 * Frontend connects to: ws://localhost:8080/ws
 *
 * Client subscribes to:
 *   /topic/channel/{serverId}/{channelId}   — server channel messages
 *   /topic/dm/{userId}                      — direct messages for a user
 *   /topic/typing/{channelId}               — typing events
 *   /user/queue/notifications               — personal notifications
 *
 * Client publishes to:
 *   /app/message.send
 *   /app/message.edit
 *   /app/message.delete
 *   /app/reaction.toggle
 *   /app/typing
 *   /app/read.mark
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // In-memory broker for topics (swap for RabbitMQ in production)
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry
            .addEndpoint("/ws")
            .setAllowedOriginPatterns("*")
            .withSockJS(); // SockJS fallback for non-WS browsers
    }
}
