import { useState, useMemo } from "react";
import { BookOpen, User, Lightbulb, Scroll, Calendar, Search, Filter, X } from "lucide-react";
import { KnowledgeGraphNode } from "@/lib/cultural-knowledge";

interface KnowledgeGraphProps {
  nodes: KnowledgeGraphNode[];
  onNodeClick: (node: KnowledgeGraphNode) => void;
  selectedNodeId?: string;
}

const nodeIcons: Record<string, typeof BookOpen> = {
  book: BookOpen,
  person: User,
  concept: Lightbulb,
  quote: Scroll,
  event: Calendar,
};

const nodeColors: Record<string, string> = {
  book: "bg-amber-500",
  person: "bg-blue-500",
  concept: "bg-purple-500",
  quote: "bg-green-500",
  event: "bg-rose-500",
};

const nodeTypes = [
  { key: "all", label: "全部" },
  { key: "book", label: "典籍" },
  { key: "person", label: "人物" },
  { key: "concept", label: "概念" },
  { key: "quote", label: "引文" },
  { key: "event", label: "事件" },
];

export function KnowledgeGraph({ nodes, onNodeClick, selectedNodeId }: KnowledgeGraphProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [isExpanded, setIsExpanded] = useState(false);

  // 过滤节点
  const filteredNodes = useMemo(() => {
    return nodes.filter(node => {
      const matchesSearch = searchQuery === "" || 
        node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (node.description && node.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesType = selectedType === "all" || node.type === selectedType;
      
      return matchesSearch && matchesType;
    });
  }, [nodes, searchQuery, selectedType]);

  // 统计各类型数量
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: nodes.length };
    nodes.forEach(node => {
      counts[node.type] = (counts[node.type] || 0) + 1;
    });
    return counts;
  }, [nodes]);

  // 获取连接信息
  const connections = useMemo(() => {
    const conns: Array<{ from: string; to: string }> = [];
    nodes.forEach(node => {
      if (node.connections) {
        node.connections.forEach(targetId => {
          conns.push({ from: node.id, to: targetId });
        });
      }
    });
    return conns;
  }, [nodes]);

  if (!nodes || nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Lightbulb className="h-10 w-10 text-muted-foreground/30" />
        <p className="mt-3 text-sm text-muted-foreground">暂无相关知识图谱</p>
        <p className="mt-1 text-xs text-muted-foreground/70">提问后将展示关联知识</p>
      </div>
    );
  }

  const displayNodes = isExpanded ? filteredNodes : filteredNodes.slice(0, 5);
  const hasMore = filteredNodes.length > 5;

  return (
    <div className="space-y-4">
      {/* 搜索和筛选 */}
      <div className="space-y-3">
        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索知识节点..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-10 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* 类型筛选 */}
        <div className="flex flex-wrap gap-2">
          {nodeTypes.map(type => (
            <button
              key={type.key}
              onClick={() => setSelectedType(type.key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                selectedType === type.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {type.key !== "all" && (
                <span className={`h-2 w-2 rounded-full ${nodeColors[type.key]}`} />
              )}
              {type.label}
              <span className="ml-0.5 text-xs opacity-60">({typeCounts[type.key] || 0})</span>
            </button>
          ))}
        </div>
      </div>

      {/* 连接线提示 */}
      {connections.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          <span>{connections.length} 个关联关系</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
      )}

      {/* 节点列表 */}
      <div className="space-y-2">
        {displayNodes.map((node) => {
          const Icon = nodeIcons[node.type] || Lightbulb;
          const bgColor = nodeColors[node.type] || "bg-gray-500";
          const isSelected = selectedNodeId === node.id;
          
          return (
            <button
              key={node.id}
              onClick={() => onNodeClick(node)}
              className={`w-full flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                isSelected
                  ? "border-primary/50 bg-primary/5 shadow-sm"
                  : "border-border bg-secondary/30 hover:border-primary/30 hover:bg-secondary/50"
              }`}
            >
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bgColor}/20`}>
                <Icon className={`h-4 w-4 ${bgColor.replace("bg-", "text-")}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-semibold text-foreground line-clamp-1">
                    {node.label}
                  </span>
                  <span className={`rounded-full ${bgColor}/10 px-2 py-0.5 text-[10px] font-serif tracking-wider text-foreground/60`}>
                    {getNodeTypeLabel(node.type)}
                  </span>
                </div>
                {node.description && (
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                    {node.description}
                  </p>
                )}
                {/* 显示连接节点 */}
                {node.connections && node.connections.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {node.connections.slice(0, 3).map(connId => {
                      const connNode = nodes.find(n => n.id === connId);
                      if (!connNode) return null;
                      return (
                        <span
                          key={connId}
                          className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary"
                        >
                          → {connNode.label}
                        </span>
                      );
                    })}
                    {node.connections.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{node.connections.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 展开/收起按钮 */}
      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full rounded-lg border border-border bg-secondary/30 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition"
        >
          {isExpanded ? (
            <>收起 <X className="ml-1 inline h-3 w-3" /></>
          ) : (
            <>查看更多 ({filteredNodes.length - 5} 条)</>
          )}
        </button>
      )}

      {/* 搜索结果提示 */}
      {searchQuery && filteredNodes.length === 0 && (
        <div className="py-4 text-center text-sm text-muted-foreground">
          未找到匹配的节点
        </div>
      )}
    </div>
  );
}

function getNodeTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    book: "典籍",
    person: "人物",
    concept: "概念",
    quote: "引文",
    event: "事件",
  };
  return labels[type] || type;
}
