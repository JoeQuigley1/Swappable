// src/api/swapRequests.js
// Matches the fetch-based pattern in BrowseItemsPage; adds the JWT for protected calls.

import { API_BASE_URL } from './config.js'

const BASE = API_BASE_URL

function authHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function handle(res) {
  if (res.status === 401) throw new Error('unauthenticated')
  if (!res.ok) {
    let msg = 'Request failed'
    try { msg = (await res.json()).error || msg } catch {}
    throw new Error(msg)
  }
  if (res.status === 204) return null
  return res.json()
}


export function getReceivedSwapRequests(page = 0, size = 20) {
   return fetch(`${BASE}/swap-requests/received?page=${page}&size=${size}`, { headers: authHeaders() }).then(handle)
}

export function getSentSwapRequests(page = 0, size = 20) {
    return fetch(`${BASE}/swap-requests/sent?page=${page}&size=${size}`, { headers: authHeaders() }).then(handle)
}

export function createSwapRequest(requestedItemId, offeredItemId, message) {
  return fetch(`${BASE}/swap-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ requestedItemId, offeredItemId, message }),
  }).then(handle)
}

export function acceptSwapRequest(id) {
  return fetch(`${BASE}/swap-requests/${id}/accept`, { method: 'POST', headers: authHeaders() }).then(handle)
}

export function declineSwapRequest(id) {
  return fetch(`${BASE}/swap-requests/${id}/decline`, { method: 'POST', headers: authHeaders() }).then(handle)
}

export function cancelSwapRequest(id) {
  return fetch(`${BASE}/swap-requests/${id}/cancel`, { method: 'PUT', headers: authHeaders() }).then(handle)
}

// Used by ItemDetailPage to fill the "what do you offer" dropdown.
export async function getMyAvailableItems() {

  const data = await fetch(`${BASE}/items/my-items?size=1000`, { headers: authHeaders() }).then(handle)
  const items = data.content ?? []

  return items.filter((i) => (i.status || 'available').toLowerCase() !== 'swapped')
}