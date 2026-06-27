/**
 * /api/articles/search
 * GET  - 全文检索（基于 TF-IDF 全量索引）
 *
 * Query:
 *   - q:    查询文本（必填）
 *   - topK: 返回数量（默认 10，最大 30）
 *   - exclude: 逗号分隔 id
 *
 * 响应:
 *   {
 *     results:      [{ id, title, category, excerpt, cover, coverUrl, score }]
 *     indexedDocs:  number
 *     cached:       boolean
 *     age:          number
 *   }
 */
import { createFileRoute } from "@tanstack/react-router";
import { getCache, setCache } from "@/lib/api-cache";
import { getIndex } from "@/lib/tfidf-index";
import { searchSimilar } from "@/lib/tfidf";

const CACHE_TTL_MS = 2 * 60 * 1000; // 2 分钟（搜索结果新鲜度要求高）

export const Route = createFileRoute("/api/articles/search")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const q = (url.searchParams.get("q") || "").trim();
        const topK = Math.min(30, Math.max(1, parseInt(url.searchParams.get("topK") || "10")));
        const excludeParam = url.searchParams.get("exclude") || "";
        const excludeSet = new Set(
          excludeParam.split(",").map((s) => s.trim()).filter(Boolean)
        );

        if (!q) {
          return json({ results: [], indexedDocs: 0, cached: false, age: 0 }, 200);
        }

        const cacheKey = `kb-search:${q}:${topK}`;
        const cached = getCache<any>(cacheKey);
        if (cached) {
          return json({ ...cached, cached: true }, 200, { "X-Cache": "HIT" });
        }

        try {
          const { index, cached: idxCached, age, docCount } = await getIndex();
          if (docCount === 0) {
            return json({ results: [], indexedDocs: 0, cached: false, age: 0 }, 200);
          }

          const scored = searchSimilar(index, q, { topK: topK * 2, exclude: excludeSet, threshold: 0.02 });
          if (scored.length === 0) {
            const payload = { results: [], indexedDocs: docCount, cached: idxCached, age };
            setCache(cacheKey, payload);
            return json(payload, 200);
          }

          // 取更多候选（topK * 2），后面再二次过滤低分
          const topIds = scored.map((r) => r.id);

          // 补全元信息
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
              console.warn("[search] meta query failed:", err);
            }
          }

          // 合并 score + 元信息；标题精确匹配加权重
          const lowerQ = q.toLowerCase();
          const results = scored
            .map((r) => {
              const meta = metaMap.get(r.id);
              if (!meta) return null;
              // 标题包含查询词 → score 提权 1.5x
              const titleBoost = (meta.title || "").toLowerCase().includes(lowerQ) ? 1.5 : 1;
              return {
                id: r.id,
                title: meta.title || "",
                category: meta.category || "",
                excerpt: meta.excerpt || "",
                cover: meta.cover || "",
                coverUrl: meta.cover_url || null,
                viewCount: meta.view_count || 0,
                favorites: meta.favorites || 0,
                score: Number((r.score * titleBoost).toFixed(4)),
              };
            })
            .filter(Boolean)
            .sort((a: any, b: any) => b.score - a.score)
            .slice(0, topK);

          const payload = {
            results,
            indexedDocs: docCount,
            cached: idxCached,
            age,
          };

          setCache(cacheKey, payload);
          return json(payload, 200, { "X-Cache": "MISS" });
        } catch (err) {
          console.error("[search] handler error:", err);
          return json({ results: [], indexedDocs: 0, cached: false, age: 0 }, 500);
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
