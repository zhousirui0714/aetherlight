// ============================================================
// 溯光 Aetherlight - 前端 API 封装
// 模块：知识分享 - 每日文化推送 / 知识长廊
// 与古人对话（后续）
// ============================================================

export const API_BASE =
  (typeof window !== 'undefined' && (window as any).__AETHERLIGHT_API__) ||
  'http://localhost:8000';

// ---------- 类型 ----------

export interface RecommendedArticle {
  id: string;
  title: string;
  category: string;
}

export interface DailyCard {
  id: string;
  date: string;
  lunar_date?: string | null;
  solar_term?: string | null;
  festival?: string | null;
  title: string;
  subtitle?: string | null;
  body: string;
  image_style?: string | null;
  weather_hint?: string | null;
  theme_tags: string[];
  recommended_articles: RecommendedArticle[];
  generated_at: string;
  source: string;
}

export interface DailyCardHistoryItem {
  id: string;
  date: string;
  title: string;
  theme_tags: string[];
}

export interface DailyCardHistoryResponse {
  total: number;
  items: DailyCardHistoryItem[];
}

// ---------- 参数 ----------

export interface GetDailyCardParams {
  date?: string;      // YYYY-MM-DD，默认今日
  city?: string;     // 城市，默认 'default'
  format?: 'full' | 'brief';
}

export interface GetDailyCardHistoryParams {
  limit?: number;   // 默认 30
  offset?: number;
}

// ---------- 请求封装 ----------

async function safeFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...(init || {}),
  });
  if (!res.ok) {
    let detail: string;
    try {
      const err = await res.json();
      detail = err.detail || `HTTP ${res.status}`;
    } catch {
      detail = `HTTP ${res.status}`;
    }
    throw new Error(detail);
  }
  return (await res.json()) as T;
}

/**
 * 获取当日（或指定日期）文化卡片
 * GET /api/knowledge/daily-card
 */
export function getDailyCard(
  params: GetDailyCardParams = {},
): Promise<DailyCard> {
  const sp = new URLSearchParams();
  if (params.date) sp.set('date', params.date);
  if (params.city) sp.set('city', params.city);
  if (params.format) sp.set('format', params.format);
  const q = sp.toString();
  return safeFetch<DailyCard>(
    `${API_BASE}/api/knowledge/daily-card${q ? '?' + q : ''}`,
  );
}

/**
 * 回看历史推送列表
 * GET /api/knowledge/daily-card/history
 */
export function getDailyCardHistory(
  params: GetDailyCardHistoryParams = {},
): Promise<DailyCardHistoryResponse> {
  const sp = new URLSearchParams();
  if (params.limit != null) sp.set('limit', String(params.limit));
  if (params.offset != null) sp.set('offset', String(params.offset));
  const q = sp.toString();
  return safeFetch<DailyCardHistoryResponse>(
    `${API_BASE}/api/knowledge/daily-card/history${q ? '?' + q : ''}`,
  );
}


// ============================================================
// 以下为本次新增：知识长廊（接口 2-1 / 2-2 / 2-3）
// ============================================================

export type Category =
  | '节气'
  | '节日'
  | '诗词'
  | '典籍'
  | '非遗'
  | '民俗'
  | '人物';

export interface ArticleListItem {
  id: string;
  title: string;
  category: Category;
  excerpt: string;
  cover: string | null;
  favorites: number;
  author: string;
  created_at: string;
}

export interface ArticleListResponse {
  total: number;
  limit: number;
  offset: number;
  items: ArticleListItem[];
}

export interface RelatedArticle {
  id: string;
  title: string;
  category: Category;
}

export interface ArticleDetail {
  id: string;
  title: string;
  category: Category;
  cover: string | null;
  body: string;
  source: string;
  author: string;
  tags: string[];
  favorites: number;
  related: RelatedArticle[];
  created_at: string;
}

export interface FavoriteResponse {
  article_id: string;
  is_favorited: boolean;
  favorites_count: number;
}

