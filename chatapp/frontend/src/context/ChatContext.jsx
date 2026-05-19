import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const ChatContext = createContext(null);

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';

export const SERVERS = [
  { id: 'home', icon: '💬', name: 'Direct Messages', type: 'home' },
  { id: 'dev',  initials: 'DT', name: 'Dev Team',    bg: '#2e3566', color: '#9d8fff' },
  { id: 'proj', initials: 'PX', name: 'Project X',   bg: '#2a3828', color: '#3dd68c' },
];

export const CHANNELS = {
  dev: [
    { id: 'announcements', name: 'announcements', icon: 'speakerphone', desc: 'Important announcements' },
    { id: 'general',       name: 'general',       icon: 'hash',         desc: 'General discussion' },
    { id: 'code-review',   name: 'code-review',   icon: 'hash',         desc: 'Code review discussions' },
    { id: 'random',        name: 'random',         icon: 'hash',         desc: 'Off-topic & fun stuff' },
  ],
  proj: [
    { id: 'overview',  name: 'overview',  icon: 'hash', desc: 'Project overview' },
    { id: 'design',    name: 'design',    icon: 'hash', desc: 'Design discussions' },
    { id: 'dev-chat',  name: 'dev-chat',  icon: 'hash', desc: 'Dev chat' },
  ],
};

