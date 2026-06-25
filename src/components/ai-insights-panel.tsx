// AI 深度内容展示组件
// 包含：知识图谱、时间线、现代解读、常见问题四大模块

import { useMemo } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Network,
  Clock,
  Sparkles,
  HelpCircle,
  ExternalLink,
  User,
  BookOpen,
  Calendar,
  Quote,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import type { Article, RelatedItem } from "@/lib/knowledge-data";
import type { AIInsights, KnowledgeGraph, TimelineEvent, FAQ } from "@/lib/ai-insights-types";
import { generateAIInsights } from "@/lib/ai-insights-generator";
import { getExpandedContent } from "@/lib/expanded-content";

interface AIInsightsPanelProps {
  article: Article;
}

// ===== 知识图谱组件 =====
function KnowledgeGraphView({ graph }: { graph: KnowledgeGraph }) {
  const navigate = useNavigate();

  if (!graph.nodes.length) return null;

  // 计算每个节点的位置（环形布局 + 中心节点）
  const positionedNodes = useMemo(() => {
    const core = graph.nodes.find((n) => n.type === "core");
    const others = graph.nodes.filter((n) => n.type !== "core");
    const radius = 140;
    const cx = 200;
    const cy = 180;

    const result = graph.nodes.map((n) => {
      if (n.type === "core") return { ...n, x: cx, y: cy };
      const idx = others.findIndex((o) => o.id === n.id);
      const angle = (idx / Math.max(others.length, 1)) * Math.PI * 2;
      return {
        ...n,
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
      };
    });
    return result;
  }, [graph.nodes]);

  const nodeMap = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    positionedNodes.forEach((n) => {
      if (n.x !== undefined && n.y !== undefined) {
        map[n.id] = { x: n.x, y: n.y };
      }
    });
    return map;
  }, [positionedNodes]);

  // 节点颜色配置
  const nodeColors: Record<string, { fill: string; stroke: string; text: string }> = {
    core: { fill: "#fef3c7", stroke: "#f59e0b", text: "#92400e" },
    person: { fill: "#dbeafe", stroke: "#3b82f6", text: "#1e40af" },
    book: { fill: "#fce7f3", stroke: "#ec4899", text: "#9d174d" },
    event: { fill: "#d1fae5", stroke: "#10b981", text: "#065f46" },
    concept: { fill: "#ede9fe", stroke: "#8b5cf6", text: "#5b21b6" },
  };

  const handleNodeClick = (link?: string) => {
    if (!link) return;
    navigate({ to: "/article/$id", params: { id: link } });
  };

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox="0 0 400 360"
        className="w-full max-w-2xl mx-auto"
        style={{ minHeight: 360 }}
      >
        {/* 边 */}
        {graph.edges.map((edge, i) => {
          const s = nodeMap[edge.source];
          const t = nodeMap[edge.target];
          if (!s || !t) return null;
          return (
            <g key={i}>
              <line
                x1={s.x}
                y1={s.y}
                x2={t.x}
                y2={t.y}
                stroke="#d4d4d8"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <text
                x={(s.x + t.x) / 2}
                y={(s.y + t.y) / 2 - 4}
                fontSize="9"
                fill="#71717a"
                textAnchor="middle"
              >
                {edge.label}
              </text>
            </g>
          );
        })}
        {/* 节点 */}
        {positionedNodes.map((node) => {
          const color = nodeColors[node.type] || nodeColors.concept;
          return (
            <g
              key={node.id}
              onClick={() => handleNodeClick(node.link)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleNodeClick(node.link);
                }
              }}
              tabIndex={node.link ? 0 : -1}
              role={node.link ? "button" : undefined}
              style={{
                cursor: node.link ? "pointer" : "default",
                transition: "transform 0.2s",
              }}
              className="hover:opacity-80 focus:outline-none focus:opacity-80"
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={node.type === "core" ? 38 : 26}
                fill={color.fill}
                stroke={color.stroke}
                strokeWidth="2"
              />
              <text
                x={node.x}
                y={node.y + 3}
                fontSize={node.type === "core" ? 11 : 9}
                fontWeight={node.type === "core" ? 700 : 500}
                fill={color.text}
                textAnchor="middle"
                pointerEvents="none"
              >
                {node.label.length > 5 ? node.label.slice(0, 5) : node.label}
              </text>
              {node.type !== "core" && (
                <text
                  x={node.x}
                  y={node.y + (node.type === "core" ? 50 : 36)}
                  fontSize="7"
                  fill={color.text}
                  textAnchor="middle"
                  opacity="0.7"
                  pointerEvents="none"
                >
                  {node.type === "person" ? "人物" :
                   node.type === "book" ? "典籍" :
                   node.type === "event" ? "事件" : "诗词"}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {/* 图例 */}
      <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs">
        {Object.entries(nodeColors).map(([key, color]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-full border-2"
              style={{ background: color.fill, borderColor: color.stroke }}
            />
            <span className="text-muted-foreground">
              {key === "core" ? "中心主题" :
               key === "person" ? "人物" :
               key === "book" ? "典籍" :
               key === "event" ? "事件" : "诗词"}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground/60">
        💡 提示：点击有下划线暗示的节点可跳转至对应详情页
      </p>
    </div>
  );
}

// ===== 时间线组件 =====
function TimelineView({ events }: { events: TimelineEvent[] }) {
  if (!events.length) return null;
  return (
    <div className="relative pl-8">
      {/* 时间线主轴 */}
      <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gradient-to-b from-accent/40 via-accent/60 to-accent/20" />
      <ol className="space-y-6">
        {events.map((event, idx) => {
          const isRelated = event.year === "相关";
          const isClickable = !!event.link;
          const Content = (
            <div
              className={`group relative rounded-lg border p-4 transition ${
                isClickable ? "hover:border-accent/40 hover:bg-accent/5 cursor-pointer" : ""
              } ${isRelated ? "border-dashed border-accent/30 bg-accent/5" : "border-border bg-card/40"}`}
            >
              <div className="mb-1 flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-serif tracking-wider ${
                    isRelated
                      ? "bg-accent/15 text-accent"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {event.year}
                </span>
              </div>
              <h4 className="font-serif text-base font-semibold text-foreground">
                {event.title}
              </h4>
              <p className="mt-1 font-serif text-sm leading-relaxed text-foreground/70">
                {event.description}
              </p>
              {isClickable && (
                <ArrowRight className="absolute right-3 top-3 h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100 group-hover:text-accent" />
              )}
            </div>
          );

          return (
            <li key={idx} className="relative">
              {/* 时间线圆点 */}
              <div
                className={`absolute -left-[26px] top-4 h-3 w-3 rounded-full border-2 border-background ${
                  isRelated ? "bg-accent" : "bg-muted-foreground"
                }`}
              />
              {isClickable ? (
                <Link to="/article/$id" params={{ id: event.link! }}>
                  {Content}
                </Link>
              ) : (
                Content
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ===== FAQ 组件 =====
function FAQView({ faqs }: { faqs: FAQ[] }) {
  if (!faqs.length) return null;
  return (
    <div className="space-y-3">
      {faqs.map((faq, idx) => (
        <details
          key={idx}
          className="group rounded-xl border border-border bg-card/40 transition open:bg-card open:shadow-sm"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent/15 font-serif text-xs text-accent">
                {idx + 1}
              </span>
              <h4 className="font-serif text-base font-semibold text-foreground">
                {faq.question}
              </h4>
            </div>
            <span className="text-xl text-muted-foreground transition group-open:rotate-45">+</span>
          </summary>
          <div className="px-4 pb-4 pl-13">
            <p className="font-serif leading-loose text-foreground/80">
              {faq.answer}
            </p>
            {faq.link && (
              <Link
                to="/article/$id"
                params={{ id: faq.link }}
                className="mt-3 inline-flex items-center gap-1 text-sm text-accent hover:underline"
              >
                查看相关详情 <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}

// ===== 关联条目渲染组件 =====
function RelatedItemsView({
  title,
  icon: Icon,
  items,
  colorClass,
}: {
  title: string;
  icon: React.ElementType;
  items: RelatedItem[];
  colorClass: string;
}) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${colorClass}`} />
        <h3 className="font-serif text-sm font-semibold tracking-widest text-foreground/80">
          {title}
        </h3>
        <span className="text-xs text-muted-foreground">· {items.length}</span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((item, idx) => {
          const inner = (
            <div className="flex items-start gap-3 rounded-xl border border-border bg-card/40 p-3 transition group-hover:border-accent/40 group-hover:bg-accent/5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="truncate font-serif text-sm font-semibold text-foreground">
                    {item.title}
                  </h4>
                  {item.external && (
                    <ExternalLink className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                  )}
                </div>
                {item.brief && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {item.brief}
                  </p>
                )}
                {item.category && !item.external && (
                  <span className="mt-1.5 inline-block rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-serif text-accent">
                    {item.category}
                  </span>
                )}
              </div>
            </div>
          );

          if (item.external && item.externalUrl) {
            return (
              <a
                key={idx}
                href={item.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                {inner}
              </a>
            );
          }
          return (
            <Link
              key={idx}
              to="/article/$id"
              params={{ id: item.id }}
              className="group"
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ===== 主组件 =====
export function AIInsightsPanel({ article }: AIInsightsPanelProps) {
  const insights: AIInsights = useMemo(() => generateAIInsights(article), [article]);

  // 历史背景/现代解读兜底：DB 字段 > expanded-content.json > 空串
  const expanded = getExpandedContent(article.id);
  const displayHistory: string =
    (article as any).history || expanded?.history || "";
  const displayInfluence: string =
    (article as any).influence || expanded?.influence || "";

  return (
    <div className="mt-10 space-y-8">
      {/* ===== 静态结构化字段 ===== */}

      {/* 出处 */}
      {article.source && (
        <section className="rounded-2xl border border-border bg-card/30 p-6">
          <div className="mb-3 flex items-center gap-2">
            <Quote className="h-4 w-4 text-accent" />
            <h3 className="font-serif text-sm font-semibold tracking-widest text-foreground/80">
              出处
            </h3>
          </div>
          <p className="font-serif leading-loose text-foreground/80">
            {article.source}
          </p>
        </section>
      )}

      {/* 历史背景 */}
      {displayHistory && (
        <section className="rounded-2xl border border-border bg-card/30 p-6">
          <div className="mb-3 flex items-center gap-2">
            <ScrollTextIcon />
            <h3 className="font-serif text-sm font-semibold tracking-widest text-foreground/80">
              历史背景
            </h3>
          </div>
          <p className="font-serif leading-loose text-foreground/80 whitespace-pre-wrap">
            {displayHistory}
          </p>
        </section>
      )}

      {/* 关联条目：人物 / 典籍 / 事件 / 诗词 / 推荐 */}
      <section className="space-y-5 rounded-2xl border border-border bg-card/30 p-6">
        <h2 className="font-serif text-lg font-semibold text-foreground">
          知识关联
        </h2>
        <RelatedItemsView
          title="相关人物"
          icon={User}
          items={article.relatedPeople || []}
          colorClass="text-blue-500"
        />
        <RelatedItemsView
          title="相关典籍"
          icon={BookOpen}
          items={article.relatedBooks || []}
          colorClass="text-pink-500"
        />
        {/* 权威平台外链：基于相关典籍书名查表 */}
        {(() => {
          const books = article.relatedBooks || [];
          const matched = books
            .map((b) => findBookLink(b.title))
            .filter((x): x is NonNullable<typeof x> => !!x);
          if (matched.length === 0) return null;
          return (
            <div className="rounded-xl border border-accent/20 bg-accent/5 p-3">
              <div className="text-xs text-muted-foreground">
                <BookLinkButtons
                  shidianguji={matched[0].shidianguji}
                  ctext={matched[0].ctext}
                  wikisource={matched[0].wikisource}
                  title={matched[0].name}
                />
              </div>
              {matched.length > 1 && (
                <div className="mt-2 text-[10px] text-muted-foreground/70">
                  · {matched.slice(1, 3).map((m) => m.name).join(" · ")} 也可在识典古籍查看
                </div>
              )}
            </div>
          );
        })()}
        <RelatedItemsView
          title="相关事件"
          icon={Calendar}
          items={article.relatedEvents || []}
          colorClass="text-emerald-500"
        />
        <RelatedItemsView
          title="相关诗词"
          icon={Quote}
          items={article.relatedPoems || []}
          colorClass="text-violet-500"
        />
        <RelatedItemsView
          title="相关推荐"
          icon={ArrowRight}
          items={article.relatedArticles || []}
          colorClass="text-accent"
        />
      </section>

      {/* ===== AI 自动生成部分 ===== */}

      {/* 知识图谱 */}
      <section className="rounded-2xl border border-accent/20 bg-accent/5 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Network className="h-5 w-5 text-accent" />
          <h2 className="font-serif text-xl text-foreground">知识图谱</h2>
          <span className="ml-auto rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-serif text-accent">
            AI 生成
          </span>
        </div>
        <p className="mb-4 font-serif text-sm text-muted-foreground">
          点击节点查看关联条目的详细信息
        </p>
        <KnowledgeGraphView graph={insights.knowledgeGraph} />
      </section>

      {/* 时间线 */}
      <section className="rounded-2xl border border-border bg-card/30 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-accent" />
          <h2 className="font-serif text-xl text-foreground">时间线</h2>
          <span className="ml-auto rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-serif text-accent">
            AI 生成
          </span>
        </div>
        <p className="mb-4 font-serif text-sm text-muted-foreground">
          追溯源流，纵观演变
        </p>
        <TimelineView events={insights.timeline} />
      </section>

      {/* 现代解读 */}
      <section className="rounded-2xl border border-border bg-card/30 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <h2 className="font-serif text-xl text-foreground">现代解读</h2>
          <span className="ml-auto rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-serif text-accent">
            AI 生成
          </span>
        </div>
        <div className="space-y-5">
          <div>
            <h3 className="mb-2 font-serif text-sm font-semibold tracking-widest text-foreground/70">
              <Lightbulb className="mr-1 inline h-3.5 w-3.5" />
              总体解读
            </h3>
            <p className="font-serif leading-loose text-foreground/85">
              {insights.modernInterpretation.summary}
            </p>
            {displayInfluence && (
              <p className="mt-3 font-serif leading-loose text-foreground/85 whitespace-pre-wrap">
                {displayInfluence}
              </p>
            )}
          </div>
          <div>
            <h3 className="mb-2 font-serif text-sm font-semibold tracking-widest text-foreground/70">
              <ArrowRight className="mr-1 inline h-3.5 w-3.5" />
              现代应用
            </h3>
            <ul className="space-y-1.5">
              {insights.modernInterpretation.applications.map((app, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 font-serif text-sm leading-relaxed text-foreground/80"
                >
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent/50" />
                  <span>{app}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 font-serif text-sm font-semibold tracking-widest text-foreground/70">
              <Sparkles className="mr-1 inline h-3.5 w-3.5" />
              当代视角
            </h3>
            <ul className="space-y-1.5">
              {insights.modernInterpretation.perspectives.map((p, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 font-serif text-sm leading-relaxed text-foreground/80"
                >
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent/50" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 常见问题 */}
      <section className="rounded-2xl border border-border bg-card/30 p-6">
        <div className="mb-4 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-accent" />
          <h2 className="font-serif text-xl text-foreground">常见问题</h2>
          <span className="ml-auto rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-serif text-accent">
            AI 生成
          </span>
        </div>
        <FAQView faqs={insights.faq} />
      </section>
    </div>
  );
}

// 内联小图标
function ScrollTextIcon() {
  return (
    <svg className="h-4 w-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 12h-5" />
      <path d="M15 8h-5" />
      <path d="M19 17V5a2 2 0 0 0-2-2H4" />
      <path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" />
    </svg>
  );
}
