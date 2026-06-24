/**
 * /api/articles/$id/relations
 * GET  - 知识图谱：拉取某条目的所有 from/to 关系 + 关联节点元信息
 *
 * 响应: KnowledgeGraph { center, nodes, edges }
 *   - center: 当前条目
 *   - nodes:  所有关联条目（去重后）
 *   - edges:  关系数组 { source, target, type, weight, description }
 */
import { createFileRoute } from "@tanstack/react-router";
import { getCache, setCache } from "@/lib/api-cache";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 分钟

type RelationRow = {
  from_article_id: string;
  to_article_id: string;
  relation_type: string;
  weight: number;
  description: string;
};

type NodeRow = {
  id: string;
  title: string;
  category: string;
  excerpt: string | null;
  cover: string | null;
  cover_url: string | null;
};

export const Route = createFileRoute("/api/articles/$id/relations")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = params.id;
        if (!id) {
          return json({ error: "missing id" }, 400);
        }

        const cacheKey = `kb-rel:${id}`;
        const cached = getCache<{ center: any; nodes: any[]; edges: any[] }>(cacheKey);
        if (cached) {
          return json(cached, 200, { "X-Cache": "HIT" });
        }

        // 用 supabaseAdmin（service_role）绕开 RLS，保证一定能拿到关系
        let supabaseAdmin: any;
        try {
          ({ supabaseAdmin } = await import("@/integrations/supabase/client.server"));
        } catch (err) {
          console.error("[relations] supabaseAdmin import failed:", err);
          return json({ center: undefined, nodes: [], edges: [] }, 200);
        }

        try {
          // 1. 拉关系行 (from = id OR to = id)
          const { data: rels, error: relErr } = await supabaseAdmin
            .from("knowledge_relations")
            .select("from_article_id, to_article_id, relation_type, weight, description")
            .or(`from_article_id.eq.${id},to_article_id.eq.${id}`);

          if (relErr) {
            console.error("[relations] query error:", relErr);
            return json({ center: undefined, nodes: [], edges: [] }, 200);
          }

          const relations: RelationRow[] = (rels || []) as RelationRow[];
          if (relations.length === 0) {
            const empty = { center: undefined, nodes: [], edges: [] };
            setCache(cacheKey, empty);
            return json(empty, 200, { "X-Cache": "MISS" });
          }

          // 2. 收集所有相关 ID (含中心 + 邻居)
          const relatedIds = new Set<string>([id]);
          for (const r of relations) {
            relatedIds.add(r.from_article_id);
            relatedIds.add(r.to_article_id);
          }

          // 3. 批量查节点元信息
          const { data: nodes, error: nodeErr } = await supabaseAdmin
            .from("knowledge_articles")
            .select("id, title, category, excerpt, cover, cover_url")
            .in("id", Array.from(relatedIds));

          if (nodeErr) {
            console.error("[relations] node query error:", nodeErr);
            return json({ center: undefined, nodes: [], edges: [] }, 200);
          }

          const nodeMap = new Map<string, NodeRow>();
          for (const n of (nodes || []) as NodeRow[]) {
            nodeMap.set(n.id, n);
          }

          const center = nodeMap.get(id);
          const graphNodes: any[] = [];
          for (const [, n] of nodeMap) {
            if (n.id === id) continue; // 中心节点单独返回
            graphNodes.push({
              id: n.id,
              title: n.title,
              category: n.category,
              excerpt: n.excerpt || "",
              cover: n.cover || "",
              coverUrl: n.cover_url || null,
            });
          }

          const graphEdges = relations.map((r) => ({
            source: r.from_article_id,
            target: r.to_article_id,
            type: r.relation_type,
            weight: r.weight || 1,
            description: r.description || "",
          }));

          const payload = {
            center: center
              ? {
                  id: center.id,
                  title: center.title,
                  category: center.category,
                  excerpt: center.excerpt || "",
                  cover: center.cover || "",
                  coverUrl: center.cover_url || null,
                }
              : undefined,
            nodes: graphNodes,
            edges: graphEdges,
          };

          setCache(cacheKey, payload);
          return json(payload, 200, { "X-Cache": "MISS" });
        } catch (err) {
          console.error("[relations] handler error:", err);
          return json({ center: undefined, nodes: [], edges: [] }, 200);
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
