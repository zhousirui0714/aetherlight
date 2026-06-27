/**
 * 古籍查询 API（Reservator 兜底扩展 v1.1）
 *
 * 数据源（按优先级）：
 *   1. Reservator（Supabase 知识库，33 部古籍）—— src/lib/ancient-books-reservator.ts
 *   2. hardcoded 兜底字典（出师表等 6 篇）—— src/data/ancient-books-hardcoded.ts
 *   3. 外链映射（30+ 部，仅返回跳转链接）—— src/data/ancient-book-links.ts
 *
 * 契约：/api/ancient-books Reservator 兜底扩展 v1.1
 * 响应字段（含新增）：
 *   - chapters: Array<{urn, title, url?, paragraphs}>
 *   - chapterCount: number
 *   - hasUnresolvedChars: boolean
 *   - source: 'reservator' | 'hardcoded' | 'fallback-link'
 *
 * 兼容：
 *   - q / query / title / book 四种参数名均可用（推荐 book）
 *   - source=reservator | hardcoded | all（默认 all）
 *   - chapter=urn 取单卷
 *   - list=1 列出全部；listSource=reservator|hardcoded 过滤
 */

import { createFileRoute } from "@tanstack/react-router";
import {
  getAncientBookAsync,
  listAllAncientBooksAsync,
  type AncientBook,
  type AncientBookListItem,
} from "@/lib/ancient-books-ctext";

function filterBySource<T extends { source: string }>(
  items: T[],
  source: "reservator" | "hardcoded"
): T[] {
  return items.filter((i) => i.source === source);
}

function stripChapters(book: AncientBook): Omit<AncientBook, "chapters"> & {
  chapters?: AncientBook["chapters"];
} {
  // 保留 chapters 字段（契约 §1.3 新增），不删除
  return book;
}

export const Route = createFileRoute("/api/ancient-books")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { searchParams } = new URL(request.url);

        // ===== 列出所有典籍（list=1 模式）=====
        const list = searchParams.get("list");
        if (list === "1" || list === "true") {
          const listSource = searchParams.get("listSource") ?? "all";
          const all = await listAllAncientBooksAsync();
          const filtered: AncientBookListItem[] =
            listSource === "all"
              ? all
              : filterBySource(all, listSource as "reservator" | "hardcoded");
          return Response.json({
            success: true,
            list: filtered,
          });
        }

        // ===== 单本查询 =====
        const query =
          searchParams.get("q") ||
          searchParams.get("query") ||
          searchParams.get("title") ||
          searchParams.get("book");
        const source = (searchParams.get("source") ?? "all") as
          | "all"
          | "reservator"
          | "hardcoded";
        const chapter = searchParams.get("chapter");

        if (!query) {
          return Response.json(
            {
              success: false,
              error:
                "请提供查询参数：q / query / title / book，或 list=1 列出全部",
            },
            { status: 400 }
          );
        }

        const book = await getAncientBookAsync(query);
        if (!book) {
          return Response.json(
            { success: false, error: `未找到古籍：${query}` },
            { status: 404 }
          );
        }

        // source 过滤
        if (source !== "all" && book.source !== source) {
          return Response.json(
            {
              success: false,
              error: `${source} 暂未收录该典籍：${query}`,
            },
            { status: 404 }
          );
        }

        // chapter 过滤（仅 reservator 命中时有 chapters）
        let payloadBook = stripChapters(book);
        if (chapter && book.chapters && book.chapters.length > 0) {
          const ch = book.chapters.find((c) => c.urn.endsWith(`::${chapter}`) || c.urn === chapter);
          if (!ch) {
            return Response.json(
              {
                success: false,
                error: `《${book.title}》无此卷次：${chapter}`,
              },
              { status: 404 }
            );
          }
          payloadBook = {
            ...payloadBook,
            chapters: [ch],
            chapterCount: 1,
            content: ch.paragraphs.join("\n"),
          };
        }

        return Response.json({
          success: true,
          data: payloadBook,
        });
      },
    },
  },
});
