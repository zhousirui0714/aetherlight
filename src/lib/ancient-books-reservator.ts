/**
 * 站内典籍原文库（Reservator）查询模块
 *
 * 数据源：knowledge_books + knowledge_book_chapters（Supabase）
 * 来源：tanpero/Reservator（35 部古籍 Markdown 解析入库）
 *
 * 接入契约：/api/ancient-books Reservator 兜底扩展 v1.1
 *
 * 不读 Vercel bundle 内的 JSON（避免 60MB 资源超限）
 * 不破坏现有 ancient-books-ctext.ts 接口签名
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ====== 契约类型 ======

export interface ReservatorChapter {
  urn: string;
  title: string;
  paragraphs: string[];
  hasUnresolvedChars: boolean;
}

export interface ReservatorBook {
  slug: string;
  title: string;
  author?: string;
  dynasty: string;
  category: string;
  brief: string;
  chapters: ReservatorChapter[];
  hasUnresolvedChars: boolean;
}

export interface ReservatorListItem {
  slug: string;
  title: string;
  author?: string;
  dynasty: string;
  category: string;
  brief: string;
  chapterCount: number;
  source: "reservator";
}

// ====== 内部类型（DB row） ======

interface DbBookRow {
  slug: string;
  title: string;
  author: string | null;
  dynasty: string;
  category: string;
  brief: string;
  has_unresolved_chars: boolean;
  chapter_count: number;
}

interface DbChapterRow {
  book_slug: string;
  urn: string;
  title: string;
  paragraphs: unknown;
  has_unresolved_chars: boolean;
  sort_order: number;
}

// ====== 加载状态（server 启动时 warmup） ======

let _warmupTried = false;
async function ensureTableExists(): Promise<boolean> {
  if (_warmupTried) return true;
  _warmupTried = true;
  try {
    const { error } = await supabaseAdmin
      .from("knowledge_books")
      .select("slug")
      .limit(1);
    if (error) {
      console.warn(`[reservator] 表访问失败：${error.message}（已迁移？已配 RLS？）`);
      _warmupTried = false; // 允许重试
      return false;
    }
    return true;
  } catch (e: any) {
    console.warn(`[reservator] warmup 异常：${e.message}`);
    _warmupTried = false;
    return false;
  }
}

function rowToBook(bookRow: DbBookRow, chapterRows: DbChapterRow[]): ReservatorBook {
  const chapters: ReservatorChapter[] = chapterRows
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) => ({
      urn: c.urn,
      title: c.title,
      paragraphs: Array.isArray(c.paragraphs) ? (c.paragraphs as string[]) : [],
      hasUnresolvedChars: c.has_unresolved_chars,
    }));
  return {
    slug: bookRow.slug,
    title: bookRow.title,
    author: bookRow.author ?? undefined,
    dynasty: bookRow.dynasty,
    category: bookRow.category,
    brief: bookRow.brief,
    chapters,
    hasUnresolvedChars: bookRow.has_unresolved_chars,
  };
}

// ====== 公共 API ======

/**
 * 按书名（含别名 slug）查找
 * 匹配规则：精确 title → 精确 slug → title.includes(query) → slug.includes(query)
 */
export async function findReservatorBook(query: string): Promise<ReservatorBook | null> {
  if (!(await ensureTableExists())) return null;

  // 1) 精确 title
  let { data: bookRow } = await supabaseAdmin
    .from("knowledge_books")
    .select("slug,title,author,dynasty,category,brief,has_unresolved_chars,chapter_count")
    .eq("title", query)
    .maybeSingle();

  // 2) 精确 slug
  if (!bookRow) {
    const r = await supabaseAdmin
      .from("knowledge_books")
      .select("slug,title,author,dynasty,category,brief,has_unresolved_chars,chapter_count")
      .eq("slug", query)
      .maybeSingle();
    bookRow = r.data;
  }

  // 3) 模糊 title
  if (!bookRow) {
    const r = await supabaseAdmin
      .from("knowledge_books")
      .select("slug,title,author,dynasty,category,brief,has_unresolved_chars,chapter_count")
      .ilike("title", `%${query}%`)
      .limit(1)
      .maybeSingle();
    bookRow = r.data;
  }

  // 4) 模糊 slug
  if (!bookRow) {
    const r = await supabaseAdmin
      .from("knowledge_books")
      .select("slug,title,author,dynasty,category,brief,has_unresolved_chars,chapter_count")
      .ilike("slug", `%${query}%`)
      .limit(1)
      .maybeSingle();
    bookRow = r.data;
  }

  if (!bookRow) return null;

  // 加载章节
  const { data: chapterRows, error: chapterError } = await supabaseAdmin
    .from("knowledge_book_chapters")
    .select("book_slug,urn,title,paragraphs,has_unresolved_chars,sort_order")
    .eq("book_slug", (bookRow as DbBookRow).slug)
    .order("sort_order", { ascending: true });

  if (chapterError) {
    console.warn(`[reservator] 加载章节失败：${chapterError.message}`);
    return rowToBook(bookRow as DbBookRow, []);
  }

  return rowToBook(bookRow as DbBookRow, (chapterRows ?? []) as DbChapterRow[]);
}

/**
 * 按 book.slug + chapter.urn 取单卷
 */
export async function findReservatorChapter(
  bookSlug: string,
  chapterUrn: string
): Promise<ReservatorChapter | null> {
  if (!(await ensureTableExists())) return null;

  const { data, error } = await supabaseAdmin
    .from("knowledge_book_chapters")
    .select("book_slug,urn,title,paragraphs,has_unresolved_chars,sort_order")
    .eq("book_slug", bookSlug)
    .eq("urn", chapterUrn)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as DbChapterRow;
  return {
    urn: row.urn,
    title: row.title,
    paragraphs: Array.isArray(row.paragraphs) ? (row.paragraphs as string[]) : [],
    hasUnresolvedChars: row.has_unresolved_chars,
  };
}

/**
 * 列出全部 Reservator 典籍（不含章节内容）
 */
export async function listReservatorBooks(): Promise<ReservatorListItem[]> {
  if (!(await ensureTableExists())) return [];

  const { data, error } = await supabaseAdmin
    .from("knowledge_books")
    .select("slug,title,author,dynasty,category,brief,chapter_count")
    .order("title", { ascending: true });

  if (error) {
    console.warn(`[reservator] 列表查询失败：${error.message}`);
    return [];
  }

  return ((data ?? []) as DbBookRow[]).map((b) => ({
    slug: b.slug,
    title: b.title,
    author: b.author ?? undefined,
    dynasty: b.dynasty,
    category: b.category,
    brief: b.brief,
    chapterCount: b.chapter_count,
    source: "reservator" as const,
  }));
}
