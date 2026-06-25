import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Network, Info, X, Clock, Compass, ArrowLeft } from "lucide-react";
import { knowledgeApi } from "@/lib/knowledge-api";
import type { KnowledgeGraph, GraphNode, GraphEdge } from "@/lib/knowledge-types";
import { computeImportance } from "@/lib/graph-centrality";

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
  year: number;         // 估算公元年（用于时间滑块）
}

interface ProcessedEdge extends GraphEdge {
  edgeType: EdgeType;
  style: EdgeStyle;
}

// ============================================================
// 朝代推断（标题/描述 → 公元年）
// ============================================================
const DYNASTY_RANGES: { name: string; start: number; end: number; aliases: string[] }[] = [
  { name: "上古",  start: -3000, end: -1600, aliases: ["上古", "远古", "三皇", "五帝"] },
  { name: "夏",    start: -2070, end: -1600, aliases: ["夏"] },
  { name: "商",    start: -1600, end: -1046, aliases: ["商", "殷"] },
  { name: "周",    start: -1046, end: -256,  aliases: ["西周", "东周", "春秋", "战国"] },
  { name: "秦",    start: -221,  end: -206,  aliases: ["秦"] },
  { name: "汉",    start: -202,  end: 220,   aliases: ["西汉", "东汉", "汉"] },
  { name: "三国",  start: 220,   end: 280,   aliases: ["三国", "魏晋"] },
  { name: "晋",    start: 265,   end: 420,   aliases: ["西晋", "东晋", "晋"] },
  { name: "南北朝", start: 420,  end: 589,   aliases: ["南北朝", "南朝", "北朝"] },
  { name: "隋",    start: 581,   end: 618,   aliases: ["隋"] },
  { name: "唐",    start: 618,   end: 907,   aliases: ["唐", "盛唐", "中唐", "晚唐"] },
  { name: "五代",  start: 907,   end: 960,   aliases: ["五代", "十国"] },
  { name: "宋",    start: 960,   end: 1279,  aliases: ["北宋", "南宋", "宋"] },
  { name: "元",    start: 1271,  end: 1368,  aliases: ["元"] },
  { name: "明",    start: 1368,  end: 1644,  aliases: ["明"] },
  { name: "清",    start: 1644,  end: 1912,  aliases: ["清"] },
  { name: "近代",  start: 1840,  end: 1949,  aliases: ["近代", "民国"] },
  { name: "现代",  start: 1949,  end: 2100,  aliases: ["现代", "当代", "共和国"] },
];

// 时代兜底：category 推断
const CATEGORY_DEFAULT_YEAR: Record<string, number> = {
  figures: 1000, classics: 0, poems: 800, festivals: 0,
  solarTerms: 0, intangible: 1500, artifacts: 0, lifestyle: 0,
  technology: 1500, architecture: 0, mythology: -2000, art: 1000,
  philosophy: -500, medicine: 1000, food: 0, clothing: 0,
};

