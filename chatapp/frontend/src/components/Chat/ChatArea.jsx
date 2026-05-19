import { useRef, useEffect, useState, useCallback } from 'react';
import { useChat, CHANNELS } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import Message from './Message';
import MessageInput from './MessageInput';
import EmojiPicker from './EmojiPicker';
import './ChatArea.css';

function formatDate(date) {
  const today = new Date();
  const d = new Date(date);
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yest = new Date(today); yest.setDate(today.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function groupMessages(messages) {
  const groups = [];
  let lastDate = null;
  messages.forEach((msg, i) => {
    const dateLabel = formatDate(msg.time);
    if (dateLabel !== lastDate) { groups.push({ type: 'separator', label: dateLabel }); lastDate = dateLabel; }
    const prev = messages[i - 1];
    const continued = prev && prev.author?.id === msg.author?.id && !msg.replyTo
      && (new Date(msg.time) - new Date(prev.time)) < 5 * 60 * 1000
      && formatDate(prev.time) === dateLabel;
    groups.push({ type: 'message', msg, continued });
  });
  return groups;
}

export default function ChatArea({ onToggleMembers }) {
  const { activeServer, activeChannel, currentMessages, typingUsers, replyingTo, setReplyingTo, toggleReaction, pinnedMsg, markRead } = useChat();
  const { user } = useAuth();
  const bottomRef = useRef(null);
  const messagesRef = useRef(null);
  const [emojiPickerFor, setEmojiPickerFor] = useState(null);
  const [pinnedVisible, setPinnedVisible]   = useState(true);
  const [searchOpen, setSearchOpen]         = useState(false);
  const [searchQuery, setSearchQuery]       = useState('');
  const [focusMode, setFocusMode]           = useState(false);
  const [jumpToBottom, setJumpToBottom]     = useState(false);

  const channel = CHANNELS[activeServer]?.find(c => c.id === activeChannel);
  const groups  = groupMessages(currentMessages);

  const filteredGroups = searchQuery
    ? groups.filter(g => g.type === 'separator' || g.msg.text?.toLowerCase().includes(searchQuery.toLowerCase()) || g.msg.author?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : groups;

  useEffect(() => {
    if (!searchQuery) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages.length, searchQuery]);

  // Mark visible messages as read
  useEffect(() => {
    const unread = currentMessages.filter(m => !m.isOwn && m.status !== 'read').map(m => m.id);
    if (unread.length) markRead(unread);
  }, [currentMessages]);

  const handleScroll = useCallback(() => {
    const el = messagesRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    setJumpToBottom(!nearBottom);
  }, []);

  return (
    <main className={`chat-area ${focusMode ? 'focus-mode' : ''}`}>
      {!focusMode && pinnedVisible && pinnedMsg && (
        <div className="pinned-bar" role="banner">
          <i className="ti ti-pin" />
          <span className="pinned-text">📌 {pinnedMsg.text}</span>
          <button className="icon-btn pinned-close" onClick={() => setPinnedVisible(false)}>
            <i className="ti ti-x" />
          </button>
        </div>
      )}

      <header className="chat-header">
        {!focusMode && <i className="ti ti-hash ch-icon" />}
        <h1 className="ch-title">{channel?.name ?? activeChannel}</h1>
        {!focusMode && channel?.desc && <span className="ch-desc">{channel.desc}</span>}
        <div className="header-actions">
          <button className={`icon-btn ${searchOpen ? 'active-icon' : ''}`} title="Search messages" onClick={() => setSearchOpen(s => !s)}>
            <i className="ti ti-search" />
          </button>
          <button className={`icon-btn ${focusMode ? 'active-icon' : ''}`} title="Focus Mode" onClick={() => setFocusMode(f => !f)}>
            <i className={`ti ti-${focusMode ? 'maximize' : 'minimize'}`} />
          </button>
          {!focusMode && (
            <>
              <button className="icon-btn" title="Toggle Members" onClick={onToggleMembers}>
                <i className="ti ti-users" />
              </button>
              <button className="icon-btn" title="Notification Settings">
                <i className="ti ti-bell" />
              </button>
            </>
          )}
        </div>
      </header>

      {searchOpen && (
        <div className="search-bar">
          <i className="ti ti-search" style={{ color: 'var(--text3)' }} />
          <input
            autoFocus
            className="search-input"
            placeholder="Search messages…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <span className="search-results-count">
              {filteredGroups.filter(g => g.type === 'message').length} results
            </span>
          )}
          <button className="icon-btn" onClick={() => { setSearchOpen(false); setSearchQuery(''); }}>
            <i className="ti ti-x" />
          </button>
        </div>
      )}

      <section className="messages" ref={messagesRef} onScroll={handleScroll} aria-label="Messages">
        {filteredGroups.length === 0 && searchQuery && (
          <div className="empty-state">
            <i className="ti ti-search" style={{ fontSize: 40, color: 'var(--text3)' }} />
            <p>No messages matching "<strong>{searchQuery}</strong>"</p>
          </div>
        )}
        {filteredGroups.length === 0 && !searchQuery && (
          <div className="empty-state">
            <i className="ti ti-message-circle" style={{ fontSize: 48, color: 'var(--text3)' }} />
            <p>No messages yet. Say hello! 👋</p>
          </div>
        )}

        {filteredGroups.map((g, i) =>
          g.type === 'separator'
            ? <div key={i} className="day-sep"><span>{g.label}</span></div>
            : <Message
                key={g.msg.id}
                msg={g.msg}
                continued={g.continued}
                searchQuery={searchQuery}
                onReact={(emoji) => toggleReaction(g.msg.id, emoji)}
                onOpenEmoji={() => setEmojiPickerFor(g.msg.id)}
                onReply={() => setReplyingTo({ id: g.msg.id, author: g.msg.author, text: g.msg.text })}
              />
        )}

        {typingUsers.length > 0 && (
          <div className="typing-bar" aria-live="polite">
            <div className="typing-dots"><span /><span /><span /></div>
            <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </section>

      {jumpToBottom && (
        <button className="jump-to-bottom" onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}>
          <i className="ti ti-arrow-down" /> Jump to present
        </button>
      )}

      {replyingTo && (
        <div className="reply-bar">
          <i className="ti ti-arrow-back-up" />
          <span>Replying to <strong>{replyingTo.author?.name}</strong></span>
          <span className="reply-preview">{replyingTo.text?.substring(0, 60)}{replyingTo.text?.length > 60 ? '…' : ''}</span>
          <button className="icon-btn" onClick={() => setReplyingTo(null)}><i className="ti ti-x" /></button>
        </div>
      )}

      <MessageInput
        placeholder={`Message #${channel?.name ?? activeChannel}`}
        onOpenEmoji={() => setEmojiPickerFor('input')}
      />

      {emojiPickerFor && (
        <EmojiPicker
          onSelect={(emoji) => {
            if (emojiPickerFor !== 'input') toggleReaction(emojiPickerFor, emoji);
            setEmojiPickerFor(null);
          }}
          onClose={() => setEmojiPickerFor(null)}
          forInput={emojiPickerFor === 'input'}
        />
      )}
    </main>
  );
}
