import { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { uploadFile } from '../../utils/api';
import './MessageInput.css';

export default function MessageInput({ placeholder, onOpenEmoji }) {
  const { sendMessage, sendTyping } = useChat();
  const [text, setText]         = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const textareaRef = useRef(null);
  const fileRef     = useRef(null);
  const typingRef   = useRef(false);
  const typingTimer = useRef(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  const autoResize = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
  };

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed || uploading) return;
    sendMessage(trimmed);
    setText('');
    stopTyping();
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  const startTyping = () => {
    if (!typingRef.current) { typingRef.current = true; sendTyping(true); }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(stopTyping, 3000);
  };

  const stopTyping = () => {
    if (typingRef.current) { typingRef.current = false; sendTyping(false); }
    if (typingTimer.current) clearTimeout(typingTimer.current);
  };

  const handleChange = (e) => {
    setText(e.target.value);
    autoResize();
    if (e.target.value.trim()) startTyping();
    else stopTyping();
  };

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true); setUploadProgress(0);
    try {
      const result = await uploadFile(file, (p) => setUploadProgress(p));
      sendMessage(text.trim() || `Shared: ${file.name}`, result);
      setText('');
    } catch (e) {
      console.error('Upload failed:', e);
    } finally {
      setUploading(false); setUploadProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="input-area">
      <div
        className={`input-box ${dragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="input-left">
          <button className="attach-btn" title="Attach file" aria-label="Attach file" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <i className="ti ti-paperclip" />
          </button>
          <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx,.txt,.zip" style={{ display: 'none' }} onChange={e => handleFile(e.target.files?.[0])} />
        </div>

        <textarea
          ref={textareaRef}
          className="msg-input"
          placeholder={uploading ? `Uploading… ${uploadProgress}%` : placeholder}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKey}
          disabled={uploading}
          aria-label="Message input"
          rows={1}
        />

        <div className="input-right">
          <button className="emoji-trigger-btn" title="Emoji" aria-label="Open emoji picker" onClick={onOpenEmoji}>
            <i className="ti ti-mood-smile" />
          </button>
          <button className={`send-btn ${text.trim() && !uploading ? 'active' : ''}`} onClick={submit} disabled={!text.trim() || uploading} title="Send message">
            <i className="ti ti-send" />
          </button>
        </div>
      </div>

      {uploading && (
        <div className="upload-bar">
          <div className="upload-progress" style={{ width: uploadProgress + '%' }} />
        </div>
      )}
      {dragOver && (
        <div className="drop-overlay">
          <i className="ti ti-upload" />
          <span>Drop file to upload</span>
        </div>
      )}
    </div>
  );
}
