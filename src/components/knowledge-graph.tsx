import { BookOpen, User, Lightbulb, Scroll, Calendar } from "lucide-react";
import { KnowledgeGraphNode } from "@/lib/cultural-knowledge";

interface KnowledgeGraphProps {
  nodes: KnowledgeGraphNode[];
  onNodeClick: (node: KnowledgeGraphNode) => void;
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

export function KnowledgeGraph({ nodes, onNodeClick }: KnowledgeGraphProps) {
  if (!nodes || nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Lightbulb className="h-10 w-10 text-muted-foreground/30" />
        <p className="mt-3 text-sm text-muted-foreground">暂无相关知识图谱</p>
        <p className="mt-1 text-xs text-muted-foreground/70">提问后将展示关联知识</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {nodes.map((node, index) => {
        const Icon = nodeIcons[node.type] || Lightbulb;
        const bgColor = nodeColors[node.type] || "bg-gray-500";
        
        return (
          <button
            key={node.id}
            onClick={() => onNodeClick(node)}
            className="w-full flex items-start gap-3 rounded-xl border border-border bg-secondary/30 p-4 text-left transition hover:border-primary/30 hover:bg-secondary/50"
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
            </div>
          </button>
        );
      })}
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
