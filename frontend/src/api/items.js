const BASE = '/api';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(res) {
  if (res.status === 401) throw new Error('Unauthenticated');
  if (!res.ok) {
    let msg = 'Request failed';
    try {
      msg = (await res.json()).error || msg;
    } catch {
      msg = 'Request failed';
    }
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

// Create an item with 0–3 images. Always multipart so the backend's
// multipart handler (createItemWithImages) is the one that runs.
export function createItem({
  categoryId,
  title,
  description,
  condition,
  images = [],
}) {
  const form = new FormData();
  form.append('categoryId', categoryId);
  form.append('title', title);
  if (description) form.append('description', description);
  form.append('condition', condition);
  for (const file of images) {
    form.append('images', file);
  }

  return fetch(`${BASE}/items`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  }).then(handle);
}
