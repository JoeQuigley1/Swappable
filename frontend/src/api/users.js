// src/api/users.js
// Profile read/update, matching the fetch + JWT pattern in swapRequests.js

import { API_BASE_URL } from './config.js';

const BASE = API_BASE_URL;

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(res) {
  if (res.status === 401) throw new Error('unauthenticated');
  if (!res.ok) {
    let msg = 'Request failed';
    try {
      msg = (await res.json()).error || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export function getMyProfile() {
  return fetch(`${BASE}/users/me`, { headers: authHeaders() }).then(handle);
}

export function getPublicProfile(id, page = 0, size = 18) {
  return fetch(`${BASE}/users/${id}?page=${page}&size=${size}`).then(handle);
}

export function updateMyProfile(data) {
  return fetch(`${BASE}/users/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  }).then(handle);
}
