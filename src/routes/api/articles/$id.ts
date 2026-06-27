/**
 * /api/articles/$id
 * GET  - 文章详情（蛇形字段），前端 fetch 后用 normalizeArticle() 归一化
 */
import { createFileRoute } from "@tanstack/react-router";
import { getCache, setCache } from "@/lib/api-cache";

const CACHE_TTL_MS = 5 * 60 * 1000;

export const Route = createFileRoute("/api/articles/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = params.id;
        if (!id) return json({ error: "missing id" }, 400);

        const cacheKey = `kb-detail:${id}`;
        const cached = getCache<any>(cacheKey);
        if (cached) return json(cached, 200, { "X-Cache": "HIT" });

        let supabaseAdmin: any;
        try {
          ({ supabaseAdmin } = await import("@/integrations/supabase/client.server"));
        } catch (err) {
          console.error("[article-detail] supabaseAdmin import failed:", err);
          return json({ error: "supabase unavailable" }, 500);
        }

        try {
          const { data, error } = await supabaseAdmin
            .from("knowledge_articles")
            .select("*")
            .eq("id", id)
            .maybeSingle();

          if (error) {
            console.error("[article-detail] query error:", error);
            return json({ error: "query failed" }, 500);
          }
          if (!data) return json({ error: "not found" }, 404);

          setCache(cacheKey, data);
          return json(data, 200, { "X-Cache": "MISS" });
        } catch (err) {
          console.error("[article-detail] handler error:", err);
          return json({ error: "internal" }, 500);
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
