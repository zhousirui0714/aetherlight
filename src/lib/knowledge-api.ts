/**
 * 知识长廊 API 客户端封装
 * - getArticle(): 通过后端 API 获取详情（含所有 10 个结构化字段）
 * - aiFillArticle(): 懒加载 AI 补全 history/influence/faq
 * - listArticles(): 分页 + 分类 + 关键词
 * - getStats(): 统计
 */

import type { Article, RelatedItem } from "@/lib/knowledge-data";

// 兼容后端 snake_case 与前端 camelCase
export type ArticleDetail = Article & {
  body_extended?: string;
  body?: string;
  dynasty?: string;
  era?: string;
  region?: string;
  related_people?: RelatedItem[];
  related_books?: RelatedItem[];
  related_events?: RelatedItem[];
  related_poems?: RelatedItem[];
  related_articles?: RelatedItem[];
  faq?: Array<{ question: string; answer: string; link?: string }>;
  history?: string;
  influence?: string;
};

export type AIFillResult = {
  articleId: string;
  filled: Record<string, any>;
  status: Record<string, string>;
  cached: boolean;
  tokensUsed: number;
};

export type ArticleListItem = {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  cover: string | null;
  favorites: number;
  author: string;
  created_at: string;
};

const API_BASE = "/api";

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    throw new Error(`API ${url} -> ${res.status}`);
  }
  return (await res.json()) as T;
}

/**
 * 详情（优先走后端；DB 失败时后端返回静态 JSON 数据）
 */
export async function getArticle(id: string): Promise<ArticleDetail | null> {
  try {
    const data = await jsonFetch<ArticleDetail>(`${API_BASE}/articles/${encodeURIComponent(id)}`);
    return data;
  } catch (err) {
    console.warn(`[knowledge-api] getArticle(${id}) failed:`, err);
    return null;
  }
}

/**
 * AI 懒加载补全
 */
export async function aiFillArticle(
  articleId: string,
  fields: string[],
  snapshot?: { title: string; category: string; excerpt?: string; body?: string }
): Promise<AIFillResult | null> {
  try {
    return await jsonFetch<AIFillResult>(`${API_BASE}/knowledge-ai-fill`, {
      method: "POST",
      body: JSON.stringify({ articleId, fields, articleSnapshot: snapshot }),
    });
  } catch (err) {
    console.warn(`[knowledge-api] aiFillArticle(${articleId}) failed:`, err);
    return null;
  }
}

/**
 * 列表
 */
export async function listArticles(params: {
  category?: string;
  keyword?: string;
  limit?: number;
  offset?: number;
}): Promise<{ total: number; items: ArticleListItem[] }> {
  const search = new URLSearchParams();
  if (params.category) search.set("category", params.category);
  if (params.keyword) search.set("keyword", params.keyword);
  if (params.limit != null) search.set("limit", String(params.limit));
  if (params.offset != null) search.set("offset", String(params.offset));

  try {
    return await jsonFetch(`/api/articles?${search.toString()}`);
  } catch (err) {
    console.warn("[knowledge-api] listArticles failed:", err);
    return { total: 0, items: [] };
  }
}

export type ArticleStats = {
  total: number;
  by_category: Record<string, number>;
  by_dynasty?: Record<string, number>;
};

export async function getStats(): Promise<ArticleStats | null> {
  try {
    return await jsonFetch<ArticleStats>(`${API_BASE}/articles/stats`);
  } catch {
    return null;
  }
}
