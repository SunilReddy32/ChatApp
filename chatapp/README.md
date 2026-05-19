# ⚡ NexChat — Real-time Chat App

A full-stack real-time messaging app with Discord layout + WhatsApp reliability.

## ✨ Features

### Unique Features (not in WhatsApp or Discord)
- 🎯 **Focus Mode** — hides all UI chrome, centers the chat in a clean reading column
- 🔍 **Inline Message Search** — search and highlight matches without leaving the channel
- ✉️ **OTP Email Verification** — 6-digit code verification on registration

### Core Features
- 💬 Real-time WebSocket messaging via STOMP
- 🔒 JWT authentication (register/login)
- 👍 Emoji reactions (toggle)
- 📌 Pin messages
- ✏️ Edit & delete your messages
- ↩️ Reply to messages
- 📎 File/image attachments
- ⌨️ Live typing indicators (real users only — no bots)
- ✅ Read receipts
- 🔔 Status indicator (Online / Idle / DND / Invisible)
- 🌐 WebSocket connection indicator

---

## 🚀 Running Locally

### Prerequisites
- Java 17+, Maven 3.8+
- Node.js 18+, npm
- PostgreSQL 14+

### Backend
```bash
# 1. Create database
psql -U postgres -c "CREATE DATABASE chatapp;"

# 2. Edit application.yml
#    Set: spring.datasource.password
#         app.jwt.secret  (32+ char random string)
#         spring.mail.username / password  (Gmail + App Password)

cd chatapp/backend
mvn spring-boot:run
# → Runs on http://localhost:8080
```

### Frontend
```bash
cd chatapp/frontend
npm install
npm run dev
# → Opens http://localhost:5173
```

### Email (OTP) Setup
For Gmail:
1. Enable 2FA on your Google account
2. Generate an App Password (Google Account → Security → App Passwords)
3. Set in `application.yml`:
   ```yaml
   spring.mail.username: your@gmail.com
   spring.mail.password: xxxx-xxxx-xxxx-xxxx
   ```

For development without email, use [Mailhog](https://github.com/mailhog/MailHog):
```bash
# macOS
brew install mailhog && mailhog
# Then set spring.mail.host=localhost, spring.mail.port=1025
```

---

## 🏗️ Architecture

```
Frontend (React + Vite)
  ├── AuthContext       — JWT token + user state
  ├── ChatContext       — WebSocket STOMP client, message state
  ├── LoginPage         — Login / Register + OTP flow
  ├── ChatArea          — Messages, search, focus mode
  ├── MessageInput      — Typing events, file upload
  └── Sidebar           — Channels, status menu, sign out

Backend (Spring Boot 3.2)
  ├── SecurityConfig    — JWT filter + UserDetailsService bean
  ├── AuthController    — /api/auth/register|login|me
  ├── OtpController     — /api/auth/send-otp|verify-otp
  ├── ChatController    — WebSocket STOMP handlers
  ├── FileController    — /api/files/upload
  ├── MessageService    — send/edit/delete/react/history
  ├── OtpService        — In-memory OTP store (10min TTL)
  └── JwtService        — Token generate/validate
```
