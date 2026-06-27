/**
 * /api/articles/stats
 * GET  - 统计 (total + by_category + by_dynasty)
 */
import { createFileRoute } from "@tanstack/react-router";
import { getCache, setCache } from "@/lib/api-cache";

const CACHE_TTL_MS = 5 * 60 * 1000;

export const Route = createFileRoute("/api/articles/stats")({
  server: {
    handlers: {
      GET: async () => {
        const cacheKey = "kb-stats";
        const cached = getCache<any>(cacheKey);
        if (cached) return json(cached, 200, { "X-Cache": "HIT" });

        let supabaseAdmin: any;
        try {
          ({ supabaseAdmin } = await import("@/integrations/supabase/client.server"));
        } catch (err) {
          console.error("[stats] supabaseAdmin import failed:", err);
          return json({ total: 0, by_category: {} }, 200);
        }

        try {
          const { data, error } = await supabaseAdmin
            .from("knowledge_articles")
            .select("category, dynasty");

          if (error) {
            console.error("[stats] query error:", error);
            return json({ total: 0, by_category: {} }, 200);
          }

          const by_category: Record<string, number> = {};
          const by_dynasty: Record<string, number> = {};
          for (const row of data || []) {
            if (row.category) by_category[row.category] = (by_category[row.category] || 0) + 1;
            if (row.dynasty) by_dynasty[row.dynasty] = (by_dynasty[row.dynasty] || 0) + 1;
          }

          const payload = { total: (data || []).length, by_category, by_dynasty };
          setCache(cacheKey, payload);
          return json(payload, 200, { "X-Cache": "MISS" });
        } catch (err) {
          console.error("[stats] handler error:", err);
          return json({ total: 0, by_category: {} }, 200);
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
