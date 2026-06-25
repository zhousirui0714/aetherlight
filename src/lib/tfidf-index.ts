/**
 * TF-IDF 全局索引（服务端单例）
 *
 * 设计：
 *   - 进程内缓存：避免每次请求都重建索引
 *   - 5 分钟 TTL：兼顾新鲜度与性能
 *   - 懒加载：首次访问时才拉数据
 *
 * 数据源：knowledge_articles 表
 *   - 字段：id, title, category, tags, excerpt, body, related_*
 */

import { buildIndex, type TFIDFIndex, type ArticleFields } from "./tfidf";

// ===== 全局状态 =====
let cachedIndex: TFIDFIndex | null = null;
let cachedAt = 0;
const TTL_MS = 5 * 60 * 1000; // 5 分钟

interface IndexResult {
  index: TFIDFIndex;
  cached: boolean;
  age: number;
  docCount: number;
}

async function loadDocsFromDB(): Promise<{ id: string; fields: Partial<ArticleFields> }[]> {
  let supabaseAdmin: any;
  try {
    ({ supabaseAdmin } = await import("@/integrations/supabase/client.server"));
  } catch (err) {
    console.error("[tfidf-index] supabaseAdmin import failed:", err);
    return [];
  }

  // 拉取构建索引所需的字段
  const { data, error } = await supabaseAdmin
    .from("knowledge_articles")
    .select(
      "id, title, category, tags, excerpt, body, content, " +
        "related_people, related_books, related_events, related_poems, related_articles"
    )
    .limit(2000);

  if (error) {
    console.error("[tfidf-index] query error:", error);
    return [];
  }

  return (data || []).map((row: any) => {
    // 收集所有 related* 条目的 title（作为扩展语义信号）
    const relatedNames: string[] = [];
    for (const f of ["related_people", "related_books", "related_events", "related_poems", "related_articles"]) {
      const arr = row[f];
      if (Array.isArray(arr)) {
        for (const item of arr) {
          if (item && typeof item === "object" && item.title) {
            relatedNames.push(String(item.title));
          }
        }
      }
    }

    return {
      id: row.id,
      fields: {
        title: row.title || "",
        category: row.category || "",
        tags: row.tags || [],
        excerpt: row.excerpt || "",
        content: row.content || row.body || "",
        relatedNames,
      },
    };
  });
}

export async function getIndex(force = false): Promise<IndexResult> {
  const now = Date.now();
  const age = now - cachedAt;

  if (!force && cachedIndex && age < TTL_MS) {
    return {
      index: cachedIndex,
      cached: true,
      age,
      docCount: cachedIndex.N,
    };
  }

  const docs = await loadDocsFromDB();
  if (docs.length === 0) {
    // 没有数据时返回空索引
    const empty = buildIndex([], {});
    return { index: empty, cached: false, age: 0, docCount: 0 };
  }

  cachedIndex = buildIndex(docs, {});
  cachedAt = now;

  return {
    index: cachedIndex,
    cached: false,
    age: 0,
    docCount: cachedIndex.N,
  };
}

/** 强制刷新（用于管理员手动重建） */
export function invalidateIndex(): void {
  cachedIndex = null;
  cachedAt = 0;
}
