/**
 * useWebSocket.js
 *
 * Connects the React frontend to the Spring Boot WebSocket backend
 * via STOMP over SockJS.
 *
 * Install dependencies:
 *   npm install @stomp/stompjs sockjs-client
 */

import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';

/**
 * @param {string}   token       - JWT auth token
 * @param {string}   serverId
 * @param {string}   channelId
 * @param {Function} onMessage   - called with each incoming MessageDTO
 * @param {Function} onTyping    - called with TypingEvent
 * @param {Function} onReaction  - called with ReactionUpdateDTO
 * @param {Function} onDeleted   - called with DeletedMessageDTO
 * @param {Function} onReadReceipt - called with ReadReceiptDTO
 */
export function useWebSocket({
  token,
  serverId,
  channelId,
  onMessage,
  onTyping,
  onReaction,
  onDeleted,
  onReadReceipt,
}) {
  const clientRef = useRef(null);

  useEffect(() => {
    if (!token || !channelId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,

      onConnect: () => {
        const dest = serverId
          ? `/topic/channel/${serverId}/${channelId}`
          : `/topic/dm/${channelId}`;

        // Subscribe to channel messages (all event types)
        client.subscribe(dest, (frame) => {
          const payload = JSON.parse(frame.body);
          switch (payload.type) {
            case 'MESSAGE':         onMessage?.(payload);     break;
            case 'MESSAGE_DELETED': onDeleted?.(payload);     break;
            case 'REACTION_UPDATE': onReaction?.(payload);    break;
            case 'READ_RECEIPT':    onReadReceipt?.(payload); break;
          }
        });

        // Subscribe to typing events
        client.subscribe(`/topic/typing/${channelId}`, (frame) => {
          onTyping?.(JSON.parse(frame.body));
        });

        // Subscribe to personal notifications (read receipts, delivery)
        client.subscribe('/user/queue/notifications', (frame) => {
          const payload = JSON.parse(frame.body);
          if (payload.type === 'READ_RECEIPT') onReadReceipt?.(payload);
        });

        // Request message history on subscribe
        client.subscribe(`/app/channel/${serverId}/${channelId}/history`, (frame) => {
          const history = JSON.parse(frame.body);
          history.messages?.forEach(m => onMessage?.(m));
        });
      },

      onDisconnect: () => console.log('[WS] Disconnected'),
      onStompError:  (frame) => console.error('[WS] STOMP error', frame),
    });

    client.activate();
    clientRef.current = client;

    return () => { client.deactivate(); };
  }, [token, serverId, channelId]);

  // ── Publish helpers ────────────────────────────────────────────────

  const sendMessage = useCallback((content, replyToId = null) => {
    clientRef.current?.publish({
      destination: '/app/message.send',
      body: JSON.stringify({ content, channelId, serverId, replyToId }),
    });
  }, [channelId, serverId]);

  const editMessage = useCallback((messageId, newContent) => {
    clientRef.current?.publish({
      destination: '/app/message.edit',
      body: JSON.stringify({ messageId, newContent }),
    });
  }, []);

  const deleteMessage = useCallback((messageId) => {
    clientRef.current?.publish({
      destination: '/app/message.delete',
      body: JSON.stringify({ messageId }),
    });
  }, []);

  const toggleReaction = useCallback((messageId, emoji) => {
    clientRef.current?.publish({
      destination: '/app/reaction.toggle',
      body: JSON.stringify({ messageId, emoji }),
    });
  }, []);

  const sendTyping = useCallback((typing) => {
    clientRef.current?.publish({
      destination: '/app/typing',
      body: JSON.stringify({ channelId, typing }),
    });
  }, [channelId]);

  const markRead = useCallback((messageIds) => {
    clientRef.current?.publish({
      destination: '/app/read.mark',
      body: JSON.stringify({ messageIds }),
    });
  }, []);

  return { sendMessage, editMessage, deleteMessage, toggleReaction, sendTyping, markRead };
}
