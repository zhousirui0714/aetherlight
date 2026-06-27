/**
 * 搜索历史管理
 * 纯 localStorage，最多 10 条，最近置顶
 */

const STORAGE_KEY = "suguang:search:history";
const MAX_HISTORY = 10;

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

function read(): SearchHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x: any) => x && typeof x.query === "string" && typeof x.timestamp === "number")
      .slice(0, MAX_HISTORY);
  } catch {
    return [];
  }
}

function write(items: SearchHistoryItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_HISTORY)));
  } catch {
    // ignore
  }
}

export function getSearchHistory(): SearchHistoryItem[] {
  return read();
}

export function addSearchHistory(query: string): void {
  const trimmed = query.trim();
  if (!trimmed) return;
  const items = read();
  // 去重：相同 query 移到最前
  const filtered = items.filter((x) => x.query !== trimmed);
  filtered.unshift({ query: trimmed, timestamp: Date.now() });
  write(filtered.slice(0, MAX_HISTORY));
}

export function removeSearchHistory(query: string): void {
  const items = read();
  write(items.filter((x) => x.query !== query));
}

export function clearSearchHistory(): void {
  write([]);
}
