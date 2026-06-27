/**
 * /api/articles
 * GET  - 文章列表（轻量字段），支持 ?category=...&keyword=...&limit=...&offset=...
 */
import { createFileRoute } from "@tanstack/react-router";
import { getCache, setCache } from "@/lib/api-cache";

const CACHE_TTL_MS = 2 * 60 * 1000;

export const Route = createFileRoute("/api/articles")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category") || "";
        const keyword = searchParams.get("keyword") || "";
        const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10) || 50, 200);
        const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10) || 0, 0);

        const cacheKey = `kb-list:${category}:${keyword}:${limit}:${offset}`;
        const cached = getCache<{ total: number; items: any[] }>(cacheKey);
        if (cached) return json(cached, 200, { "X-Cache": "HIT" });

        let supabaseAdmin: any;
        try {
          ({ supabaseAdmin } = await import("@/integrations/supabase/client.server"));
        } catch (err) {
          console.error("[articles-list] supabaseAdmin import failed:", err);
          return json({ total: 0, items: [] }, 200);
        }

        try {
          let q = supabaseAdmin
            .from("knowledge_articles")
            .select("id, title, category, excerpt, cover, favorites, author, created_at, sort_weight, view_count", { count: "exact" })
            .order("sort_weight", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

          if (category) q = q.eq("category", category);
          if (keyword) q = q.or(`title.ilike.%${keyword}%,excerpt.ilike.%${keyword}%`);

          const { data, count, error } = await q;
          if (error) {
            console.error("[articles-list] query error:", error);
            return json({ total: 0, items: [] }, 200);
          }

          const payload = { total: count || 0, items: data || [] };
          setCache(cacheKey, payload);
          return json(payload, 200, { "X-Cache": "MISS" });
        } catch (err) {
          console.error("[articles-list] handler error:", err);
          return json({ total: 0, items: [] }, 200);
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
