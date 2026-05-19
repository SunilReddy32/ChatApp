import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { login, register, sendOtp, verifyOtp } from '../utils/api';
import './AuthPage.css';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [mode, setMode]         = useState('login');   // login | register | otp-send | otp-verify
  const [form, setForm]         = useState({ username: '', password: '', displayName: '', email: '' });
  const [otp, setOtp]           = useState('');
  const [otpSent, setOtpSent]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [shake, setShake]       = useState(false);

  const err = (msg) => {
    setError(msg); setLoading(false);
    setShake(true); setTimeout(() => setShake(false), 500);
  };

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try { signIn(await login(form.username, form.password)); }
    catch (e) { err(e.message); }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      await sendOtp(form.email);
      setOtpSent(true); setLoading(false);
    } catch (e) { err(e.message); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      await verifyOtp(form.email, otp);
      const data = await register(form.username, form.displayName, form.password, form.email);
      signIn(data);
    } catch (e) { err(e.message); }
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="auth-bg">
      <div className="auth-logo">
        <span className="auth-logo-icon">⚡</span>
        <span className="auth-logo-text">NexChat</span>
      </div>

      <div className={`auth-card ${shake ? 'shake' : ''}`}>
        <div className="auth-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); }}>Sign In</button>
          <button className={mode === 'register' || mode === 'otp-verify' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); setOtpSent(false); }}>Create Account</button>
        </div>

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="auth-form">
            <h2>Welcome back</h2>
            <p className="auth-sub">Sign in to continue chatting</p>
            <label>Username<input autoFocus type="text" placeholder="your_username" value={form.username} onChange={f('username')} required /></label>
            <label>Password<input type="password" placeholder="••••••••" value={form.password} onChange={f('password')} required /></label>
            {error && <div className="auth-error">{error}</div>}
            <button type="submit" className="auth-btn" disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</button>
          </form>
        )}

        {mode === 'register' && !otpSent && (
          <form onSubmit={handleSendOtp} className="auth-form">
            <h2>Create account</h2>
            <p className="auth-sub">We'll send an OTP to verify your email</p>
            <label>Display Name<input autoFocus type="text" placeholder="Your Name" value={form.displayName} onChange={f('displayName')} required /></label>
            <label>Username<input type="text" placeholder="unique_username" value={form.username} onChange={f('username')} required minLength={3} maxLength={32} /></label>
            <label>Email<input type="email" placeholder="you@email.com" value={form.email} onChange={f('email')} required /></label>
            <label>Password<input type="password" placeholder="Min 8 characters" value={form.password} onChange={f('password')} required minLength={8} /></label>
            {error && <div className="auth-error">{error}</div>}
            <button type="submit" className="auth-btn" disabled={loading}>{loading ? 'Sending OTP…' : 'Send Verification Code'}</button>
          </form>
        )}

        {mode === 'register' && otpSent && (
          <form onSubmit={handleVerifyOtp} className="auth-form">
            <h2>Verify your email</h2>
            <p className="auth-sub">Enter the 6-digit code sent to <strong>{form.email}</strong></p>
            <div className="otp-row">
              {Array.from({ length: 6 }).map((_, i) => (
                <input
                  key={i}
                  className="otp-box"
                  type="text"
                  maxLength={1}
                  value={otp[i] || ''}
                  autoFocus={i === 0}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/, '');
                    const next = otp.split('');
                    next[i] = val;
                    setOtp(next.join(''));
                    if (val && e.target.nextSibling) e.target.nextSibling.focus();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !otp[i] && e.target.previousSibling) e.target.previousSibling.focus();
                  }}
                />
              ))}
            </div>
            {error && <div className="auth-error">{error}</div>}
            <button type="submit" className="auth-btn" disabled={loading || otp.length < 6}>{loading ? 'Verifying…' : 'Verify & Create Account'}</button>
            <button type="button" className="auth-link" onClick={() => { setOtpSent(false); setOtp(''); setError(''); }}>← Change email</button>
          </form>
        )}
      </div>

      <div className="auth-features">
        <span>⚡ Real-time</span>
        <span>🔒 Encrypted</span>
        <span>🌐 Cross-platform</span>
        <span>🎯 Focus Mode</span>
      </div>
    </div>
  );
}
