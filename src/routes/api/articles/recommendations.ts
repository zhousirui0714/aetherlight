/**
 * /api/articles/recommendations
 * GET  - 基于 TF-IDF 余弦相似度的相关文章推荐
 *
 * Query:
 *   - id:     当前文章 id（必填）
 *   - topK:   返回数量（默认 6，最大 20）
 *   - exclude: 逗号分隔的 id 列表，要从结果中排除
 *
 * 响应:
 *   {
 *     recommendations: [{ id, title, category, excerpt, cover, coverUrl, score }]
 *     indexedDocs:     number
 *     cached:          boolean
 *     age:             number  // 索引年龄 ms
 *   }
 */
import { createFileRoute } from "@tanstack/react-router";
import { getCache, setCache } from "@/lib/api-cache";
import { getIndex } from "@/lib/tfidf-index";
import { findSimilarDocs } from "@/lib/tfidf";

const CACHE_TTL_MS = 5 * 60 * 1000;

export const Route = createFileRoute("/api/articles/recommendations")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        const topK = Math.min(20, Math.max(1, parseInt(url.searchParams.get("topK") || "6")));
        const excludeParam = url.searchParams.get("exclude") || "";
        const excludeSet = new Set(
          excludeParam.split(",").map((s) => s.trim()).filter(Boolean)
        );
        if (id) excludeSet.add(id);

        if (!id) {
          return json({ error: "missing id" }, 400);
        }

        const cacheKey = `kb-rec:${id}:${topK}`;
        const cached = getCache<any>(cacheKey);
        if (cached) {
          return json({ ...cached, cached: true }, 200, { "X-Cache": "HIT" });
        }

        try {
          const { index, cached: idxCached, age, docCount } = await getIndex();
          if (docCount === 0) {
            return json({ recommendations: [], indexedDocs: 0, cached: false, age: 0 }, 200);
          }

          const results = findSimilarDocs(index, id, { topK, exclude: excludeSet });

          // 补全文章元信息（title/excerpt/cover 等）
          const topIds = results.map((r) => r.id);
          let metaMap = new Map<string, any>();
          if (topIds.length > 0) {
            try {
              const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
              const { data: metaRows } = await supabaseAdmin
                .from("knowledge_articles")
                .select("id, title, category, excerpt, cover, cover_url, view_count, favorites")
                .in("id", topIds);
              metaMap = new Map((metaRows || []).map((r: any) => [r.id, r]));
            } catch (err) {
              console.warn("[recommendations] meta query failed:", err);
            }
          }

          // 合并 score + 元信息
          const recommendations = results
            .map((r) => {
              const meta = metaMap.get(r.id);
              if (!meta) return null;
              return {
                id: r.id,
                title: meta.title || "",
                category: meta.category || "",
                excerpt: meta.excerpt || "",
                cover: meta.cover || "",
                coverUrl: meta.cover_url || null,
                viewCount: meta.view_count || 0,
                favorites: meta.favorites || 0,
                score: Number(r.score.toFixed(4)),
              };
            })
            .filter(Boolean);

          const payload = {
            recommendations,
            indexedDocs: docCount,
            cached: idxCached,
            age,
          };

          setCache(cacheKey, payload);
          return json(payload, 200, { "X-Cache": "MISS" });
        } catch (err) {
          console.error("[recommendations] handler error:", err);
          return json({ recommendations: [], indexedDocs: 0, cached: false, age: 0 }, 200);
        }
      },
    },
  },
});

function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}