function inferYear(node: GraphNode, fallback?: number): number {
  const text = `${node.title || ""} ${node.excerpt || ""}`.slice(0, 60);
  // 1. 优先匹配朝代名
  for (const d of DYNASTY_RANGES) {
    for (const alias of d.aliases) {
      if (text.includes(alias)) {
        // 取朝代中点
        return Math.round((d.start + d.end) / 2);
      }
    }
  }
  // 2. 匹配四字年份（如"公元前 300 年"、"贞观三年"）
  const m = text.match(/(-?\d{2,4})\s*年/);
  if (m) {
    let y = parseInt(m[1], 10);
    if (text.includes("公元前") || text.includes("BC")) y = -y;
    return y;
  }
  // 3. 兜底按 category
  if (node.category && CATEGORY_DEFAULT_YEAR[node.category] !== undefined) {
    return CATEGORY_DEFAULT_YEAR[node.category];
  }
  return fallback ?? 1000;
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
  // 中心节点年份作为兜底
  const centerYear = inferYear(center);

  // 计算图中心性（degree / weighted / betweenness 综合）
  // 在邻居图上算，反映"在当前关系网中的重要性"
  const importance = computeImportance(graph.nodes, graph.edges);

  const processedNodes: ProcessedNode[] = graph.nodes
    .filter(n => n.id !== articleId)
    .map(n => {
      const type = classifyNode(n, false);
      const baseStrength = type === "core" ? 1.0 : type === "content" ? 0.7 : 0.4;
      // 中心性 0-1 归一化后，混 30% 进去（不破坏节点类型基础权重）
      const centralityScore = importance.get(n.id) || 0;
      const strength = Math.min(1.0, baseStrength * 0.7 + centralityScore * 0.3);
      return {
        ...n,
        type,
        year: inferYear(n, centerYear),
        strength,
        // 把 importance 暂存到节点的 centrality 字段（如果类型允许）
        ...({ centrality: centralityScore } as any),
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

  // 时间维度状态：[起始年, 结束年]；-3000 ~ 2100
  const TIME_MIN = -3000;
  const TIME_MAX = 2100;
  const [timeRange, setTimeRange] = useState<[number, number]>([TIME_MIN, TIME_MAX]);

  // 关系类型筛选（默认全选）
  const [edgeTypeFilter, setEdgeTypeFilter] = useState<Set<EdgeType>>(
    new Set(["temporal", "influence", "cultural", "imagery"])
  );
  const toggleEdgeType = (t: EdgeType) => {
    setEdgeTypeFilter((prev) => {
      const next = new Set(prev);
      if (next.has(t)) {
        // 至少保留 1 个
        if (next.size > 1) next.delete(t);
      } else {
        next.add(t);
      }
      return next;
    });
  };

  // 钻取状态：当前图谱中心 id + 历史栈
  const [centerId, setCenterId] = useState<string>(articleId);
  const [centerTitle, setCenterTitle] = useState<string>(articleTitle || "");
  const [history, setHistory] = useState<{ id: string; title: string }[]>([]);
  const [drillingLoading, setDrillingLoading] = useState(false);

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
    setDrillingLoading(true);
    knowledgeApi.getRelations(centerId)
      .then(data => {
        if (alive) {
          setGraph(data);
          // 中心 title 兜底
          if (data?.center?.title) {
            setCenterTitle(data.center.title);
          }
        }
      })
      .catch(err => { if (alive) setError(err?.message || "图谱加载失败"); })
      .finally(() => { if (alive) { setLoading(false); setDrillingLoading(false); } });
    return () => { alive = false; };
  }, [centerId]);

  // 外部 articleId 变化时, 重置中心与历史
  useEffect(() => {
    setCenterId(articleId);
    setCenterTitle(articleTitle || "");
    setHistory([]);
    setSelectedId(null);
  }, [articleId, articleTitle]);

  // 钻取：以某节点为新中心
  const drillInto = useCallback(async (nodeId: string, nodeTitle: string) => {
    if (nodeId === centerId) return;
    setHistory((h) => [...h, { id: centerId, title: centerTitle }]);
    setCenterId(nodeId);
    setCenterTitle(nodeTitle);
    setSelectedId(null);
  }, [centerId, centerTitle]);

  // 返回上一级
  const goBack = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setCenterId(prev.id);
      setCenterTitle(prev.title);
      return h.slice(0, -1);
    });
    setSelectedId(null);
  }, []);

  // 返回文章原中心
  const goRoot = useCallback(() => {
    setHistory([]);
    setCenterId(articleId);
    setCenterTitle(articleTitle || "");
    setSelectedId(null);
  }, [articleId, articleTitle]);

  // 数据预处理 + 布局（应用时间过滤）
  const { nodes, edges, center, positions, centerPos, allNodeIds, timeStats } = useMemo(() => {
    if (!graph) return { nodes: [], edges: [], center: null, positions: new Map(), centerPos: { x: 0, y: 0 }, allNodeIds: new Set(), timeStats: null };
    const p = preprocessGraph(graph, centerId);
    // 时间窗内的节点
    const [t0, t1] = timeRange;
    const visibleNodes = p.nodes.filter(n => n.year >= t0 && n.year <= t1);
    const visibleIds = new Set(visibleNodes.map(n => n.id));
    // 边：任一端点可见即显示（更宽容，让"消失"的节点仍能从中心出连边）
    const visibleEdges = p.edges.filter(e =>
      visibleIds.has(e.source) || visibleIds.has(e.target)
    );
    const positions = layoutNodes(visibleNodes, visibleEdges, p.center?.id || centerId, centerId, size.w, size.h);
    const centerPos = positions.get(p.center?.id || centerId) || { x: size.w / 2, y: size.h / 2 };
    const allNodeIds = new Set<string>([p.center?.id || centerId, ...visibleNodes.map(n => n.id)]);
    // 时间统计
    const allYears = p.nodes.map(n => n.year).concat([inferYear(p.center || { id: centerId, title: "" })]);
    const timeStats = {
      min: Math.min(...allYears),
      max: Math.max(...allYears),
      total: p.nodes.length,
      visible: visibleNodes.length,
    };
    return { nodes: visibleNodes, edges: visibleEdges, center: p.center, positions, centerPos, allNodeIds, timeStats };
  }, [graph, centerId, size, timeRange, edgeTypeFilter]);

  // 当 timeRange 改变, 关闭溯光选中（避免暗化所有）
  useEffect(() => {
    setSelectedId(null);
  }, [timeRange]);

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
      {/* 标题 + 概览 + 钻取导航 */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-secondary/30 px-4 py-2.5 text-xs">
        <Network className="h-4 w-4 text-primary" />
        <span className="text-foreground">
          关联节点 <b className="text-primary">{nodes.length}</b> 个
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="text-foreground">
          关系 <b className="text-primary">{edges.length}</b> 条
        </span>

        {/* 钻取历史面包屑 */}
        {history.length > 0 && (
          <span className="ml-2 flex items-center gap-1 text-[10px] text-amber-900/60">
            <Compass className="h-3 w-3" />
            {history.slice(-3).map((h, i) => (
              <span key={h.id} className="font-serif">
                {i > 0 && <span className="mx-1 text-amber-900/40">›</span>}
                <button
                  onClick={() => {
                    // 跳回到此节点
                    const idx = history.findIndex(x => x.id === h.id);
                    if (idx >= 0) {
                      setHistory((cur) => cur.slice(0, idx));
                      setCenterId(h.id);
                      setCenterTitle(h.title);
                      setSelectedId(null);
                    }
                  }}
                  className="hover:text-amber-900 hover:underline"
                >
                  {h.title.length > 6 ? h.title.slice(0, 5) + "…" : h.title}
                </button>
              </span>
            ))}
            <span className="mx-1 text-amber-900/40">›</span>
            <span className="font-serif text-amber-900">{centerTitle.length > 6 ? centerTitle.slice(0, 5) + "…" : centerTitle}</span>
          </span>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          {/* 返回上一级 */}
          {history.length > 0 && (
            <button
              onClick={goBack}
              className="flex items-center gap-1 rounded border border-amber-200/60 bg-amber-50/60 px-2 py-0.5 text-[10px] text-amber-900/80 transition hover:bg-amber-100/60"
              title="返回上一级"
            >
              <ArrowLeft className="h-3 w-3" /> 上级
            </button>
          )}
          {/* 返回文章原中心 */}
          {centerId !== articleId && (
            <button
              onClick={goRoot}
              className="rounded border border-amber-200/60 bg-amber-50/60 px-2 py-0.5 text-[10px] text-amber-900/80 transition hover:bg-amber-100/60"
              title="返回文章原图谱"
            >
              回原图
            </button>
          )}
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Info className="h-3 w-3" /> 单击溯光 · 双击钻取
          </span>
        </div>
      </div>

      {/* 时间维度滑块 */}
      {timeStats && timeStats.max - timeStats.min > 0 && (
        <TimeSlider
          value={timeRange}
          min={TIME_MIN}
          max={TIME_MAX}
          dataMin={timeStats.min}
          dataMax={timeStats.max}
          visibleCount={timeStats.visible}
          totalCount={timeStats.total}
          onChange={setTimeRange}
        />
      )}

      {/* SVG 宇宙 */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-200/30 bg-[#F5F0E8]"
           style={{ aspectRatio: `${size.w} / ${size.h}` }}>
        {/* 3 层背景：宣纸 + 云雾 + 留白 */}
        <BackgroundLayers />

        {/* 钻取加载遮罩 */}
        {drillingLoading && !loading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#F5F0E8]/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2 rounded-lg border border-amber-200/50 bg-[#FAF6EC]/95 px-6 py-4 shadow-sm">
              <Loader2 className="h-5 w-5 animate-spin text-accent" />
              <p className="font-serif text-xs tracking-widest text-amber-900/80">钻取子宇宙…</p>
            </div>
          </div>
        )}

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

        {/* 图例：节点类型 */}
        <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-1.5 text-[10px] text-amber-900/70">
          <div className="flex flex-wrap gap-2">
            <LegendDot color="#2C2C2C" label="核心" />
            <LegendDot color="#5C4A3A" label="内容" />
            <LegendDot color="#8B7355" label="概念" />
          </div>
          {/* 关系类型筛选（可点击） */}
          <div className="flex flex-wrap gap-1.5">
            <span className="self-center text-[9px] uppercase tracking-widest text-amber-900/50">关系</span>
            {(["temporal", "influence", "cultural", "imagery"] as EdgeType[]).map((t) => {
              const s = EDGE_STYLES[t];
              const active = edgeTypeFilter.has(t);
              return (
                <button
                  key={t}
                  onClick={(e) => { e.stopPropagation(); toggleEdgeType(t); }}
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 transition ${
                    active
                      ? "bg-amber-100/80 text-amber-900 ring-1 ring-amber-300/60"
                      : "bg-paper/40 text-amber-900/40 line-through"
                  }`}
                  title={active ? `隐藏「${s.label}」关系` : `显示「${s.label}」关系`}
                >
                  <span
                    className="h-1.5 w-3 rounded-full"
                    style={{ backgroundColor: s.color, opacity: active ? s.opacity : 0.3 }}
                  />
                  {s.label}
                </button>
              );
            })}
          </div>
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
                title={centerTitle || center.title}
                lit={isNodeLit(center.id)}
                dimmed={isDimmed(center.id)}
                isRoot={centerId === articleId}
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
              // 节点 size 反映中心性：strength 0-1 → 0.85-1.25 缩放
              const sizeScale = 0.85 + (n.strength || 0.5) * 0.4;

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
                      sizeScale={sizeScale}
                      onClick={(e) => { e.stopPropagation(); setSelectedId(n.id); }}
                      onDoubleClick={(e) => { e.stopPropagation(); drillInto(n.id, n.title); }}
                      onHover={(h) => setHoveredId(h ? n.id : null)}
                    />
                  ) : (
                    <ContentNode
                      cx={p.x} cy={p.y}
                      title={n.title}
                      lit={lit} hovered={isHov} neighbor={isNei}
                      sizeScale={sizeScale}
                      onClick={(e) => { e.stopPropagation(); setSelectedId(n.id); }}
                      onDoubleClick={(e) => { e.stopPropagation(); drillInto(n.id, n.title); }}
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
          (e.source === selectedId && e.target === (center?.id || centerId)) ||
          (e.target === selectedId && e.source === (center?.id || centerId))
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

// ============================================================
// 时间维度滑块（双滑块 + 朝代 tick）
// ============================================================
function TimeSlider({
  value,
  min,
  max,
  dataMin,
  dataMax,
  visibleCount,
  totalCount,
  onChange,
}: {
  value: [number, number];
  min: number;
  max: number;
  dataMin: number;
  dataMax: number;
  visibleCount: number;
  totalCount: number;
  onChange: (v: [number, number]) => void;
}) {
  const [t0, t1] = value;
  const span = max - min;
  const t0Pct = ((t0 - min) / span) * 100;
  const t1Pct = ((t1 - min) / span) * 100;
  const dataMinPct = ((dataMin - min) / span) * 100;
  const dataMaxPct = ((dataMax - min) / span) * 100;

  // 找出当前选区覆盖的朝代
  const coveredDynasties = DYNASTY_RANGES.filter(
    d => d.end >= t0 && d.start <= t1
  );

  const yearLabel = (y: number) => {
    if (y < 0) return `公元前${-y}`;
    return `公元${y}`;
  };

  return (
    <div className="rounded-lg border border-amber-200/40 bg-[#FAF6EC]/80 px-4 py-3">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-amber-900/80">
        <Clock className="h-3.5 w-3.5 text-accent" />
        <span className="font-serif tracking-widest">时间维度</span>
        <span className="text-amber-900/50">·</span>
        <span>
          {yearLabel(t0)} — {yearLabel(t1)}
        </span>
        <span className="ml-auto text-[10px] tracking-widest text-amber-900/60">
          可见 {visibleCount} / {totalCount} 节点
        </span>
        {(t0 !== min || t1 !== max) && (
          <button
            onClick={() => onChange([min, max])}
            className="rounded border border-amber-200/60 bg-amber-50/60 px-2 py-0.5 text-[10px] text-amber-900/70 hover:bg-amber-100/60 transition"
          >
            重置
          </button>
        )}
      </div>

      {/* 双滑块轨道 */}
      <div className="relative h-7 select-none">
        {/* 底轨 */}
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-amber-200/40" />
        {/* 数据范围高亮 */}
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-amber-300/30"
          style={{ left: `${dataMinPct}%`, width: `${dataMaxPct - dataMinPct}%` }}
        />
        {/* 选中范围 */}
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-amber-700/60 via-amber-600/70 to-amber-700/60"
          style={{ left: `${t0Pct}%`, width: `${t1Pct - t0Pct}%` }}
        />
        {/* 起点滑块 */}
        <input
          type="range"
          min={min}
          max={max}
          step={10}
          value={t0}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            onChange([Math.min(v, t1 - 50), t1]);
          }}
          className="time-range-input pointer-events-auto absolute inset-0 h-full w-full appearance-none bg-transparent"
          style={{ zIndex: t0 > max - 50 ? 5 : 4 }}
        />
        {/* 终点滑块 */}
        <input
          type="range"
          min={min}
          max={max}
          step={10}
          value={t1}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            onChange([t0, Math.max(v, t0 + 50)]);
          }}
          className="time-range-input pointer-events-auto absolute inset-0 h-full w-full appearance-none bg-transparent"
          style={{ zIndex: 5 }}
        />
      </div>

      {/* 朝代 tick 行 */}
      <div className="mt-2 flex flex-wrap items-center gap-1 text-[9px] text-amber-900/60">
        {coveredDynasties.length === 0 ? (
          <span className="italic">当前选区无朝代覆盖</span>
        ) : (
          coveredDynasties.map((d) => {
            const isActive = d.end >= t0 && d.start <= t1;
            return (
              <span
                key={d.name}
                className={`rounded px-1.5 py-0.5 transition ${
                  isActive
                    ? "bg-amber-700/15 font-serif text-amber-900"
                    : "bg-transparent text-amber-900/40"
                }`}
              >
                {d.name}
              </span>
            );
          })
        )}
      </div>
    </div>
  );
}

// 核心节点：墨团 + 印章 + 铜金光晕
function CoreNode({ cx, cy, title, lit, dimmed, isRoot, onClick }: {
  cx: number; cy: number; title: string; lit: boolean; dimmed: boolean; isRoot: boolean; onClick: (e: React.MouseEvent) => void;
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
      {/* 中心字符（核心/根） */}
      <text
        x={cx} y={cy + 5}
        textAnchor="middle"
        fontFamily="'Noto Serif SC', 'STKaiti', serif"
        fontSize="20" fontWeight="900"
        fill="#F5F0E8"
        style={{ opacity: dimmed ? 0.3 : 1, pointerEvents: "none" }}
      >
        {isRoot ? "核" : "心"}
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
      {/* 钻取指示（非根时显示） */}
      {!isRoot && (
        <g style={{ pointerEvents: "none" }}>
          <text
            x={cx} y={cy - r - 8}
            textAnchor="middle"
            fontFamily="'Noto Serif SC', serif"
            fontSize="9" fontWeight="500"
            letterSpacing="0.2em"
            fill="#B8860B"
            opacity={0.85}
          >
            · 子宇宙 ·
          </text>
        </g>
      )}
    </g>
  );
}

// 内容节点：半透明小墨点
function ContentNode({ cx, cy, title, lit, dimmed, hovered, neighbor, onClick, onDoubleClick, onHover, sizeScale = 1 }: {
  cx: number; cy: number; title: string;
  lit: boolean; dimmed: boolean; hovered: boolean; neighbor: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onHover: (h: boolean) => void;
  sizeScale?: number;
}) {
  const baseR = 12;
  const r = hovered ? baseR + 4 : (neighbor || lit) ? baseR + 2 : baseR;
  const finalR = r * sizeScale;
  const opacity = hovered ? 0.95 : (neighbor || lit) ? 0.7 : 0.35;
  return (
    <g
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{ cursor: "pointer", transition: "all 0.3s" }}
    >
      <circle
        cx={cx} cy={cy} r={finalR}
        fill="url(#ink-content)"
        opacity={opacity}
      />
      {/* 文字标签：仅在 hover/neighbor/lit 时显示 */}
      {(hovered || neighbor || lit) && (
        <g>
          <rect
            x={cx - 36} y={cy + finalR + 4} width="72" height="20" rx="3"
            fill="#F5F0E8" stroke="#C43A30" strokeWidth="0.5" strokeOpacity="0.4"
          />
          <text
            x={cx} y={cy + finalR + 17}
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
function ConceptNode({ cx, cy, title, lit, hovered, neighbor, onClick, onDoubleClick, onHover, sizeScale = 1 }: {
  cx: number; cy: number; title: string;
  lit: boolean; hovered: boolean; neighbor: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onHover: (h: boolean) => void;
  sizeScale?: number;
}) {
  const baseR = 22;
  const r = hovered ? baseR + 6 : (neighbor || lit) ? baseR + 4 : baseR;
  const finalR = r * sizeScale;
  const opacity = hovered ? 0.85 : (neighbor || lit) ? 0.6 : 0.3;
  return (
    <g
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{ cursor: "pointer", transition: "all 0.4s" }}
    >
      <circle
        cx={cx} cy={cy} r={finalR}
        fill="url(#ink-concept)"
        filter="url(#ink-mist)"
        opacity={opacity}
      />
      {/* 概念节点不规则形（叠加） */}
      <ellipse
        cx={cx} cy={cy} rx={finalR * 0.7} ry={finalR * 0.5}
        fill="url(#ink-concept)"
        filter="url(#ink-mist)"
        opacity={opacity * 0.7}
        transform={`rotate(${lit ? "30" : "0"} ${cx} ${cy})`}
      />
      {/* 文字标签 */}
      {(hovered || neighbor || lit) && (
        <text
          x={cx} y={cy + finalR + 14}
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
