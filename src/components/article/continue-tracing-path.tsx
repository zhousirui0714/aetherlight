import { useState, useMemo } from "react";
import { SectionHeading } from "./section-heading";
import { Compass, Loader2, Network, ChevronRight } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useArticleRelations } from "@/hooks/article-hooks";
import type { GraphNode, GraphEdge } from "@/lib/knowledge-types";

interface ContinueTracingPathProps {
  articleId: string;
  articleTitle: string;
  accent?: string;
}

/**
 * 「继续溯光」探索路径 — 不是简单相关推荐，而是基于知识图谱
 *
 * 1. 从中心节点出发，按相关度+时代性生成 1 条主路径
 * 2. 路径附带解说（如"李白的师承→贺知章"）
 * 3. 同时展示节点图（复用 article-related-graph 的视觉）
 * 4. 可一键"开启"整条路径，逐步探索
 */
export function ContinueTracingPath({
  articleId,
  articleTitle,
  accent = "var(--color-cinnabar)",
}: ContinueTracingPathProps) {
  const { graph, loading, error } = useArticleRelations(articleId);
  const navigate = useNavigate();
  const [activeIdx, setActiveIdx] = useState(0);

  // 1) 智能生成探索路径
  const path = useMemo(() => buildExplorationPath(graph, articleId), [graph, articleId]);

  if (loading) {
    return (
      <section className="mb-8">
        <SectionHeading icon={Compass} title="继续溯光" subtitle="CONTINUE TRACING" watermark="溯" accent={accent} />
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: accent }} />
          <span className="ml-2 font-serif text-sm text-muted-foreground">生成文化探索路线中…</span>
        </div>
      </section>
    );
  }

  if (error || !graph || path.length === 0) {
    return (
      <section className="mb-8">
        <SectionHeading icon={Compass} title="继续溯光" subtitle="CONTINUE TRACING" watermark="溯" accent={accent} />
        <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-8 text-center text-sm text-muted-foreground">
          暂无足够关联信息，溯光会逐步为该条目建立文化网络
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <SectionHeading
        icon={Compass}
        title="继续溯光"
        subtitle="CONTINUE TRACING"
        watermark="溯"
        accent={accent}
        trailing={
          <span className="font-serif text-[10px] tracking-widest text-muted-foreground">
            基于知识图谱 · 探索 {path.length} 步
          </span>
        }
      />

      {/* 路径条 */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="mb-4 font-serif text-sm italic leading-relaxed text-muted-foreground">
          「从<button
            type="button"
            onClick={() => navigate({ to: "/article/$id", params: { id: articleId } })}
            className="font-semibold text-foreground hover:underline"
            style={{ color: accent }}
          >{articleTitle}</button>出发，沿文化线索继续溯光：」
        </p>

        <ol className="relative space-y-3">
          {/* 竖向墨线 */}
          <span
            aria-hidden
            className="absolute left-3 top-2 bottom-2 w-px"
            style={{
              background: `linear-gradient(to bottom, ${accent} 0%, color-mix(in oklab, ${accent} 30%, transparent) 100%)`,
            }}
          />
          {path.map((step, idx) => (
            <li
              key={step.node.id}
              className={`group relative cursor-pointer rounded-xl border p-4 pl-10 transition-all ${
                activeIdx === idx
                  ? "shadow-md"
                  : "border-border hover:border-foreground/30"
              }`}
              style={
                activeIdx === idx
                  ? { borderColor: accent, background: `color-mix(in oklab, ${accent} 6%, var(--color-card))` }
                  : undefined
              }
              onMouseEnter={() => setActiveIdx(idx)}
              onClick={() => navigate({ to: "/article/$id", params: { id: step.node.id } })}
            >
              {/* 步骤章 */}
              <span
                aria-hidden
                className="absolute left-1.5 top-4 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-serif font-bold text-white shadow"
                style={{ background: accent }}
              >
                {idx + 1}
              </span>
              <div className="flex items-center gap-2">
                <h4 className="font-serif text-sm font-semibold text-foreground">
                  {step.node.title}
                </h4>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 transition group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>
              <p className="mt-1.5 font-serif text-xs leading-relaxed text-foreground/70">
                {step.reason}
              </p>
              {step.node.excerpt && (
                <p className="mt-1.5 line-clamp-2 font-serif text-[11px] italic text-foreground/55">
                  {step.node.excerpt}
                </p>
              )}
            </li>
          ))}
        </ol>

        {/* 提示 */}
        <p className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-[11px] text-muted-foreground">
          <Network className="h-3 w-3" />
          <span>
            知识图谱共 {graph.nodes.length} 节点 / {graph.edges.length} 关系 · 点击节点继续溯光
          </span>
        </p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 内部：从图谱生成文化探索路径
// ---------------------------------------------------------------------------
function buildExplorationPath(
  graph: { center?: GraphNode; nodes: GraphNode[]; edges: GraphEdge[] } | null,
  articleId: string
): Array<{ node: GraphNode; reason: string }> {
  if (!graph || !graph.center) return [];

  // 1) 拿到所有直连中心节点的邻居
  const direct = graph.edges.filter(
    (e) => e.source === articleId || e.target === articleId
  );

  // 2) 路径生成：按 weight 排序 + 边类型权重
  const TYPE_WEIGHT: Record<string, number> = {
    influence: 5,        // 影响关系最相关
    cultural: 4,
    person_of: 4,
    teacher_of: 4,
    book_of: 3,
    poem_of: 3,
    imagery: 2,
    temporal: 1,
  };
  const sorted = direct
    .map((e) => {
      const otherId = e.source === articleId ? e.target : e.source;
      const node = graph.nodes.find((n) => n.id === otherId);
      if (!node) return null;
      const w = (TYPE_WEIGHT[e.type] || 1) * (e.weight || 1);
      return { edge: e, node, weight: w };
    })
    .filter(Boolean)
    .sort((a, b) => (b?.weight || 0) - (a?.weight || 0))
    .slice(0, 5);

  // 3) 给每步配一个 reason
  return sorted.filter((s): s is { edge: GraphEdge; node: GraphNode; weight: number } => s !== null).map((s) => ({
    node: s.node,
    reason: s.edge.description || reasonFromType(s.edge.type, graph.center?.title || ""),
  }));
}

function reasonFromType(type: string, centerTitle: string): string {
  const m: Record<string, string> = {
    influence: `在文化脉络上与「${centerTitle}」相互影响`,
    person_of: `与「${centerTitle}」所在的人物/事件相关`,
    teacher_of: `与「${centerTitle}」有师承或学问传承`,
    book_of: `是「${centerTitle}」所引典籍的延伸阅读`,
    poem_of: `与「${centerTitle}」同属文学脉络`,
    imagery: `与「${centerTitle}」共享意象或主题`,
    cultural: `与「${centerTitle}」属同一文化圈层`,
    temporal: `与「${centerTitle}」处于相近时代`,
    place_of: `与「${centerTitle}」共享地理文化背景`,
  };
  return m[type] || `与「${centerTitle}」存在文化关联`;
}
