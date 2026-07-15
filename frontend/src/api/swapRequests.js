// src/api/swapRequests.js
// Matches the fetch-based pattern in BrowseItemsPage; adds the JWT for protected calls.

const BASE = import.meta.env.VITE_API_BASE_URL || '/api'

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

export function getReceivedSwapRequests() {
  return fetch(`${BASE}/swap-requests/received`, { headers: authHeaders() }).then(handle)
}

export function getSentSwapRequests() {
  return fetch(`${BASE}/swap-requests/sent`, { headers: authHeaders() }).then(handle)
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

  const items = await fetch(`${BASE}/items/my-items`, { headers: authHeaders() }).then(handle)

  return items.filter((i) => (i.status || 'available').toLowerCase() !== 'swapped')
}