/**
 * API 缓存工具
 * 用于缓存 AI 对话和知识查询的响应
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

// 缓存有效期（分钟）
const DEFAULT_TTL = 30;

function getCacheKey(prefix: string, ...args: string[]): string {
  return `${prefix}:${args.join(":")}`;
}

function isExpired(timestamp: number, ttlMinutes: number): boolean {
  return Date.now() - timestamp > ttlMinutes * 60 * 1000;
}

export function getCache<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  
  if (isExpired(entry.timestamp, DEFAULT_TTL)) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

export function setCache<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

export function clearCache(prefix?: string): void {
  if (!prefix) {
    cache.clear();
    return;
  }
  
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

// 对话缓存（基于问题的 hash）
export function getDialogueCacheKey(question: string): string {
  // 简单的 hash 函数
  const normalized = question.toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `dialogue:${Math.abs(hash)}`;
}

// 知识查询缓存
export function getKnowledgeCacheKey(question: string): string {
  const normalized = question.toLowerCase().trim();
  return `knowledge:${normalized.slice(0, 50)}`;
}

// 典籍查询缓存
export function getAncientBooksCacheKey(book: string): string {
  return `ancient-books:${book}`;
}

// 统计缓存状态（用于调试）
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}