export function ChatProvider({ children }) {
  const { user, token } = useAuth();
  const [activeServer, setActiveServer]   = useState('dev');
  const [activeChannel, setActiveChannel] = useState('general');
  const [messages, setMessages]           = useState({});
  const [replyingTo, setReplyingTo]       = useState(null);
  const [typingUsers, setTypingUsers]     = useState([]);
  const [connected, setConnected]         = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState({});

  const clientRef   = useRef(null);
  const typingTimer = useRef(null);

  const channelKey = `${activeServer}/${activeChannel}`;

  // ── WebSocket connection ─────────────────────────────────────────────
  useEffect(() => {
    if (!token || !user) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        subscribeToChannel(client, activeServer, activeChannel);
      },
      onDisconnect: () => setConnected(false),
      onStompError: (f) => console.error('[WS] STOMP error', f),
    });
    client.activate();
    clientRef.current = client;
    return () => { client.deactivate(); setConnected(false); };
  }, [token, user]);

  // Re-subscribe when channel changes
  useEffect(() => {
    if (connected && clientRef.current) {
      subscribeToChannel(clientRef.current, activeServer, activeChannel);
    }
  }, [activeServer, activeChannel, connected]);

  function subscribeToChannel(client, serverId, channelId) {
    const dest = serverId !== 'home'
      ? `/topic/channel/${serverId}/${channelId}`
      : `/topic/dm/${user?.id}`;

    client.subscribe(dest, (frame) => {
      const payload = JSON.parse(frame.body);
      const key = `${serverId}/${channelId}`;
      switch (payload.type || 'MESSAGE') {
        case 'MESSAGE':
          setMessages(prev => ({ ...prev, [key]: [...(prev[key] || []), normalizeMsg(payload)] }));
          break;
        case 'MESSAGE_DELETED':
          setMessages(prev => ({ ...prev, [key]: (prev[key] || []).filter(m => m.id !== payload.messageId) }));
          break;
        case 'REACTION_UPDATE':
          setMessages(prev => ({ ...prev, [key]: (prev[key] || []).map(m => m.id === payload.messageId ? { ...m, reactions: payload.reactions } : m) }));
          break;
        case 'MESSAGE_EDITED':
          setMessages(prev => ({ ...prev, [key]: (prev[key] || []).map(m => m.id === payload.id ? normalizeMsg(payload) : m) }));
          break;
      }
    });

    client.subscribe(`/topic/typing/${channelId}`, (frame) => {
      const e = JSON.parse(frame.body);
      if (e.username === user?.username) return;
      setTypingUsers(prev => e.typing
        ? prev.find(u => u === e.username) ? prev : [...prev, e.username]
        : prev.filter(u => u !== e.username));
      if (typingTimer.current) clearTimeout(typingTimer.current);
      if (e.typing) typingTimer.current = setTimeout(() => setTypingUsers(prev => prev.filter(u => u !== e.username)), 4000);
    });

    // Load history
    client.subscribe(`/app/channel/${serverId}/${channelId}/history`, (frame) => {
      const history = JSON.parse(frame.body);
      if (history?.messages?.length) {
        const key = `${serverId}/${channelId}`;
        setMessages(prev => ({ ...prev, [key]: history.messages.map(normalizeMsg) }));
      }
    });
  }

  function normalizeMsg(payload) {
    return {
      id: payload.id,
      author: {
        id: payload.authorId,
        name: payload.authorDisplayName || payload.authorUsername,
        username: payload.authorUsername,
        color: payload.authorColor || '#7c6af7',
        initials: (payload.authorDisplayName || payload.authorUsername || '?').slice(0, 2).toUpperCase(),
      },
      text: payload.content,
      time: new Date(payload.createdAt),
      reactions: payload.reactions || [],
      readers: payload.readers || [],
      attachments: payload.attachments || [],
      isOwn: payload.authorUsername === user?.username,
      edited: payload.edited,
      pinned: payload.pinned,
      replyTo: payload.replyToId ? { id: payload.replyToId } : null,
      status: 'delivered',
    };
  }

  // ── Actions ──────────────────────────────────────────────────────────

  const sendMessage = useCallback((text, attachment = null) => {
    if (!clientRef.current?.connected) return;
    clientRef.current.publish({
      destination: '/app/message.send',
      body: JSON.stringify({
        content: text,
        channelId: activeChannel,
        serverId: activeServer !== 'home' ? activeServer : null,
        recipientId: activeServer === 'home' ? activeChannel : null,
        replyToId: replyingTo?.id || null,
      }),
    });
    setReplyingTo(null);
  }, [activeServer, activeChannel, replyingTo]);

  const sendTyping = useCallback((typing) => {
    clientRef.current?.publish({
      destination: '/app/typing',
      body: JSON.stringify({ channelId: activeChannel, typing }),
    });
  }, [activeChannel]);

  const toggleReaction = useCallback((msgId, emoji) => {
    if (!clientRef.current?.connected) {
      // Optimistic local update when offline
      setMessages(prev => ({
        ...prev,
        [channelKey]: (prev[channelKey] || []).map(m => {
          if (m.id !== msgId) return m;
          const ex = m.reactions.find(r => r.emoji === emoji);
          const reactions = ex
            ? m.reactions.map(r => r.emoji === emoji ? { ...r, count: r.mine ? r.count - 1 : r.count + 1, mine: !r.mine } : r).filter(r => r.count > 0)
            : [...m.reactions, { emoji, count: 1, mine: true }];
          return { ...m, reactions };
        }),
      }));
      return;
    }
    clientRef.current.publish({ destination: '/app/reaction.toggle', body: JSON.stringify({ messageId: msgId, emoji }) });
  }, [channelKey]);

  const deleteMessage = useCallback((msgId) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({ destination: '/app/message.delete', body: JSON.stringify({ messageId: msgId }) });
    } else {
      setMessages(prev => ({ ...prev, [channelKey]: (prev[channelKey] || []).filter(m => m.id !== msgId) }));
    }
  }, [channelKey]);

  const editMessage = useCallback((msgId, newText) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({ destination: '/app/message.edit', body: JSON.stringify({ messageId: msgId, newContent: newText }) });
    } else {
      setMessages(prev => ({ ...prev, [channelKey]: (prev[channelKey] || []).map(m => m.id === msgId ? { ...m, text: newText, edited: true } : m) }));
    }
  }, [channelKey]);

  const pinMessage = useCallback((msgId) => {
    setMessages(prev => ({
      ...prev,
      [channelKey]: (prev[channelKey] || []).map(m => m.id === msgId ? { ...m, pinned: !m.pinned } : m),
    }));
  }, [channelKey]);

  const markRead = useCallback((messageIds) => {
    clientRef.current?.publish({ destination: '/app/read.mark', body: JSON.stringify({ messageIds }) });
  }, []);

  const currentMessages = messages[channelKey] || [];
  const pinnedMsg = currentMessages.find(m => m.pinned);

  return (
    <ChatContext.Provider value={{
      activeServer, setActiveServer,
      activeChannel, setActiveChannel,
      currentMessages,
      sendMessage, sendTyping,
      replyingTo, setReplyingTo,
      typingUsers,
      toggleReaction, deleteMessage, editMessage, pinMessage, markRead,
      connected, pinnedMsg,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
