// AI 生成的深度内容类型定义
// 知识图谱、时间线、现代解读、常见问题

// 知识图谱节点
export interface GraphNode {
  id: string;
  label: string;        // 显示文本
  type: "core" | "person" | "book" | "event" | "concept";  // 节点类型
  brief?: string;       // 简短描述
  link?: string;        // 关联的文章 id（可点击）
  // 节点位置（用于渲染图谱）
  x?: number;
  y?: number;
}

// 知识图谱边
export interface GraphEdge {
  source: string;       // 起始节点 id
  target: string;       // 目标节点 id
  label: string;        // 关系描述
}

// 知识图谱
export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// 时间线事件
export interface TimelineEvent {
  year: string;         // 年份或朝代
  title: string;        // 事件标题
  description: string;  // 事件描述
  link?: string;        // 关联文章 id
}

// 现代解读
export interface ModernInterpretation {
  summary: string;          // 一段总结
  applications: string[];   // 现代应用/价值
  perspectives: string[];   // 当代视角
}

// 常见问题
export interface FAQ {
  question: string;
  answer: string;
  link?: string;        // 相关条目链接
}

// AI 生成的综合内容
export interface AIInsights {
  knowledgeGraph: KnowledgeGraph;
  timeline: TimelineEvent[];
  modernInterpretation: ModernInterpretation;
  faq: FAQ[];
}

// AI 生成状态
export type AIStatus = "idle" | "loading" | "ready" | "error" | "cached";
