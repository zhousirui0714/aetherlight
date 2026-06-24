import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Network, Info, X } from "lucide-react";
import { knowledgeApi } from "@/lib/knowledge-api";
import type { KnowledgeGraph, GraphNode, GraphEdge } from "@/lib/knowledge-types";

interface ArticleRelatedGraphProps {
  articleId: string;
  articleTitle?: string;
}

// ============================================================
// 节点类型与视觉映射
// ============================================================
// 3 类节点：
//   - core:    核心节点（人物/朝代/文化核心）= 墨团 + 印章 + 发光
//   - content: 内容节点（诗词/节气/非遗）= 半透明小墨点
//   - concept: 概念节点（意象/主题）= 雾状不规则墨影
// ============================================================
type NodeType = "core" | "content" | "concept";

const CONTENT_CATEGORIES = new Set([
  "figures", "poems", "classics", "festivals", "mythology",
  "intangible", "artifacts", "lifestyle", "technology",
]);

// 概念关键词（title 中含此即视为概念节点）
const CONCEPT_KEYWORDS = [
  "道", "禅", "仁", "义", "礼", "智", "信", "孝", "忠", "廉", "耻",
  "理", "心", "性", "情", "志", "气", "魂", "梦", "神", "意", "象",
  "法", "德", "圣", "贤", "儒", "释", "道", "佛", "玄", "无", "有",
  "天", "地", "人", "阴", "阳", "五行", "太极", "八卦",
  "雅", "俗", "韵", "味", "境", "趣", "格", "品",
];

// ============================================================
// 4 类关系（时间/影响/文化/意象）
// ============================================================
type EdgeType = "temporal" | "influence" | "cultural" | "imagery";

interface EdgeStyle {
  color: string;       // 主色
  opacity: number;     // 默认透明度
  strength: number;    // 强度 0-1
  label: string;       // 关系名
}

const EDGE_STYLES: Record<EdgeType, EdgeStyle> = {
  temporal:  { color: "#5C4A3A", opacity: 0.6,  strength: 0.7, label: "时间" },
  influence: { color: "#2C2C2C", opacity: 0.85, strength: 1.0, label: "影响" },
  cultural:  { color: "#6B5B47", opacity: 0.7,  strength: 0.8, label: "文化" },
  imagery:   { color: "#8B7355", opacity: 0.5,  strength: 0.5, label: "意象" },
};

// 边类型 → 4 大类映射
function classifyEdge(edge: GraphEdge, articleId: string): EdgeType {
  const t = edge.type?.toLowerCase() || "";
  const desc = edge.description || "";
  // 影响关系
  if (t === "person_of" || t === "teacher_of" || t === "influence") return "influence";
  // 文化关系
  if (t === "book_of" || t === "place_of" || t === "event_of" || t === "festival_of") return "cultural";
  // 意象关系
  if (t === "poem_of" || t === "concept_of" || t === "mentioned_in" || t === "imagery") return "imagery";
  // 时间关系（描述里出现年/代/时期）
  if (/年|代|时期|朝|时/.test(desc)) return "temporal";
  return "cultural";
}

// ============================================================
// 数据预处理
// ============================================================
interface ProcessedNode extends GraphNode {
  type: NodeType;
  strength: number;     // 0-1，影响布局距离
}

interface ProcessedEdge extends GraphEdge {
  edgeType: EdgeType;
  style: EdgeStyle;
}

function classifyNode(node: GraphNode, isCenter: boolean): NodeType {
  if (isCenter) return "core";
  // 概念：title 含关键词
  for (const kw of CONCEPT_KEYWORDS) {
    if (node.title.includes(kw)) return "concept";
  }
  // 内容：category 命中
  if (node.category && CONTENT_CATEGORIES.has(node.category)) return "content";
  // 兜底：content
  return "content";
}

function preprocessGraph(graph: KnowledgeGraph, articleId: string) {
  const center = graph.center || { id: articleId, title: "", category: "" };
  const processedNodes: ProcessedNode[] = graph.nodes
    .filter(n => n.id !== articleId)
    .map(n => {
      const type = classifyNode(n, false);
      return {
        ...n,
        type,
        // 内容节点弱化、概念节点最弱、核心最强
        strength: type === "core" ? 1.0 : type === "content" ? 0.7 : 0.4,
      };
    });

  const processedEdges: ProcessedEdge[] = graph.edges
    .filter(e => e.source === articleId || e.target === articleId)
    .map(e => {
      const edgeType = classifyEdge(e, articleId);
      return {
        ...e,
        edgeType,
        style: EDGE_STYLES[edgeType],
      };
    });

  return { center, nodes: processedNodes, edges: processedEdges };
}

