/**
 * 站内典籍统一查询（兼容旧名 ancient-books-ctext.ts）
 *
 * 数据源链路（按优先级）：
 *   1. Reservator（Supabase 知识库）—— 见 ./ancient-books-reservator.ts
 *   2. hardcoded 兜底字典 —— 见 @/data/ancient-books-hardcoded
 *   3. 外链映射 —— 见 @/data/ancient-book-links
 *
 * 接入契约：/api/ancient-books Reservator 兜底扩展 v1.1
 *
 * 导出两类 API：
 *   - 同步（旧）：getAncientBook / listAllAncientBooks（仅 hardcoded + 外链）
 *   - 异步（新）：getAncientBookAsync / listAllAncientBooksAsync（含 Reservator）
 *
 * 路由层调用 async 版本以获得 Reservator 全文能力。
 */

import {
  findReservatorBook,
  listReservatorBooks,
  type ReservatorBook,
} from "./ancient-books-reservator";
import { ancientBooksHardcoded, type HardcodedBook } from "@/data/ancient-books-hardcoded";
import { findBookLink, type BookLink } from "@/data/ancient-book-links";

// ====== 类型 ======

export type AncientBookSource = "reservator" | "hardcoded" | "fallback-link";

export interface AncientBookChapter {
  urn: string;
  title: string;
  url?: string;
  paragraphs: string[];
}

export interface AncientBook {
  title: string;
  author?: string;
  dynasty: string;
  content: string;
  translation?: string;
  source: AncientBookSource;
  links: {
    ctext?: string;
    shidianguji: string;
    wikisource?: string;
  };
  metadata: {
    bookName: string;
    category: string;
    brief: string;
  };
  chapters?: AncientBookChapter[];
  chapterCount?: number;
  hasUnresolvedChars?: boolean;
}

export interface AncientBookListItem {
  title: string;
  author?: string;
  dynasty: string;
  source: "reservator" | "hardcoded";
  chapterCount: number;
  brief: string;
  category: string;
}

// ====== 内部工具 ======

function buildLinks(title: string): AncientBook["links"] {
  const link = findBookLink(title);
  return {
    ctext: link?.ctext,
    shidianguji:
      link?.shidianguji ??
      `https://www.shidianguji.com/search?keyword=${encodeURIComponent(title)}`,
    wikisource: link?.wikisource,
  };
}

function reservatorToAncientBook(b: ReservatorBook): AncientBook {
  const chapters: AncientBookChapter[] = b.chapters.map((c) => ({
    urn: c.urn,
    title: c.title,
    paragraphs: c.paragraphs,
  }));
  const content = chapters.length > 0 ? chapters[0].paragraphs.join("\n") : "";
  const hasUnresolved = b.chapters.some((c) => c.hasUnresolvedChars);

  return {
    title: b.title,
    author: b.author,
    dynasty: b.dynasty,
    content,
    source: "reservator",
    links: buildLinks(b.title),
    metadata: {
      bookName: b.title,
      category: b.category,
      brief: b.brief,
    },
    chapters,
    chapterCount: chapters.length,
    hasUnresolvedChars: hasUnresolved,
  };
}

function hardcodedToAncientBook(h: HardcodedBook): AncientBook {
  return {
    title: h.title,
    author: h.author,
    dynasty: h.dynasty,
    content: h.content,
    translation: h.translation,
    source: "hardcoded",
    links: buildLinks(h.title),
    metadata: {
      bookName: h.title,
      category: h.category ?? "其他",
      brief: h.brief ?? "",
    },
  };
}

function fallbackLinkBook(title: string, link: BookLink | null): AncientBook {
  return {
    title,
    dynasty: "未知",
    content: `暂未收录该典籍的全文，请通过下方链接访问外站阅读。`,
    source: "fallback-link",
    links: buildLinks(title),
    metadata: {
      bookName: title,
      category: "其他",
      brief: link?.brief ?? "",
    },
  };
}

function matchHardcoded(query: string): HardcodedBook | null {
  return (
    ancientBooksHardcoded.find(
      (b) => b.title === query || b.title.includes(query) || query.includes(b.title)
    ) ?? null
  );
}

// ====== 公共 API ======

/**
 * 同步版本：仅 hardcoded + 外链（兼容旧调用方）
 */
export function getAncientBook(query: string): AncientBook | null {
  // 1) hardcoded
  const hc = matchHardcoded(query);
  if (hc) return hardcodedToAncientBook(hc);
  // 2) 外链 fallback
  const link = findBookLink(query);
  if (link) return fallbackLinkBook(query, link);
  return null;
}

/**
 * 同步版本：列出 hardcoded 典籍（兼容旧调用方）
 */
export function listAllAncientBooks(): AncientBookListItem[] {
  return ancientBooksHardcoded
    .map((h) => ({
      title: h.title,
      author: h.author,
      dynasty: h.dynasty,
      source: "hardcoded" as const,
      chapterCount: 1,
      brief: h.brief ?? "",
      category: h.category ?? "其他",
    }))
    .sort((a, b) => a.title.localeCompare(b.title, "zh"));
}

/**
 * 异步版本：Reservator 优先 → hardcoded → 外链
 */
export async function getAncientBookAsync(query: string): Promise<AncientBook | null> {
  // 1) Reservator
  try {
    const fromReservator = await findReservatorBook(query);
    if (fromReservator) return reservatorToAncientBook(fromReservator);
  } catch (e) {
    console.warn(`[ancient-books] Reservator 查询异常：${(e as Error).message}`);
  }

  // 2) hardcoded
  const hc = matchHardcoded(query);
  if (hc) return hardcodedToAncientBook(hc);

  // 3) 外链 fallback
  const link = findBookLink(query);
  if (link) return fallbackLinkBook(query, link);

  return null;
}

/**
 * 异步版本：列出 Reservator + hardcoded 全部典籍
 */
export async function listAllAncientBooksAsync(): Promise<AncientBookListItem[]> {
  let rBooks: AncientBookListItem[] = [];
  try {
    rBooks = await listReservatorBooks();
  } catch (e) {
    console.warn(`[ancient-books] Reservator 列表异常：${(e as Error).message}`);
  }
  const hcBooks = listAllAncientBooks();
  const merged = [...rBooks, ...hcBooks];
  // 去重（按 title）
  const seen = new Set<string>();
  return merged
    .filter((b) => {
      if (seen.has(b.title)) return false;
      seen.add(b.title);
      return true;
    })
    .sort((a, b) => a.title.localeCompare(b.title, "zh"));
}

export { findBookLink } from "@/data/ancient-book-links";