export interface GetArticleListParams {
  category?: Category;
  keyword?: string;
  limit?: number;
  offset?: number;
}

/**
 * 获取知识条目列表（支持分类筛选、搜索、分页）
 * GET /api/knowledge/articles
 */
export function getArticleList(
  params: GetArticleListParams = {},
): Promise<ArticleListResponse> {
  const sp = new URLSearchParams();
  if (params.category) sp.set('category', params.category);
  if (params.keyword) sp.set('keyword', params.keyword);
  if (params.limit != null) sp.set('limit', String(params.limit));
  if (params.offset != null) sp.set('offset', String(params.offset));
  const q = sp.toString();
  return safeFetch<ArticleListResponse>(
    `${API_BASE}/api/knowledge/articles${q ? '?' + q : ''}`,
  );
}

/**
 * 获取知识条目详情
 * GET /api/knowledge/articles/{id}
 */
export function getArticle(id: string): Promise<ArticleDetail> {
  return safeFetch<ArticleDetail>(
    `${API_BASE}/api/knowledge/articles/${id}`,
  );
}

/**
 * 收藏 / 取消收藏条目（需登录）
 * POST /api/knowledge/articles/{id}/favorite
 */
export function toggleArticleFavorite(
  id: string,
  token: string,
): Promise<FavoriteResponse> {
  return safeFetch<FavoriteResponse>(
    `${API_BASE}/api/knowledge/articles/${id}/favorite`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );
}



// ============================================================
// 知识问答助手（接口 3-1 / 3-2 / 3-3）
// ============================================================

export interface QAChunk {
  text: string;
  source: string;
  score: number;
}

export interface QASource {
  id: string;
  title: string;
  category: Category;
}

export type QAStreamEvent =
  | { type: 'retrieved'; chunks: QAChunk[] }
  | { type: 'delta'; content: string }
  | { type: 'done'; total_tokens: number }
  | { type: 'error'; message: string };

export interface QASyncResponse {
  answer: string;
  sources: QASource[];
  retrieved_count: number;
  total_tokens: number;
  model: string;
  latency_ms: number;
}

export interface QAHistoryItem {
  id: string;
  question: string;
  answer_summary: string;
  category: Category | null;
  created_at: string;
}

export interface QAHistoryResponse {
  total: number;
  items: QAHistoryItem[];
}

export interface AskParams {
  question: string;
  category?: Category;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

/**
 * 流式问答（SSE）
 * 用法示例：
 *   for await (const event of askQuestionStream({ question: '...' }, token)) {
 *     if (event.type === 'delta') appendToAnswer(event.content);
 *     if (event.type === 'done') finishAnswer(event.total_tokens);
 *   }
 */
export async function* askQuestionStream(
  params: AskParams,
  token?: string,
): AsyncGenerator<QAStreamEvent, void, undefined> {
  const res = await fetch(
    `${API_BASE}/api/knowledge/qa/ask?stream=true`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        question: params.question,
        category: params.category,
        history: params.history ?? [],
      }),
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (!raw) continue;
      try { yield JSON.parse(raw) as QAStreamEvent; } catch { /* skip */ }
    }
  }
}

/**
 * 非流式问答（同步返回完整 JSON）
 */
export function askQuestionSync(
  params: AskParams,
  token?: string,
): Promise<QASyncResponse> {
  return safeFetch<QASyncResponse>(
    `${API_BASE}/api/knowledge/qa/ask?stream=false`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        question: params.question,
        category: params.category,
        history: params.history ?? [],
      }),
    },
  );
}

/**
 * 获取问答历史（需登录）
 */
export function getQAHistory(
  params: { limit?: number; offset?: number } = {},
  token: string,
): Promise<QAHistoryResponse> {
  const sp = new URLSearchParams();
  if (params.limit != null) sp.set('limit', String(params.limit));
  if (params.offset != null) sp.set('offset', String(params.offset));
  const q = sp.toString();
  return safeFetch<QAHistoryResponse>(
    `${API_BASE}/api/knowledge/qa/history${q ? '?' + q : ''}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
}
