/**
 * /api/articles/categories
 * GET  - 分类树 (10 顶级 + 子类 + 条目数)
 * 响应: CategoryInfo[] = { id, name_cn, total, sub_categories: [{name, count}] }
 */
import { createFileRoute } from "@tanstack/react-router";
import { getCache, setCache } from "@/lib/api-cache";

const CACHE_TTL_MS = 5 * 60 * 1000;

const CATEGORY_CN: Record<string, string> = {
  figures:    "人物",
  poems:      "诗词文章",
  classics:   "典籍经典",
  festivals:  "节日节气",
  mythology:  "神话传说",
  intangible: "非遗艺术",
  artifacts:  "建筑器物",
  lifestyle:  "饮食服饰",
  philosophy: "思想智慧",
  technology: "古代科技",
};

const CATEGORY_KEYS = Object.keys(CATEGORY_CN);

export const Route = createFileRoute("/api/articles/categories")({
  server: {
    handlers: {
      GET: async () => {
        const cacheKey = "kb-categories";
        const cached = getCache<any[]>(cacheKey);
        if (cached) return json(cached, 200, { "X-Cache": "HIT" });

        let supabaseAdmin: any;
        try {
          ({ supabaseAdmin } = await import("@/integrations/supabase/client.server"));
        } catch (err) {
          console.error("[categories] supabaseAdmin import failed:", err);
          return json([], 200);
        }

        try {
          const { data, error } = await supabaseAdmin
            .from("knowledge_articles")
            .select("category, sub_category");

          if (error) {
            console.error("[categories] query error:", error);
            return json([], 200);
          }

          const byCat: Record<string, Map<string, number>> = {};
          for (const key of CATEGORY_KEYS) byCat[key] = new Map();
          for (const row of data || []) {
            const c = row.category;
            if (!c || !byCat[c]) continue;
            const sub = row.sub_category || "其他";
            byCat[c].set(sub, (byCat[c].get(sub) || 0) + 1);
          }

          const payload = CATEGORY_KEYS.map((id) => {
            const subs = byCat[id];
            const total = Array.from(subs.values()).reduce((a, b) => a + b, 0);
            return {
              id,
              name_cn: CATEGORY_CN[id],
              total,
              sub_categories: Array.from(subs.entries())
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count),
            };
          });

          setCache(cacheKey, payload);
          return json(payload, 200, { "X-Cache": "MISS" });
        } catch (err) {
          console.error("[categories] handler error:", err);
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
