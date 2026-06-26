/**
 * 神话传说详情页 — 采用故事化叙事
 * 1. 故事简介
 * 2. 剧情发展时间线
 * 3. 主要人物
 * 4. 神话关系图
 * 5. 象征意义
 * 6. 后世文学影视影响
 * 7. AI 故事解读
 */
import { SectionHeading } from "../section-heading";
import { TimelineBlock, type TimelineEvent } from "../timeline-block";
import { getCategoryMeta } from "../category-meta";
import { BookOpen, Users, Sparkles, Film, Quote, Layers } from "lucide-react";
import type { Article, RelatedItem } from "@/lib/knowledge-types";

interface Props {
  article: Article;
  /** 剧情发展时间线 */
  plot?: TimelineEvent[];
  /** 主要人物 */
  characters?: { name: string; role: string; description: string; cover?: string }[];
  /** 神话关系图（人物/事件间关系） */
  relationships?: { from: string; to: string; type: string }[];
}

export function MythologySections({ article, plot = [], characters = [], relationships = [] }: Props) {
  const meta = getCategoryMeta("mythology");
  const accent = meta.accent;

  return (
    <>
      {/* === 1. 故事简介 === */}
      <section className="mb-8">
        <SectionHeading icon={BookOpen} title="故事简介" watermark="序" accent={accent} />
        <div
          className="relative overflow-hidden rounded-2xl border p-6 md:p-8"
          style={{
            borderColor: accent,
            background: `linear-gradient(135deg, color-mix(in oklab, ${accent} 5%, var(--color-card)) 0%, var(--color-card) 100%)`,
          }}
        >
          <Quote className="absolute right-4 top-4 h-12 w-12 text-foreground/[0.04]" />
          <p className="whitespace-pre-line font-serif text-base leading-loose text-foreground/90">
            {article.content || article.excerpt}
          </p>
        </div>
      </section>

      {/* === 2. 剧情发展时间线 === */}
      {plot.length > 0 && (
        <TimelineBlock
          title="剧情发展时间线"
          events={plot}
          accent={accent}
          watermark="幕"
        />
      )}

      {/* === 3. 主要人物 === */}
      {characters.length > 0 && (
        <section className="mb-8">
          <SectionHeading icon={Users} title="主要人物" watermark="人" accent={accent} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {characters.map((c, i) => (
              <div
                key={i}
                className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 transition hover:border-foreground/30 hover:shadow-md"
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-serif text-base font-bold text-white shadow-sm"
                  style={{ background: accent }}
                >
                  {c.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-serif text-base font-semibold text-foreground">{c.name}</h4>
                    <span
                      className="rounded-sm px-1.5 py-0.5 font-serif text-[9px] tracking-widest text-white"
                      style={{ background: accent }}
                    >
                      {c.role}
                    </span>
                  </div>
                  <p className="mt-1.5 font-serif text-xs leading-relaxed text-foreground/75">
                    {c.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* === 4. 神话关系图 === */}
      {relationships.length > 0 && (
        <section className="mb-8">
          <SectionHeading icon={Layers} title="神话关系图" watermark="图" accent={accent} />
          <RelationshipGraphSimple relationships={relationships} accent={accent} />
        </section>
      )}

      {/* === 5. 象征意义 === */}
      {article.history && (
        <section className="mb-8">
          <SectionHeading icon={Sparkles} title="象征意义" watermark="象" accent={accent} />
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="whitespace-pre-line font-serif text-sm leading-relaxed text-foreground/85">
              {article.history}
            </p>
          </div>
        </section>
      )}

      {/* === 6. 后世文学影视影响 === */}
      {article.influence && (
        <section className="mb-8">
          <SectionHeading icon={Film} title="后世文学影视影响" watermark="响" accent={accent} />
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="whitespace-pre-line font-serif text-sm leading-relaxed text-foreground/85">
              {article.influence}
            </p>
          </div>
        </section>
      )}
    </>
  );
}

function RelationshipGraphSimple({
  relationships,
  accent,
}: {
  relationships: { from: string; to: string; type: string }[];
  accent: string;
}) {
  // 简单关系网络（圆形布局）
  const nodes = Array.from(
    new Set(relationships.flatMap((r) => [r.from, r.to]))
  );
  const cx = 200, cy = 150, r = 110;
  const positions = new Map<string, { x: number; y: number }>();
  nodes.forEach((n, i) => {
    const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
    positions.set(n, {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    });
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex justify-center overflow-x-auto">
        <svg viewBox="0 0 400 300" className="w-full max-w-[500px]">
          <defs>
            <radialGradient id="rel-node" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={accent} stopOpacity="0.9" />
              <stop offset="100%" stopColor={accent} stopOpacity="0.4" />
            </radialGradient>
          </defs>
          {/* 边 */}
          {relationships.map((rel, i) => {
            const sp = positions.get(rel.from);
            const tp = positions.get(rel.to);
            if (!sp || !tp) return null;
            return (
              <g key={i}>
                <line
                  x1={sp.x}
                  y1={sp.y}
                  x2={tp.x}
                  y2={tp.y}
                  stroke={accent}
                  strokeWidth={1.5}
                  strokeOpacity={0.4}
                  strokeDasharray="3 3"
                />
                <text
                  x={(sp.x + tp.x) / 2}
                  y={(sp.y + tp.y) / 2 - 4}
                  textAnchor="middle"
                  fontSize="9"
                  fontFamily="serif"
                  fill={accent}
                  opacity={0.7}
                >
                  {rel.type}
                </text>
              </g>
            );
          })}
          {/* 节点 */}
          {nodes.map((n) => {
            const p = positions.get(n);
            if (!p) return null;
            return (
              <g key={n}>
                <circle cx={p.x} cy={p.y} r={26} fill="url(#rel-node)" />
                <text
                  x={p.x}
                  y={p.y + 4}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="'Noto Serif SC', serif"
                  fill="white"
                >
                  {n.length > 4 ? n.slice(0, 3) : n}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="mt-3 text-center font-serif text-[10px] tracking-widest text-muted-foreground">
        共 {nodes.length} 节点 / {relationships.length} 关系
      </p>
    </div>
  );
}
