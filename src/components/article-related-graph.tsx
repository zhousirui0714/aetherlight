import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Network, BookOpen, User, Lightbulb, Calendar, MapPin, Tag, Quote, ExternalLink } from "lucide-react";
import { CATEGORY_CN, type CategoryKey, CATEGORY_ALIAS_CN } from "@/lib/knowledge-types";
import { knowledgeApi } from "@/lib/knowledge-api";
import type { KnowledgeGraph as KG } from "@/lib/knowledge-types";

interface ArticleRelatedGraphProps {
  articleId: string;
  articleTitle?: string;
}

const RELATION_LABEL: Record<string, string> = {
  person_of:    "人物",
  book_of:      "典籍",
  place_of:     "地点",
  concept_of:   "概念",
  event_of:     "事件",
  poem_of:      "诗词",
  mentioned_in: "引用",
  related:      "相关",
};

const CATEGORY_ICON: Record<string, any> = {
  figures:    User,
  poems:      Quote,
  classics:   BookOpen,
  festivals:  Calendar,
  mythology:  Lightbulb,
  intangible: Lightbulb,
  artifacts:  MapPin,
  lifestyle:  Lightbulb,
  philosophy: Lightbulb,
  technology: Lightbulb,
};

const CATEGORY_COLOR: Record<string, string> = {
  figures:    "from-blue-500/80 to-blue-700/80",
  poems:      "from-rose-500/80 to-rose-700/80",
  classics:   "from-amber-500/80 to-amber-700/80",
  festivals:  "from-emerald-500/80 to-emerald-700/80",
  mythology:  "from-purple-500/80 to-purple-700/80",
  intangible: "from-orange-500/80 to-orange-700/80",
  artifacts:  "from-slate-500/80 to-slate-700/80",
  lifestyle:  "from-pink-500/80 to-pink-700/80",
  philosophy: "from-indigo-500/80 to-indigo-700/80",
  technology: "from-cyan-500/80 to-cyan-700/80",
};

export function ArticleRelatedGraph({ articleId, articleTitle }: ArticleRelatedGraphProps) {
  const navigate = useNavigate();
  const [graph, setGraph] = useState<KG | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    knowledgeApi
      .getRelations(articleId)
      .then((data) => {
        if (!alive) return;
        setGraph(data);
      })
      .catch((err) => {
        if (!alive) return;
        console.error("[article-graph] failed:", err);
        setError(err?.message || "图谱加载失败");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [articleId]);

  // 按 category 分组节点
  const grouped = graph?.nodes.reduce<Record<string, typeof graph.nodes>>((acc, n) => {
    const k = (n.category || "其他") as string;
    if (!acc[k]) acc[k] = [];
    acc[k].push(n);
    return acc;
  }, {}) ?? {};

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="mt-2 text-xs text-muted-foreground">图谱加载中…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
        {error}
      </div>
    );
  }

  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-10 text-center">
        <Network className="mx-auto h-8 w-8 text-muted-foreground/30" />
        <p className="mt-3 text-sm text-muted-foreground">暂无关联条目</p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          溯光会逐步为该条目建立知识图谱
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 概览条 */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-secondary/30 px-4 py-2.5 text-xs">
        <Network className="h-4 w-4 text-primary" />
        <span className="text-foreground">关联节点 <b className="text-primary">{graph.nodes.length}</b> 个</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-foreground">关系 <b className="text-primary">{graph.edges.length}</b> 条</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-xs text-muted-foreground">
          跨 <b className="text-foreground">{Object.keys(grouped).length}</b> 个分类
        </span>
      </div>

      {/* 关系按类型展开 */}
      <div className="space-y-3">
        {Object.entries(grouped).map(([cat, nodes]) => {
          const catKey = (CATEGORY_ALIAS_CN[cat] || cat) as CategoryKey;
          const colorClass = CATEGORY_COLOR[catKey] || "from-slate-500/80 to-slate-700/80";
          const Icon = CATEGORY_ICON[catKey] || Tag;
          return (
            <div key={cat} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${colorClass}`}>
                  <Icon className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="flex-1">
                  <h5 className="font-serif text-sm font-semibold text-foreground">
                    {CATEGORY_CN[catKey] || cat}
                  </h5>
                  <p className="text-[10px] text-muted-foreground">{nodes.length} 个关联</p>
                </div>
              </div>

              <div className="space-y-1.5">
                {nodes.map((node) => {
                  // 找该节点相关的所有边
                  const nodeEdges = graph.edges.filter(
                    (e) => e.source === node.id || e.target === node.id
                  );
                  return (
                    <button
                      key={node.id}
                      onClick={() => navigate({ to: "/article/$id", params: { id: node.id } })}
                      className="group flex w-full flex-col gap-1 rounded-lg border border-border bg-secondary/30 px-3 py-2 text-left transition hover:border-primary/40 hover:bg-secondary/60"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-sm font-medium text-foreground group-hover:text-primary line-clamp-1">
                          {node.title}
                        </span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                      </div>
                      {nodeEdges.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {nodeEdges.slice(0, 3).map((e, idx) => {
                            const relType = RELATION_LABEL[e.type] || e.type;
                            const dir = e.source === articleId ? "→" : "←";
                            return (
                              <span
                                key={idx}
                                title={e.description}
                                className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary"
                              >
                                {relType} {dir}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
