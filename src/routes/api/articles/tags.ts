/**
 * /api/articles/tags
 * GET  - 标签列表 (?category= 可选) — 聚合 knowledge_articles.tags 数组
 * 响应: TagInfo[] = { tag, count }
 */
import { createFileRoute } from "@tanstack/react-router";
import { getCache, setCache } from "@/lib/api-cache";

const CACHE_TTL_MS = 5 * 60 * 1000;

export const Route = createFileRoute("/api/articles/tags")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category") || "";

        const cacheKey = `kb-tags:${category}`;
        const cached = getCache<any[]>(cacheKey);
        if (cached) return json(cached, 200, { "X-Cache": "HIT" });

        let supabaseAdmin: any;
        try {
          ({ supabaseAdmin } = await import("@/integrations/supabase/client.server"));
        } catch (err) {
          console.error("[tags] supabaseAdmin import failed:", err);
          return json([], 200);
        }

        try {
          let q = supabaseAdmin
            .from("knowledge_articles")
            .select("tags, category");
          if (category) q = q.eq("category", category);

          const { data, error } = await q;
          if (error) {
            console.error("[tags] query error:", error);
            return json([], 200);
          }

          const tagCount: Record<string, number> = {};
          for (const row of data || []) {
            const tags = Array.isArray(row.tags) ? row.tags : [];
            for (const t of tags) {
              if (typeof t !== "string" || !t.trim()) continue;
              tagCount[t] = (tagCount[t] || 0) + 1;
            }
          }

          const payload = Object.entries(tagCount)
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count);

          setCache(cacheKey, payload);
          return json(payload, 200, { "X-Cache": "MISS" });
        } catch (err) {
          console.error("[tags] handler error:", err);
          return json([], 200);
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
