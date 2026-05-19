import { useState } from 'react';
import { useChat, CHANNELS, SERVERS } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../Chat/Avatar';
import './Sidebar.css';

const STATUS_OPTS = [
  { value: 'ONLINE', label: 'Online', color: '#3dd68c' },
  { value: 'IDLE',   label: 'Idle',   color: '#f0c060' },
  { value: 'DND',    label: 'Do Not Disturb', color: '#f7706a' },
  { value: 'OFFLINE',label: 'Invisible', color: '#5a5c7a' },
];

export default function Sidebar() {
  const { activeServer, activeChannel, setActiveChannel, connected } = useChat();
  const { user, signOut } = useAuth();
  const [statusMenu, setStatusMenu] = useState(false);
  const [userStatus, setUserStatus] = useState('ONLINE');
  const server   = SERVERS.find(s => s.id === activeServer);
  const channels = CHANNELS[activeServer] || [];

  const avatarUser = {
    initials: (user?.displayName || user?.username || '?').slice(0, 2).toUpperCase(),
    color: user?.avatarColor || '#7c6af7',
    bg: '#2e324a',
  };

  const currentStatus = STATUS_OPTS.find(s => s.value === userStatus) || STATUS_OPTS[0];

  return (
    <aside className="sidebar">
      <div className="server-header">
        <span className="server-name">{server?.name ?? 'Direct Messages'}</span>
        <div className="ws-indicator" title={connected ? 'Connected' : 'Reconnecting…'}>
          <span className={`ws-dot ${connected ? 'connected' : 'disconnected'}`} />
        </div>
      </div>

      {channels.length > 0 && (
        <div className="ch-section">
          <div className="ch-label">
            <span>Text Channels</span>
            <button className="ch-add-btn" title="Create Channel" aria-label="Create Channel">
              <i className="ti ti-plus" />
            </button>
          </div>
          {channels.map(ch => (
            <button
              key={ch.id}
              className={`ch-item ${ch.id === activeChannel ? 'active' : ''}`}
              onClick={() => setActiveChannel(ch.id)}
            >
              <i className={`ti ti-${ch.icon} ch-icon`} />
              <span className="ch-name">{ch.name}</span>
              {ch.badge && <span className="badge">{ch.badge}</span>}
            </button>
          ))}
        </div>
      )}

      <div className="user-bar">
        <div className="user-avatar-wrap" onClick={() => setStatusMenu(s => !s)}>
          <Avatar user={avatarUser} size={32} showStatus status={userStatus.toLowerCase()} />
        </div>
        <div className="user-info">
          <div className="uname">{user?.displayName || user?.username}</div>
          <div className="utag" style={{ color: currentStatus.color }}>{currentStatus.label}</div>
        </div>
        <button className="icon-btn" title="Settings" onClick={() => setStatusMenu(s => !s)}>
          <i className="ti ti-settings" />
        </button>
        <button className="icon-btn" title="Sign out" onClick={signOut}>
          <i className="ti ti-logout" />
        </button>

        {statusMenu && (
          <div className="status-menu">
            <div className="status-menu-title">Set Status</div>
            {STATUS_OPTS.map(s => (
              <button key={s.value} className={`status-opt ${userStatus === s.value ? 'active' : ''}`} onClick={() => { setUserStatus(s.value); setStatusMenu(false); }}>
                <span className="status-dot-sm" style={{ background: s.color }} />
                {s.label}
              </button>
            ))}
            <div className="status-menu-sep" />
            <button className="status-opt danger" onClick={() => { setStatusMenu(false); signOut(); }}>
              <i className="ti ti-logout" style={{ fontSize: 14 }} /> Sign Out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
