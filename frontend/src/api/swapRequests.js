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
    try { msg = (await res.json()).error || msg } catch { /* response body was not json */ }
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

export function confirmSwapRequest(id) {
  return fetch(`${BASE}/swap-requests/${id}/confirm`, { method: 'POST', headers: authHeaders() }).then(handle)
}

// walks away from an accepted swap that never got confirmed, freeing both items again
export function abandonSwapRequest(id) {
  return fetch(`${BASE}/swap-requests/${id}/abandon`, { method: 'POST', headers: authHeaders() }).then(handle)
}

export function cancelSwapRequest(id) {
  return fetch(`${BASE}/swap-requests/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handle)
}

// Used by ItemDetailPage to fill the "what do you offer" dropdown.
// Pages through the paginated my-items endpoint (using the backend's own page
// size) to gather every item, rather than requesting one huge page.
export async function getMyAvailableItems() {
  const items = []
  let page = 0
  let last = false

  while (!last) {
    const data = await fetch(`${BASE}/items/my-items?page=${page}`, { headers: authHeaders() }).then(handle)
    items.push(...(data?.content ?? []))
    last = data?.last ?? true
    page += 1
  }

  return items.filter((i) => (i.status || 'available').toLowerCase() !== 'swapped')
}