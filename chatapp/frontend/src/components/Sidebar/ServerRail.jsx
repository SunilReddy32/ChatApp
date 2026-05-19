import { useChat, SERVERS } from '../../context/ChatContext';
import './ServerRail.css';

export default function ServerRail() {
  const { activeServer, setActiveServer } = useChat();

  return (
    <nav className="server-rail" aria-label="Servers">
      {SERVERS.map((s, i) => (
        <div key={s.id}>
          {i === 1 && <div className="s-sep" />}
          <button
            className={`s-icon ${s.id === activeServer ? 'active' : ''} ${s.type === 'home' ? 'home' : ''}`}
            onClick={() => setActiveServer(s.id)}
            title={s.name}
            aria-label={s.name}
            aria-pressed={s.id === activeServer}
          >
            {s.icon || s.initials}
          </button>
        </div>
      ))}
      <div className="s-sep" />
      <button className="s-icon add" title="Add Server" aria-label="Add Server">+</button>
    </nav>
  );
}
