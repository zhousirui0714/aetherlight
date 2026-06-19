const BASE = (typeof window !== 'undefined' && (window as any).__AETHERLIGHT_API__) || 'http://localhost:8000';

export function createImage(prompt: string, style: string, token: string, size = 'square', count = 1) {
  return fetch(BASE + '/api/art/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ prompt, style, size, count })
  }).then(r => r.json());
}

export function getImageTask(taskId: string) {
  return fetch(BASE + '/api/art/image/' + taskId).then(r => r.json());
}

export function createMusic(prompt: string, token: string, duration_sec = 10, tempo = 'medium') {
  return fetch(BASE + '/api/art/music', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ prompt, duration_sec, tempo })
  }).then(r => r.json());
}

export function getMusicTask(taskId: string) {
  return fetch(BASE + '/api/art/music/' + taskId).then(r => r.json());
}

export function gallery(p?: { type?: string; limit?: number; sort?: string }) {
  const sp = new URLSearchParams();
  if (p?.type) sp.set('art_type', p.type);
  if (p?.sort) sp.set('sort', p.sort);
  if (p?.limit) sp.set('limit', String(p.limit));
  return fetch(BASE + '/api/art/gallery?' + sp.toString()).then(r => r.json());
}

export function saveToGallery(taskId: string, title: string, description: string, token: string, isPublic = true) {
  return fetch(BASE + '/api/art/gallery', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ task_id: taskId, title, description, is_public: isPublic })
  }).then(r => r.json());
}

export function likeGallery(gid: string, token: string) {
  return fetch(BASE + '/api/art/gallery/' + gid + '/like', {
    method: 'POST', headers: { Authorization: 'Bearer ' + token }
  }).then(r => r.json());
}
