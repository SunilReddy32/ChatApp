import { useAuth } from '../../context/AuthContext';
import { useChat, CHANNELS, SERVERS } from '../../context/ChatContext';
import Avatar from '../Chat/Avatar';
import './MembersPanel.css';

export default function MembersPanel() {
  const { user } = useAuth();
  const { activeServer, activeChannel } = useChat();
  const channel = CHANNELS[activeServer]?.find(c => c.id === activeChannel);

  const selfUser = {
    id: user?.id,
    name: user?.displayName || user?.username,
    username: user?.username,
    initials: (user?.displayName || user?.username || '?').slice(0, 2).toUpperCase(),
    color: user?.avatarColor || '#7c6af7',
    bg: '#2e324a',
    status: 'online',
    isYou: true,
  };

  return (
    <aside className="members-panel" aria-label="Member list">
      <div className="members-header">
        <span>Members</span>
      </div>
      <div className="members-section-label">Online — 1</div>
      <MemberRow member={selfUser} />

      <div className="members-section-label" style={{ marginTop: 12 }}>Channel Info</div>
      {channel && (
        <div className="channel-info-card">
          <div className="ci-name"># {channel.name}</div>
          {channel.desc && <div className="ci-desc">{channel.desc}</div>}
        </div>
      )}

      <div className="members-section-label" style={{ marginTop: 12 }}>About NexChat</div>
      <div className="feature-list">
        <div className="feature-item"><span>⚡</span> Real-time messaging</div>
        <div className="feature-item"><span>🔒</span> JWT-secured API</div>
        <div className="feature-item"><span>📎</span> File attachments</div>
        <div className="feature-item"><span>😄</span> Emoji reactions</div>
        <div className="feature-item"><span>📌</span> Pin messages</div>
        <div className="feature-item"><span>🔍</span> Message search</div>
        <div className="feature-item"><span>🎯</span> Focus mode</div>
        <div className="feature-item"><span>✉️</span> OTP verification</div>
      </div>
    </aside>
  );
}

function MemberRow({ member }) {
  return (
    <button className="member-item" aria-label={member.name}>
      <Avatar user={member} size={30} showStatus status={member.status} />
      <div className="member-info">
        <span className="member-name online">{member.name}</span>
        {member.isYou && <span className="you-tag">you</span>}
      </div>
    </button>
  );
}
