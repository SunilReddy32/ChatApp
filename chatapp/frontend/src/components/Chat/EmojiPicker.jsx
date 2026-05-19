import { useState, useEffect, useRef } from 'react';
import './EmojiPicker.css';

const EMOJI_CATS = {
  'Smileys': ['😊','😂','🥰','😎','🤔','😅','😭','🤩','😤','🥱','😴','🤯','😱','🥳','😇','🤗','😏','🙄','😬','🤭'],
  'Gestures': ['👍','👎','👏','🙌','🤝','✌️','🤞','👋','🙏','💪','🤙','👌','🤘','✋','🖐','👈','👉','👆','👇','☝️'],
  'Objects': ['🔥','💡','⚡','🚀','🎯','🔧','🐛','📌','📝','💻','🖥','📱','⌨️','🖱','📂','🔑','💎','🏆','🎉','🎨'],
  'Symbols': ['❤️','💜','💙','💚','💛','🧡','🖤','💔','✅','❌','⚠️','ℹ️','🔔','📢','💯','🆕','🆘','✨','🌟','⭐'],
};

const ALL_EMOJIS = Object.values(EMOJI_CATS).flat();

export default function EmojiPicker({ onSelect, onClose, forInput }) {
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const emojis = search
    ? ALL_EMOJIS.filter(e => e.includes(search))
    : activeTab === 'All' ? ALL_EMOJIS : EMOJI_CATS[activeTab] || [];

  return (
    <div className="emoji-picker" ref={ref} role="dialog" aria-label="Emoji picker">
      <input
        className="emoji-search"
        type="text"
        placeholder="Search emoji..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        autoFocus
        aria-label="Search emoji"
      />

      {!search && (
        <div className="emoji-tabs" role="tablist">
          {['All', ...Object.keys(EMOJI_CATS)].map(tab => (
            <button
              key={tab}
              className={`emoji-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
              role="tab"
              aria-selected={activeTab === tab}
            >
              {tab === 'All' ? '🌐' : Object.values(EMOJI_CATS)[Object.keys(EMOJI_CATS).indexOf(tab)]?.[0]}
            </button>
          ))}
        </div>
      )}

      <div className="emoji-grid" role="group" aria-label="Emoji options">
        {emojis.map(e => (
          <button
            key={e}
            className="e-btn"
            onClick={() => onSelect(e)}
            aria-label={e}
            title={e}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
