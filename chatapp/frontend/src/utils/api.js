const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export function getToken() { return localStorage.getItem('chat_token'); }
export function getUser()  { return JSON.parse(localStorage.getItem('chat_user') || 'null'); }

function authHeaders(extra = {}) {
  const token = getToken();
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra };
}

async function handle(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function sendOtp(email) {
  return handle(await fetch(`${BASE}/api/auth/send-otp`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  }));
}

export async function verifyOtp(email, otp) {
  return handle(await fetch(`${BASE}/api/auth/verify-otp`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  }));
}

export async function register(username, displayName, password, email) {
  const data = await handle(await fetch(`${BASE}/api/auth/register`, {
    method: 'POST', headers: authHeaders(),
    body: JSON.stringify({ username, displayName, password, email }),
  }));
  localStorage.setItem('chat_token', data.token);
  localStorage.setItem('chat_user', JSON.stringify({ id: data.userId, username: data.username, displayName: data.displayName, avatarColor: data.avatarColor, status: data.status }));
  return data;
}

export async function login(username, password) {
  const data = await handle(await fetch(`${BASE}/api/auth/login`, {
    method: 'POST', headers: authHeaders(),
    body: JSON.stringify({ username, password }),
  }));
  localStorage.setItem('chat_token', data.token);
  localStorage.setItem('chat_user', JSON.stringify({ id: data.userId, username: data.username, displayName: data.displayName, avatarColor: data.avatarColor, status: data.status }));
  return data;
}

export async function getMe() {
  return handle(await fetch(`${BASE}/api/auth/me`, { headers: authHeaders() }));
}

export async function updateStatus(status) {
  return handle(await fetch(`${BASE}/api/auth/me/status`, {
    method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status }),
  }));
}

export function logout() {
  localStorage.removeItem('chat_token');
  localStorage.removeItem('chat_user');
}

export function uploadFile(file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append('file', file);
    xhr.open('POST', `${BASE}/api/files/upload`);
    const token = getToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => xhr.status < 300 ? resolve(JSON.parse(xhr.responseText)) : reject(new Error('Upload failed'));
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(form);
  });
}
