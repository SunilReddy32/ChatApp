import { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import Avatar from './Avatar';
import './Message.css';

function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function Highlight({ text, query }) {
  if (!query) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return <>{parts.map((p, i) => p.toLowerCase() === query.toLowerCase() ? <mark key={i} className="search-highlight">{p}</mark> : p)}</>;
}

function StatusIcon({ status }) {
  if (status === 'sending')   return <i className="ti ti-clock" title="Sending" />;
  if (status === 'delivered') return <i className="ti ti-check" style={{ color: 'var(--text3)' }} title="Delivered" />;
  if (status === 'read')      return <i className="ti ti-checks" style={{ color: '#5bbfef' }} title="Read" />;
  return null;
}

export default function Message({ msg, continued, searchQuery, onReact, onOpenEmoji, onReply }) {
  const { deleteMessage, editMessage, pinMessage, toggleReaction } = useChat();
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(msg.text || '');
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isOwn = msg.author?.username === user?.username || msg.isOwn;

  const handleEdit = () => {
    if (editText.trim()) { editMessage(msg.id, editText.trim()); setEditing(false); }
  };

  return (
    <div
      className={`msg-row ${continued ? 'continued' : ''} ${hovered ? 'hovered' : ''} ${msg.pinned ? 'pinned' : ''} ${searchQuery && (msg.text?.toLowerCase().includes(searchQuery.toLowerCase())) ? 'search-match' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false); }}
    >
      {!continued
        ? <Avatar user={msg.author} size={36} />
        : <div className="msg-time-stub">{formatTime(msg.time)}</div>
      }

      <div className="msg-body">
        {!continued && (
          <div className="msg-meta">
            <span className="msg-author" style={{ color: msg.author?.color || 'var(--accent)' }}>{msg.author?.name}</span>
            {isOwn && <span className="you-badge">You</span>}
            {msg.pinned && <span className="pin-badge">📌 Pinned</span>}
            <span className="msg-time">{formatTime(msg.time)}</span>
            {msg.edited && <span className="edited-tag">(edited)</span>}
          </div>
        )}

        {msg.replyTo && (
          <div className="reply-context">
            <i className="ti ti-arrow-back-up" style={{ fontSize: 12 }} />
            <span className="reply-author" style={{ color: 'var(--accent3)' }}>{msg.replyTo.author?.name || 'Unknown'}</span>
            <span className="reply-text">{msg.replyTo.text?.substring(0, 80)}</span>
          </div>
        )}

        {editing ? (
          <div className="edit-area">
            <textarea
              className="edit-input"
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEdit(); } if (e.key === 'Escape') setEditing(false); }}
              autoFocus
            />
            <div className="edit-actions">
              <button onClick={() => setEditing(false)}>Cancel</button>
              <button className="save-btn" onClick={handleEdit}>Save</button>
            </div>
          </div>
        ) : (
          <p className="msg-text">
            {msg.text ? <Highlight text={msg.text} query={searchQuery} /> : <em className="deleted-text">Message deleted</em>}
          </p>
        )}

        {msg.attachments?.map((att, i) =>
          att.type === 'IMAGE' || att.type === 'image'
            ? <div key={i} className="img-attach"><div className="img-placeholder">🖼️</div><div className="img-caption">{att.filename || att.name} · {att.size} bytes</div></div>
            : <div key={i} className="file-attach">
                <i className="ti ti-file file-icon" style={{ color: 'var(--accent)' }} />
                <div className="file-info"><span className="fname">{att.filename || att.name}</span><span className="fsize">{att.size} bytes</span></div>
                <a href={att.url} target="_blank" rel="noreferrer" className="file-dl">↓ Save</a>
              </div>
        )}

        {msg.reactions?.length > 0 && (
          <div className="reactions-row">
            {msg.reactions.map(r => (
              <button key={r.emoji} className={`reaction ${r.mine ? 'mine' : ''}`} onClick={() => toggleReaction(msg.id, r.emoji)}>
                {r.emoji} <span className="r-count">{r.count}</span>
              </button>
            ))}
            <button className="reaction add-reaction" onClick={onOpenEmoji} title="Add reaction">
              <i className="ti ti-mood-plus" style={{ fontSize: 13 }} />
            </button>
          </div>
        )}

        {isOwn && msg.status && (
          <div className="read-status"><StatusIcon status={msg.status} /></div>
        )}

        {!isOwn && msg.readers?.length > 0 && (
          <div className="reader-row">
            <span className="seen-by">Seen</span>
            <i className="ti ti-checks" style={{ color: '#5bbfef', fontSize: 13 }} />
          </div>
        )}
      </div>

      {hovered && (
        <div className="msg-actions" role="toolbar">
          <button className="action-btn" onClick={onOpenEmoji} title="React"><i className="ti ti-mood-smile" /></button>
          <button className="action-btn" onClick={onReply} title="Reply"><i className="ti ti-arrow-back-up" /></button>
          <button className="action-btn" onClick={() => pinMessage(msg.id)} title={msg.pinned ? 'Unpin' : 'Pin'}><i className="ti ti-pin" /></button>
          {isOwn && (
            <>
              <button className="action-btn" onClick={() => { setEditing(true); setEditText(msg.text || ''); }} title="Edit"><i className="ti ti-edit" /></button>
              <button className="action-btn danger" onClick={() => deleteMessage(msg.id)} title="Delete"><i className="ti ti-trash" /></button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