// ============================================================
// 布局：4 象限分类型 + 预设角度
// ============================================================
interface Position { x: number; y: number; }

function layoutNodes(
  nodes: ProcessedNode[],
  edges: ProcessedEdge[],
  centerId: string,
  articleId: string,
  width: number,
  height: number
): Map<string, Position> {
  const positions = new Map<string, Position>();
  const cx = width / 2;
  const cy = height / 2;

  // 中心节点
  positions.set(centerId, { x: cx, y: cy });

  // 按 4 象限分桶
  const buckets: Record<EdgeType, ProcessedNode[]> = {
    temporal: [], influence: [], cultural: [], imagery: [],
  };
  for (const n of nodes) {
    // 通过边判断它属于哪个象限
    const relatedEdge = edges.find(e => e.source === n.id || e.target === n.id);
    const t: EdgeType = relatedEdge?.edgeType || "cultural";
    buckets[t].push(n);
  }

  // 4 象限角度（顺时针）：上=意象, 右=文化, 下=时间, 左=影响
  const quadrantAngles: Record<EdgeType, number> = {
    imagery:   -Math.PI / 2,   // 上
    cultural:  0,              // 右
    temporal:  Math.PI / 2,    // 下
    influence: Math.PI,        // 左
  };

  for (const [type, list] of Object.entries(buckets) as [EdgeType, ProcessedNode[]][]) {
    if (list.length === 0) continue;
    const baseAngle = quadrantAngles[type];
    // 同象限内展开角度（±45°）
    const fanSize = Math.PI / 2;
    list.forEach((n, i) => {
      const t = list.length === 1 ? 0.5 : i / (list.length - 1);
      const angle = baseAngle - fanSize / 2 + fanSize * t;
      // 距离基于 strength（核心近、概念远）
      const distance = 130 + (1 - n.strength) * 100;  // 130~230
      positions.set(n.id, {
        x: cx + Math.cos(angle) * distance,
        y: cy + Math.sin(angle) * distance,
      });
    });
  }

  return positions;
}

