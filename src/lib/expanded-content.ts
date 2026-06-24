// 将 generated-content.json 转换为 TypeScript 模块
// 提供按文章 id 索引的扩展内容（content + history + influence）
// 详情页 article.$id.tsx 优先用扩展内容展示

import generated from "./generated-content.json";

export interface ExpandedContent {
  content: string;
  history: string;
  influence: string;
}

export const EXPANDED_CONTENT: Record<string, ExpandedContent> = generated as Record<string, ExpandedContent>;

export function getExpandedContent(id: string): ExpandedContent | null {
  return EXPANDED_CONTENT[id] || null;
}
