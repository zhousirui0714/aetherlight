const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8000';

export type AskParams = {
  question: string;
  category?: string;
  history?: any[];
};

export type QAStreamEvent =
  | { type: 'retrieved'; chunks: Array<{ text: string; source: string }>; }
  | { type: 'delta'; content: string }
  | { type: 'done'; total_tokens?: number }
  | { type: 'error'; message?: string };

export async function* askQuestionStream(params: AskParams): AsyncGenerator<QAStreamEvent> {
  const url = `${API_BASE}/api/knowledge/qa/ask?stream=true`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || res.statusText);
  }

  if (!res.body) {
    // fallback: non-stream response
    const obj = await res.json();
    if (obj.answer) yield { type: 'done', total_tokens: obj.total_tokens };
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf('\n\n')) !== -1) {
      const chunk = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 2);
      if (!chunk) continue;
      try {
        const obj = JSON.parse(chunk);
        if (obj.type === 'retrieved') {
          yield { type: 'retrieved', chunks: obj.chunks || [] };
        } else if (obj.type === 'delta') {
          yield { type: 'delta', content: obj.content || '' };
        } else if (obj.type === 'done') {
          yield { type: 'done', total_tokens: obj.total_tokens };
        } else if (obj.type === 'error') {
          yield { type: 'error', message: obj.message || 'unknown' };
        }
      } catch (e) {
        // not JSON — treat as delta
        yield { type: 'delta', content: chunk };
      }
    }
  }

  const left = buf.trim();
  if (left) {
    try {
      const obj = JSON.parse(left);
      if (obj.type === 'done') yield { type: 'done', total_tokens: obj.total_tokens };
      else if (obj.type === 'error') yield { type: 'error', message: obj.message || 'unknown' };
      else if (obj.type === 'delta') yield { type: 'delta', content: obj.content || '' };
    } catch (e) {
      yield { type: 'delta', content: left };
    }
  }
}

export async function fetchArticles(opts: { category?: string; keyword?: string; limit?: number; offset?: number } = {}) {
  const { category, keyword, limit = 12, offset = 0 } = opts;
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  params.set('offset', String(offset));
  if (category) params.set('category', category);
  if (keyword) params.set('keyword', keyword);
  const url = `${API_BASE}/api/knowledge/articles?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function fetchArticle(id: string) {
  const url = `${API_BASE}/api/knowledge/articles/${id}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}
