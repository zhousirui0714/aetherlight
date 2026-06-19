// 与古人对话 API（功能 4 + 5）
export type ChatEvent =
  | { type: 'start' | 'done' | 'error'; session_id?: string; tokens?: number; message?: string }
  | { type: 'delta'; content: string }
  | { type: 'quote'; content: string };

const BASE = (typeof window !== 'undefined' && (window as any).__AETHERLIGHT_API__) || 'http://localhost:8000';

export function getCharacterList(p?: { dynasty?: string; tag?: string; keyword?: string }) {
  const sp = new URLSearchParams();
  if (p?.dynasty) sp.set('dynasty', p.dynasty);
  if (p?.tag) sp.set('tag', p.tag);
  if (p?.keyword) sp.set('keyword', p.keyword);
  const q = sp.toString();
  return fetch(`${BASE}/api/characters${q ? '?' + q : ''}`).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
}

export function getCharacterDetail(id: string) {
  return fetch(`${BASE}/api/characters/${id}`).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
}

export async function* sendMessage(
  p: { character_id: string; message: string; session_id?: string; city?: string },
  token?: string,
) {
  const res = await fetch(`${BASE}/api/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(p),
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = (lines.pop() ?? '');
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (!raw) continue;
        try { yield JSON.parse(raw) as ChatEvent; } catch {}
      }
    }
  } finally { try { reader.cancel(); } catch {} }
}

export function getSessionList(p?: { character_id?: string; limit?: number; offset?: number }, token: string) {
  const sp = new URLSearchParams();
  if (p?.character_id) sp.set('character_id', p.character_id);
  if (p?.limit != null) sp.set('limit', String(p.limit));
  if (p?.offset != null) sp.set('offset', String(p.offset));
  const q = sp.toString();
  return fetch(`${BASE}/api/chat/history${q ? '?' + q : ''}`, { headers: { Authorization: `Bearer ${token}` } })
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
}

export function getSessionMessages(sid: string, token: string) {
  return fetch(`${BASE}/api/chat/history/${sid}`, { headers: { Authorization: `Bearer ${token}` } })
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
}

export function shareSession(sid: string, messageIds: string[], fmt: 'link' | 'image' = 'link', token: string) {
  return fetch(`${BASE}/api/chat/share?session_id=${sid}&share_format=${fmt}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ session_id: sid, message_ids: messageIds, share_format: fmt }),
  }).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
}
