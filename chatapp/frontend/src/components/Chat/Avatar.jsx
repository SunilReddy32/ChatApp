import './Avatar.css';

const STATUS_COLOR = { online: '#3dd68c', offline: '#5a5c7a', idle: '#f0c060', dnd: '#f7706a' };

export default function Avatar({ user, size = 36, showStatus = false, status }) {
  const resolvedStatus = status || user?.status;
  return (
    <div
      className="avatar-wrap"
      style={{ width: size, height: size, '--av-size': size + 'px' }}
      aria-hidden="true"
    >
      <div
        className="avatar"
        style={{ background: user?.bg || '#2e324a', color: user?.color || '#9d8fff', fontSize: size * 0.35 }}
      >
        {user?.initials || '?'}
      </div>
      {showStatus && resolvedStatus && (
        <div
          className="status-dot"
          style={{ background: STATUS_COLOR[resolvedStatus] || STATUS_COLOR.offline }}
        />
      )}
    </div>
  );
}