// ============================================================
// 主组件
// ============================================================
export function ArticleRelatedGraph({ articleId, articleTitle }: ArticleRelatedGraphProps) {
  const navigate = useNavigate();
  const [graph, setGraph] = useState<KnowledgeGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 容器尺寸
  const [size, setSize] = useState({ w: 800, h: 520 });
  useEffect(() => {
    const update = () => {
      const w = Math.min(800, window.innerWidth - 40);
      setSize({ w, h: Math.min(520, w * 0.65) });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    knowledgeApi.getRelations(articleId)
      .then(data => { if (alive) setGraph(data); })
      .catch(err => { if (alive) setError(err?.message || "图谱加载失败"); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [articleId]);

  // 数据预处理 + 布局
  const { nodes, edges, center, positions, centerPos, allNodeIds } = useMemo(() => {
    if (!graph) return { nodes: [], edges: [], center: null, positions: new Map(), centerPos: { x: 0, y: 0 }, allNodeIds: new Set() };
    const p = preprocessGraph(graph, articleId);
    const positions = layoutNodes(p.nodes, p.edges, p.center?.id || articleId, articleId, size.w, size.h);
    const centerPos = positions.get(p.center?.id || articleId) || { x: size.w / 2, y: size.h / 2 };
    const allNodeIds = new Set<string>([p.center?.id || articleId, ...p.nodes.map(n => n.id)]);
    return { nodes: p.nodes, edges: p.edges, center: p.center, positions, centerPos, allNodeIds };
  }, [graph, articleId, size]);

  // 溯光路径：计算 selected → center 的主路径
  const tracePath = useMemo(() => {
    if (!selectedId) return new Set<string>();
    const path = new Set<string>([selectedId, articleId]);
    // 简化：从 selected 找到直接连到 articleId 的边
    const direct = edges.find(e =>
      (e.source === selectedId && e.target === articleId) ||
      (e.target === selectedId && e.source === articleId)
    );
    if (direct) {
      path.add(direct.source);
      path.add(direct.target);
    }
    return path;
  }, [selectedId, edges, articleId]);

  // 节点是否被"溯光"激活
  const isNodeLit = useCallback((id: string) => {
    if (!selectedId) return false;
    return tracePath.has(id);
  }, [selectedId, tracePath]);

  // 边是否被"溯光"激活
  const isEdgeLit = useCallback((e: GraphEdge) => {
    if (!selectedId) return false;
    return tracePath.has(e.source) && tracePath.has(e.target);
  }, [selectedId, tracePath]);

  // 节点是否被 hover 局部展开
  const isNeighbor = useCallback((id: string) => {
    if (!hoveredId) return false;
    if (hoveredId === id) return true;
    return edges.some(e =>
      (e.source === hoveredId && e.target === id) ||
      (e.target === hoveredId && e.source === id)
    );
  }, [hoveredId, edges]);

  // 是否被暗化（仅在溯光激活时）
  const isDimmed = useCallback((id: string) => {
    if (!selectedId) return false;
    return !tracePath.has(id);
  }, [selectedId, tracePath]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="mt-2 text-xs text-muted-foreground">图谱渲染中…</p>
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

  if (!graph || nodes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-10 text-center">
        <Network className="mx-auto h-8 w-8 text-muted-foreground/30" />
        <p className="mt-3 text-sm text-muted-foreground">暂无关联条目</p>
        <p className="mt-1 text-xs text-muted-foreground/70">溯光会逐步为该条目建立知识图谱</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 标题 + 概览 */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-secondary/30 px-4 py-2.5 text-xs">
        <Network className="h-4 w-4 text-primary" />
        <span className="text-foreground">
          关联节点 <b className="text-primary">{nodes.length}</b> 个
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="text-foreground">
          关系 <b className="text-primary">{edges.length}</b> 条
        </span>
        <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground">
          <Info className="h-3 w-3" /> hover · click · 墨为结构 · 光为路径
        </span>
      </div>

      {/* SVG 宇宙 */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-200/30 bg-[#F5F0E8]"
           style={{ aspectRatio: `${size.w} / ${size.h}` }}>
        {/* 3 层背景：宣纸 + 云雾 + 留白 */}
        <BackgroundLayers />

        {/* 选中信息栏 */}
        {selectedId && (() => {
          const sel = nodes.find(n => n.id === selectedId) || center;
          if (!sel) return null;
          return (
            <div className="absolute left-3 top-3 z-20 flex items-center gap-2 rounded-lg border border-amber-200/50 bg-paper/90 px-3 py-1.5 text-xs shadow-sm backdrop-blur">
              <span className="text-[10px] uppercase tracking-widest text-amber-700/70">已点亮</span>
              <span className="font-serif font-semibold text-foreground">{sel.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedId(null); }}
                className="ml-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })()}

        {/* 图例 */}
        <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-2 text-[10px] text-amber-900/70">
          <LegendDot color="#2C2C2C" label="核心" />
          <LegendDot color="#5C4A3A" label="内容" />
          <LegendDot color="#8B7355" label="概念" />
        </div>

        <div className="absolute bottom-3 right-3 z-10 text-[10px] tracking-widest text-amber-900/40">
          墨 · 为 · 历 · 史
        </div>

        {/* SVG 图谱本体 */}
        <svg
          viewBox={`0 0 ${size.w} ${size.h}`}
          className="absolute inset-0 h-full w-full"
          onClick={() => setSelectedId(null)}
        >
          <defs>
            {/* 墨晕径向渐变（核心节点） */}
            <radialGradient id="ink-core" cx="50%" cy="50%" r="50%">
              <stop offset="0%"  stopColor="#1a1a1a" stopOpacity="1" />
              <stop offset="60%" stopColor="#2C2C2C" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#2C2C2C" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="ink-core-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"  stopColor="#B8860B" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#B8860B" stopOpacity="0" />
            </radialGradient>

            {/* 墨点渐变（内容节点） */}
            <radialGradient id="ink-content" cx="50%" cy="50%" r="50%">
              <stop offset="0%"  stopColor="#2C2C2C" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#2C2C2C" stopOpacity="0" />
            </radialGradient>

            {/* 雾状墨影（概念节点） */}
            <radialGradient id="ink-concept" cx="50%" cy="50%" r="50%">
              <stop offset="0%"  stopColor="#5C4A3A" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#5C4A3A" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#5C4A3A" stopOpacity="0" />
            </radialGradient>

            {/* 墨丝连线渐变（按关系类型） */}
            <linearGradient id="ink-stroke-temporal" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"  stopColor="#5C4A3A" stopOpacity="0" />
              <stop offset="50%" stopColor="#5C4A3A" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#5C4A3A" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="ink-stroke-influence" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"  stopColor="#2C2C2C" stopOpacity="0" />
              <stop offset="50%" stopColor="#2C2C2C" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#2C2C2C" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="ink-stroke-cultural" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"  stopColor="#6B5B47" stopOpacity="0" />
              <stop offset="50%" stopColor="#6B5B47" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#6B5B47" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="ink-stroke-imagery" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"  stopColor="#8B7355" stopOpacity="0" />
              <stop offset="50%" stopColor="#8B7355" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#8B7355" stopOpacity="0" />
            </linearGradient>

            {/* 溯光（主路径铜金高亮） */}
            <linearGradient id="light-trace" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"  stopColor="#B8860B" stopOpacity="0" />
              <stop offset="50%" stopColor="#B8860B" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#B8860B" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="light-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"  stopColor="#B8860B" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#B8860B" stopOpacity="0" />
            </radialGradient>

            {/* 墨迹模糊滤镜（让所有边有"晕染"感） */}
            <filter id="ink-blur-soft" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.8" />
            </filter>
            <filter id="ink-blur-strong" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" />
            </filter>

            {/* 墨迹粗糙（核心节点边缘不规则） */}
            <filter id="ink-rough" x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
              <feDisplacementMap in="SourceGraphic" scale="2.5" />
            </filter>

            {/* 雾状不规则（概念节点） */}
            <filter id="ink-mist" x="-30%" y="-30%" width="160%" height="160%">
              <feTurbulence type="fractalNoise" baseFrequency="0.4" numOctaves="3" />
              <feDisplacementMap in="SourceGraphic" scale="6" />
            </filter>
          </defs>

          {/* 边：墨丝（先画，在节点下层） */}
          <g>
            {edges.map((e, idx) => {
              const sp = positions.get(e.source);
              const tp = positions.get(e.target);
              if (!sp || !tp) return null;
              // 中心节点的方向（弧形从中心向外）
              const fromX = e.source === (center?.id || articleId) ? sp.x : sp.x;
              const fromY = e.source === (center?.id || articleId) ? sp.y : sp.y;
              const toX = e.target === (center?.id || articleId) ? tp.x : tp.x;
              const toY = e.target === (center?.id || articleId) ? tp.y : tp.y;
              // 贝塞尔曲线中点（轻微弧形）
              const mx = (fromX + toX) / 2;
              const my = (fromY + toY) / 2;
              // 弧度垂直方向
              const dx = toX - fromX;
              const dy = toY - fromY;
              const len = Math.sqrt(dx * dx + dy * dy) || 1;
              const nx = -dy / len;
              const ny = dx / len;
              const arcStrength = 20;  // 弧度
              const cpx = mx + nx * arcStrength;
              const cpy = my + ny * arcStrength;

              const lit = isEdgeLit(e);
              const dimmed = selectedId && !lit;
              const strokeId = lit ? "light-trace" : `ink-stroke-${e.edgeType}`;
              const blur = lit ? "0" : (e.style.strength < 0.6 ? "url(#ink-blur-strong)" : "url(#ink-blur-soft)");
              const baseOpacity = lit ? 0.95 : e.style.opacity;
              const finalOpacity = dimmed ? baseOpacity * 0.15 : baseOpacity;

              return (
                <g key={idx} style={{ opacity: finalOpacity, transition: "opacity 0.4s" }}>
                  {/* 墨丝底层（晕染） */}
                  <path
                    d={`M ${fromX} ${fromY} Q ${cpx} ${cpy} ${toX} ${toY}`}
                    stroke={`url(#${strokeId})`}
                    strokeWidth={lit ? 3.5 : 2 + e.style.strength * 2}
                    fill="none"
                    filter={blur}
                    strokeLinecap="round"
                  />
                  {/* 中心暗化时不显示溯光 */}
                </g>
              );
            })}
          </g>

          {/* 节点 */}
          <g>
            {/* 中心节点（核心） */}
            {center && centerPos && (
              <CoreNode
                cx={centerPos.x}
                cy={centerPos.y}
                title={articleTitle || center.title}
                lit={isNodeLit(center.id)}
                dimmed={isDimmed(center.id)}
                onClick={(e) => { e.stopPropagation(); setSelectedId(center.id); }}
              />
            )}

            {/* 周围节点 */}
            {nodes.map(n => {
              const p = positions.get(n.id);
              if (!p) return null;
              const lit = isNodeLit(n.id);
              const dimmed = isDimmed(n.id);
              const isNei = isNeighbor(n.id);
              const isHov = hoveredId === n.id;

              return (
                <g key={n.id} style={{
                  opacity: dimmed ? 0.25 : 1,
                  transition: "opacity 0.4s",
                }}>
                  {n.type === "concept" ? (
                    <ConceptNode
                      cx={p.x} cy={p.y}
                      title={n.title}
                      lit={lit} hovered={isHov} neighbor={isNei}
                      onClick={(e) => { e.stopPropagation(); setSelectedId(n.id); }}
                      onHover={(h) => setHoveredId(h ? n.id : null)}
                    />
                  ) : (
                    <ContentNode
                      cx={p.x} cy={p.y}
                      title={n.title}
                      lit={lit} hovered={isHov} neighbor={isNei}
                      onClick={(e) => { e.stopPropagation(); setSelectedId(n.id); navigate({ to: "/article/$id", params: { id: n.id } }); }}
                      onHover={(h) => setHoveredId(h ? n.id : null)}
                    />
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* 选中节点的关联文字说明 */}
      {selectedId && (() => {
        const relatedEdges = edges.filter(e =>
          (e.source === selectedId && e.target === (center?.id || articleId)) ||
          (e.target === selectedId && e.source === (center?.id || articleId))
        );
        if (relatedEdges.length === 0) return null;
        return (
          <div className="rounded-xl border border-amber-200/40 bg-paper/60 p-4 text-xs leading-relaxed text-foreground/80">
            <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-widest text-amber-700/70">
              <span>溯 · 光</span>
              <span className="h-px flex-1 bg-amber-200/40" />
            </div>
            {relatedEdges.map((e, i) => (
              <p key={i} className="mt-1 font-serif">
                <span className="mr-1 text-amber-700">·</span>
                <span className="text-foreground/60">[{EDGE_STYLES[e.edgeType as EdgeType]?.label || e.edgeType}]</span>{" "}
                {e.description || "此条目与本文存在关联"}
              </p>
            ))}
          </div>
        );
      })()}
    </div>
  );
}

// ============================================================
// 子组件
// ============================================================
function BackgroundLayers() {
  return (
    <>
      {/* 1. 宣纸纹理底 */}
      <div className="absolute inset-0 bg-[#F5F0E8]" />
      {/* 2. 淡墨云雾（径向 + 模糊） */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 30% 20%, rgba(139,115,85,0.18) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(92,74,58,0.15) 0%, transparent 65%), radial-gradient(circle 30% at 50% 50%, rgba(196,58,48,0.04) 0%, transparent 70%)",
          filter: "blur(8px)",
        }}
      />
      {/* 3. 宣纸纹（极细颗粒 SVG noise） */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
        <filter id="paper-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.25  0 0 0 0 0.2  0 0 0 0.7 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#paper-grain)" />
      </svg>
    </>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}

// 核心节点：墨团 + 印章 + 铜金光晕
function CoreNode({ cx, cy, title, lit, dimmed, onClick }: {
  cx: number; cy: number; title: string; lit: boolean; dimmed: boolean; onClick: (e: React.MouseEvent) => void;
}) {
  const r = 38;
  return (
    <g
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      {/* 铜金外光晕（仅溯光激活时） */}
      {lit && (
        <circle cx={cx} cy={cy} r={r + 30} fill="url(#light-glow)" />
      )}
      {/* 墨团 */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="url(#ink-core)"
        filter="url(#ink-rough)"
        style={{ opacity: dimmed ? 0.3 : 1 }}
      />
      {/* 印章边框 */}
      <rect
        x={cx - 22} y={cy - 22} width="44" height="44"
        fill="none"
        stroke={lit ? "#B8860B" : "#C43A30"}
        strokeWidth={lit ? 1.5 : 1}
        strokeOpacity={dimmed ? 0.3 : 0.7}
        filter="url(#ink-rough)"
        transform={`rotate(0 ${cx} ${cy})`}
      />
      {/* 中心字符（核心） */}
      <text
        x={cx} y={cy + 5}
        textAnchor="middle"
        fontFamily="'Noto Serif SC', 'STKaiti', serif"
        fontSize="20" fontWeight="900"
        fill="#F5F0E8"
        style={{ opacity: dimmed ? 0.3 : 1, pointerEvents: "none" }}
      >
        核
      </text>
      {/* 标题 */}
      <text
        x={cx} y={cy + r + 18}
        textAnchor="middle"
        fontFamily="'Noto Serif SC', serif"
        fontSize="13" fontWeight="600"
        fill="#2C2C2C"
        style={{ opacity: dimmed ? 0.3 : 1, pointerEvents: "none" }}
      >
        {title.length > 8 ? title.slice(0, 7) + "…" : title}
      </text>
    </g>
  );
}

// 内容节点：半透明小墨点
function ContentNode({ cx, cy, title, lit, hovered, neighbor, onClick, onHover }: {
  cx: number; cy: number; title: string;
  lit: boolean; hovered: boolean; neighbor: boolean;
  onClick: (e: React.MouseEvent) => void;
  onHover: (h: boolean) => void;
}) {
  const baseR = 12;
  const r = hovered ? baseR + 4 : (neighbor || lit) ? baseR + 2 : baseR;
  const opacity = hovered ? 0.95 : (neighbor || lit) ? 0.7 : 0.35;
  return (
    <g
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{ cursor: "pointer", transition: "all 0.3s" }}
    >
      <circle
        cx={cx} cy={cy} r={r}
        fill="url(#ink-content)"
        opacity={opacity}
      />
      {/* 文字标签：仅在 hover/neighbor/lit 时显示 */}
      {(hovered || neighbor || lit) && (
        <g>
          <rect
            x={cx - 36} y={cy + r + 4} width="72" height="20" rx="3"
            fill="#F5F0E8" stroke="#C43A30" strokeWidth="0.5" strokeOpacity="0.4"
          />
          <text
            x={cx} y={cy + r + 17}
            textAnchor="middle"
            fontFamily="'Noto Serif SC', serif"
            fontSize="10" fontWeight="500"
            fill="#2C2C2C"
            style={{ pointerEvents: "none" }}
          >
            {title.length > 8 ? title.slice(0, 7) + "…" : title}
          </text>
        </g>
      )}
    </g>
  );
}

// 概念节点：雾状不规则墨影
function ConceptNode({ cx, cy, title, lit, hovered, neighbor, onClick, onHover }: {
  cx: number; cy: number; title: string;
  lit: boolean; hovered: boolean; neighbor: boolean;
  onClick: (e: React.MouseEvent) => void;
  onHover: (h: boolean) => void;
}) {
  const baseR = 22;
  const r = hovered ? baseR + 6 : (neighbor || lit) ? baseR + 4 : baseR;
  const opacity = hovered ? 0.85 : (neighbor || lit) ? 0.6 : 0.3;
  return (
    <g
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{ cursor: "pointer", transition: "all 0.4s" }}
    >
      <circle
        cx={cx} cy={cy} r={r}
        fill="url(#ink-concept)"
        filter="url(#ink-mist)"
        opacity={opacity}
      />
      {/* 概念节点不规则形（叠加） */}
      <ellipse
        cx={cx} cy={cy} rx={r * 0.7} ry={r * 0.5}
        fill="url(#ink-concept)"
        filter="url(#ink-mist)"
        opacity={opacity * 0.7}
        transform={`rotate(${lit ? "30" : "0"} ${cx} ${cy})`}
      />
      {/* 文字标签 */}
      {(hovered || neighbor || lit) && (
        <text
          x={cx} y={cy + r + 14}
          textAnchor="middle"
          fontFamily="'Noto Serif SC', serif"
          fontSize="10" fontStyle="italic"
          fill="#5C4A3A"
          style={{ pointerEvents: "none", opacity: 0.85 }}
        >
          {title}
        </text>
      )}
    </g>
  );
}
