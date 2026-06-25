/**
 * 古籍查询 API
 *
 * 数据源（按优先级）：
 *   1. 6 本硬编码字典（出师表 / 道德经 / 论语 / 孟子 / 离骚 / 逍遥游）
 *   2. 30+ 本外链映射（点跳转不下载内容）
 *
 * 响应附带外链（识典古籍 / ctext.org / 维基文库）
 */

import { createFileRoute } from "@tanstack/react-router";
import { getAncientBook, listAllAncientBooks } from "@/lib/ancient-books-ctext";

export const Route = createFileRoute("/api/ancient-books")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { searchParams } = new URL(request.url);
        const query =
          searchParams.get("q") || searchParams.get("query") || searchParams.get("title");
        const list = searchParams.get("list");

        // ===== 列出所有典籍 =====
        if (list === "1" || list === "true") {
          return Response.json({
            success: true,
            list: listAllAncientBooks(),
          });
        }

        if (!query) {
          return Response.json(
            { success: false, error: "请提供查询参数：q / query / title，或 list=1 列出全部" },
            { status: 400 }
          );
        }

        const book = getAncientBook(query);
        if (!book) {
          return Response.json(
            { success: false, error: `未找到古籍：${query}` },
            { status: 404 }
          );
        }

        return Response.json({
          success: true,
          data: {
            title: book.title,
            author: book.author,
            dynasty: book.dynasty,
            content: book.content,
            translation: book.translation,
            source: book.source,
            links: {
              ctext: book.bookLink?.ctext,
              shidianguji: book.bookLink?.shidianguji || "",
              wikisource: book.bookLink?.wikisource,
            },
            metadata: {
              bookName: book.bookLink?.name || book.title,
              category: book.bookLink?.category || "经部",
              brief: book.bookLink?.brief || "",
            },
          },
        });
      },
    },
  },
});
