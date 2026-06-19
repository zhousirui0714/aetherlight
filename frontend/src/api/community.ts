const BASE = (typeof window !== 'undefined' && (window as any).__AETHERLIGHT_API__) || 'http://localhost:8000';

export function listPosts(p?: { topic?: string; sort?: string; limit?: number }) {
  const sp = new URLSearchParams();
  if (p?.topic) sp.set('topic', p.topic);
  if (p?.sort) sp.set('sort', p.sort);
  if (p?.limit) sp.set('limit', String(p.limit));
  return fetch(BASE + '/api/community/posts?' + sp.toString()).then(r => r.json());
}

export function createPost(topic: string, title: string, content: string, attachments: string[], token: string) {
  return fetch(BASE + '/api/community/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ topic, title, content, attachments })
  }).then(r => r.json());
}

export function getPost(pid: string) {
  return fetch(BASE + '/api/community/posts/' + pid).then(r => r.json());
}

export function replyPost(pid: str, content: string, token: string, replyToId?: string) {
  return fetch(BASE + '/api/community/posts/' + pid + '/reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ content, reply_to_id: replyToId })
  }).then(r => r.json());
}

export function likePost(pid: string, token: string) {
  return fetch(BASE + '/api/community/posts/' + pid + '/like', {
    method: 'POST', headers: { Authorization: 'Bearer ' + token }
  }).then(r => r.json());
}

export function listRooms() {
  return fetch(BASE + '/api/community/rooms').then(r => r.json());
}

export function sendChatMessage(rid: string, content: string, token: string) {
  return fetch(BASE + '/api/community/rooms/' + rid + '/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ content })
  }).then(r => r.json());
}

export function getChatMessages(rid: string, token: string, since?: string, limit = 50) {
  const sp = new URLSearchParams();
  if (since) sp.set('since', since);
  if (limit) sp.set('limit', String(limit));
  return fetch(BASE + '/api/community/rooms/' + rid + '/messages?' + sp.toString(), {
    headers: { Authorization: 'Bearer ' + token }
  }).then(r => r.json());
}

export function report(targetType: string, targetId: string, reason: string, token: string) {
  return fetch(BASE + '/api/community/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ target_type: targetType, target_id: targetId, reason })
  }).then(r => r.json());
}
