const BASE = (typeof window !== 'undefined' && (window as any).__AETHERLIGHT_API__) || 'http://localhost:8000';

export function listQuestions(p?: { mode?: string; level?: number; category?: string; limit?: number; offset?: number }) {
  const sp = new URLSearchParams();
  if (p?.mode) sp.set('mode', p.mode);
  if (p?.level != null) sp.set('level', String(p.level));
  if (p?.category) sp.set('category', p.category);
  if (p?.limit != null) sp.set('limit', String(p.limit));
  if (p?.offset != null) sp.set('offset', String(p.offset));
  return fetch(BASE + '/api/qa/questions?' + sp.toString()).then(r => r.json());
}

export function getQuestion(id: string) {
  return fetch(BASE + '/api/qa/questions/' + id).then(r => r.json());
}

export function submitAnswer(qid: string, answer: any, token: string, sessionId?: string) {
  return fetch(BASE + '/api/qa/questions/' + qid + '/answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ answer, session_id: sessionId })
  }).then(r => r.json());
}

export function gradeEssay(qid: string, userAnswer: string, token: string) {
  const sp = new URLSearchParams();
  sp.set('user_answer', userAnswer);
  return fetch(BASE + '/api/qa/questions/' + qid + '/grade?' + sp.toString(), {
    method: 'POST', headers: { Authorization: 'Bearer ' + token }
  }).then(r => r.json());
}

export function qaHistory(p: { f?: string; category?: string; limit?: number }, token: string) {
  const sp = new URLSearchParams();
  if (p?.f) sp.set('f', p.f);
  if (p?.category) sp.set('category', p.category);
  if (p?.limit != null) sp.set('limit', String(p.limit));
  return fetch(BASE + '/api/qa/history?' + sp.toString(), {
    headers: { Authorization: 'Bearer ' + token }
  }).then(r => r.json());
}

export function leaderboard(p?: { scope?: string; limit?: number }) {
  const sp = new URLSearchParams();
  if (p?.scope) sp.set('scope', p.scope);
  if (p?.limit != null) sp.set('limit', String(p.limit));
  return fetch(BASE + '/api/qa/leaderboard?' + sp.toString()).then(r => r.json());
}
