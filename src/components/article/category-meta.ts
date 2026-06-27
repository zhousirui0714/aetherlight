/**
 * 10 个分类的视觉与文案元数据
 * - 每个分类有独立的 accent color (在统一水墨风范围内)
 * - 不同的印章字 / Hero 装饰语
 * - 决定详情页章节组件的渲染顺序与标题
 */
import type { CategoryKey } from "@/lib/knowledge-types";

export interface CategoryMeta {
  key: CategoryKey | "default";
  label: string;                // 中文标签
  seal: string;                 // 印章字
  accent: string;               // 主色 (HEX)
  accent2: string;              // 次色
  heroHint: string;             // Hero 副标
  description: string;          // 简介
  // 详情页主章节渲染顺序
  sections: string[];
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  figures: {
    key: "figures",
    label: "人物",
    seal: "人",
    accent: "#8B4513",
    accent2: "#D9CDB4",
    heroHint: "以传记之心，识其人、见其世",
    description: "在时间长河中与你相遇的每一位先贤",
    sections: ["portrait", "bio", "timeline", "stories", "relationships", "works", "evaluation", "dialogue", "ai"],
  },
  poems: {
    key: "poems",
    label: "诗词文章",
    seal: "诗",
    accent: "#3C2A1E",
    accent2: "#E8D9B8",
    heroHint: "以诵读之心，穿越千年的字句",
    description: "一字一世界，一句一山河",
    sections: ["original", "pinyin", "translation", "annotation", "background", "famous-lines", "artistic", "influence", "similar", "ai"],
  },
  classics: {
    key: "classics",
    label: "典籍经典",
    seal: "典",
    accent: "#5D2914",
    accent2: "#E0C9A6",
    heroHint: "以导读之心，品先贤之言",
    description: "千载之文，文明之根",
    sections: ["author", "background", "core-idea", "chapters", "original", "commentary", "influence", "schools", "reading-order", "ai"],
  },
  festivals: {
    key: "festivals",
    label: "节日节气",
    seal: "节",
    accent: "#C43A30",
    accent2: "#F5D5A0",
    heroHint: "以体验之心，循四时之序",
    description: "在节令之中，与古人心意相通",
    sections: ["countdown", "date", "origin", "evolution", "customs", "regions", "foods", "poems", "ai"],
  },
  mythology: {
    key: "mythology",
    label: "神话传说",
    seal: "话",
    accent: "#4A2080",
    accent2: "#D4C5E8",
    heroHint: "以故事之心，访神祇之境",
    description: "上古之音，民族之梦",
    sections: ["intro", "plot", "characters", "relationships", "symbolism", "influence", "ai"],
  },
  intangible: {
    key: "intangible",
    label: "非遗艺术",
    seal: "遗",
    accent: "#B8860B",
    accent2: "#E8D8B0",
    heroHint: "以匠心之心，承千年之艺",
    description: "指间流转的，是文明的指纹",
    sections: ["level", "region", "inheritors", "origin", "craft-flow", "features", "gallery", "status", "ai"],
  },
  artifacts: {
    key: "artifacts",
    label: "建筑器物",
    seal: "物",
    accent: "#7A5C3E",
    accent2: "#D9C7A8",
    heroHint: "以空间之心，触摸凝固的历史",
    description: "一砖一瓦，皆是时间的容器",
    sections: ["build-info", "location", "style", "evolution", "structure", "details", "map", "stories", "related-buildings", "ai"],
  },
  lifestyle: {
    key: "lifestyle",
    label: "饮食服饰",
    seal: "俗",
    accent: "#A0522D",
    accent2: "#E8D0B8",
    heroHint: "以烟火之心，品生活之美",
    description: "日用之间，自有诗礼",
    sections: ["origin", "region-era", "craft", "evolution", "symbolism", "regions", "modern", "related-festivals", "ai"],
  },
  philosophy: {
    key: "philosophy",
    label: "思想智慧",
    seal: "道",
    accent: "#2C2C2C",
    accent2: "#D9CDB4",
    heroHint: "以思辨之心，对话古圣先贤",
    description: "千年之思，照见今日之行",
    sections: ["core", "original", "source", "modern", "background", "compare", "applications", "ai"],
  },
  technology: {
    key: "technology",
    label: "古代科技",
    seal: "工",
    accent: "#3E5C7A",
    accent2: "#B8C5D9",
    heroHint: "以探索之心，窥先民之智",
    description: "巧夺天工，泽被古今",
    sections: ["invention-time", "background", "inventor", "principle", "significance", "spread", "world-impact", "modern", "ai"],
  },
  default: {
    key: "default",
    label: "知识",
    seal: "溯",
    accent: "#5C4A3A",
    accent2: "#D9CDB4",
    heroHint: "以溯源之心，传承中华文明",
    description: "每一个知识点，都是进入文化网络的入口",
    sections: ["overview", "highlights", "ai", "references", "related"],
  },
};

export function getCategoryMeta(category: string | undefined | null): CategoryMeta {
  if (!category) return CATEGORY_META.default;
  return CATEGORY_META[category] || CATEGORY_META.default;
}
