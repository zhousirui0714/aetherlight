/**
 * 知识长廊 v3 Article 类型
 *
 * 前端使用 camelCase，DB / API 使用 snake_case
 * API 响应在 fetch 后做归一化（snake → camel）后给到 UI
 *
 * v3 升级:
 *   - 10 顶级分类 (英文 key)
 *   - 2 级子类 + 3 级标签
 *   - 全文/翻译/注释
 *   - 知识图谱关联
 *   - 排序权重 + 浏览量
 */

export type CategoryKey =
  | "figures"       // 人物
  | "poems"         // 诗词文章
  | "classics"      // 典籍经典
  | "festivals"     // 节日节气
  | "mythology"     // 神话传说
  | "intangible"    // 非遗艺术
  | "artifacts"     // 建筑器物
  | "lifestyle"     // 饮食服饰
  | "philosophy"    // 思想智慧
  | "technology";   // 古代科技

export const CATEGORY_CN: Record<CategoryKey, string> = {
  figures:    "人物",
  poems:      "诗词文章",
  classics:   "典籍经典",
  festivals:  "节日节气",
  mythology:  "神话传说",
  intangible: "非遗艺术",
  artifacts:  "建筑器物",
  lifestyle:  "饮食服饰",
  philosophy: "思想智慧",
  technology: "古代科技",
};

export const CATEGORY_KEYS: CategoryKey[] = [
  "figures", "poems", "classics", "festivals", "mythology",
  "intangible", "artifacts", "lifestyle", "philosophy", "technology",
];

// 三段式分类: 顶级 → 子类 (前端)
export const CATEGORY_SUB_CATEGORIES: Record<CategoryKey, string[]> = {
  figures:    ["帝王将相", "文人墨客", "思想家", "科学家", "艺术家", "民族英雄"],
  poems:      ["诗经楚辞", "唐诗", "宋词", "元曲", "散文", "赋", "骈文"],
  classics:   ["经部", "史部", "子部", "集部", "蒙学", "医典", "兵法"],
  festivals:  ["传统节日", "节气", "祭祀日", "纪念日"],
  mythology:  ["创世神话", "神仙体系", "民间传说", "志怪故事"],
  intangible: ["传统戏曲", "民间美术", "传统技艺", "民俗节庆", "曲艺杂技"],
  artifacts:  ["宫殿", "园林", "陵墓", "桥梁", "塔寺", "石窟", "器物", "家具"],
  lifestyle:  ["茶文化", "酒文化", "食文化", "丝绸", "服饰", "妆容", "古代家具"],
  philosophy: ["儒家", "道家", "法家", "墨家", "阴阳", "禅宗", "兵家"],
  technology: ["天文历法", "农学", "医学", "数学", "四大发明", "水利", "营造"],
};

// 关联条目（可点击跳转到详情）
export interface RelatedItem {
  id: string;             // 跳转目标 ID
  title: string;          // 显示标题
  category?: string;      // 分类
  brief?: string;         // 一句话简介
  external?: boolean;     // 是否外部链接
  externalUrl?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
  link?: string;
}

export interface Article {
  id: string;
  title: string;
  category: CategoryKey;
  subCategory?: string;            // 2 级子类
  tags?: string[];                 // 3 级标签
  excerpt: string;
  content: string;                 // = body
  bodyExtended?: string;
  favorites: number;
  cover: string;                   // emoji or symbol
  coverUrl?: string;               // 真实图片 URL
  // 元数据
  source?: string;
  history?: string;
  influence?: string;
  author: string;
  dynasty?: string;
  era?: string;
  region?: string;
  // 全文/翻译/注释 (诗词/典籍用)
  fullText?: string | null;
  fullTextLang?: "classical" | "modern";
  translation?: { verseByVerse: { original: string; modern: string }[]; overall: string };
  annotation?: { term: string; meaning: string; source: string }[];
  // 排序/统计
  viewCount?: number;
  sortWeight?: number;
  createdAt?: string;
  // 关联条目
  relatedPeople?: RelatedItem[];
  relatedBooks?: RelatedItem[];
  relatedEvents?: RelatedItem[];
  relatedPoems?: RelatedItem[];
  relatedArticles?: RelatedItem[];
  faq?: FAQItem[];
  // 同分类推荐 (后端填充)
  related?: { id: string; title: string; category: CategoryKey; subCategory?: string }[];
}

// 兼容旧中文 category 名字符串
export const CATEGORY_ALIAS_CN: Record<string, CategoryKey> = {
  "诗词文学": "poems",
  "历史人物": "figures",
  "节日节气": "festivals",
  "传统艺术": "intangible",
  "传统技艺": "intangible",
  "民俗文化": "intangible",
  "经典典籍": "classics",
  "建筑古迹": "artifacts",
  "神话传说": "mythology",
  "人物": "figures",
  "诗词": "poems",
  "典籍": "classics",
  "节日": "festivals",
  "节气": "festivals",
  "非遗": "intangible",
  "民俗": "intangible",
  "建筑": "artifacts",
  "神话": "mythology",
  "艺术": "intangible",
  "哲学": "philosophy",
  "医学": "technology",
  "科技": "technology",
  "饮食": "lifestyle",
  "服饰": "lifestyle",
};

/**
 * 字段归一化: API 响应 (snake_case) → 前端 Article (camelCase)
 */
export function normalizeArticle(raw: any): Article {
  if (!raw) return raw;
  return {
    id: raw.id,
    title: raw.title,
    category: (CATEGORY_ALIAS_CN[raw.category] || raw.category) as CategoryKey,
    subCategory: raw.sub_category || "",
    tags: raw.tags || [],
    excerpt: raw.excerpt || "",
    content: raw.body || raw.content || "",
    bodyExtended: raw.body_extended || raw.body || "",
    favorites: raw.favorites || 0,
    cover: raw.cover || "📜",
    coverUrl: raw.cover_url || undefined,
    source: raw.source || "",
    history: raw.history || "",
    influence: raw.influence || "",
    author: raw.author || "溯光编辑部",
    dynasty: raw.dynasty || "",
    era: raw.era || "",
    region: raw.region || "",
    fullText: raw.full_text || undefined,
    fullTextLang: raw.full_text_lang || "classical",
    viewCount: raw.view_count || 0,
    sortWeight: raw.sort_weight || 0,
    createdAt: raw.created_at || "",
    relatedPeople: raw.related_people || [],
    relatedBooks: raw.related_books || [],
    relatedEvents: raw.related_events || [],
    relatedPoems: raw.related_poems || [],
    relatedArticles: raw.related_articles || [],
    faq: raw.faq || [],
    related: (raw.related || []).map((r: any) => ({
      id: r.id,
      title: r.title,
      category: (CATEGORY_ALIAS_CN[r.category] || r.category) as CategoryKey,
      subCategory: r.sub_category || "",
    })),
  };
}

/**
 * 知识图谱节点
 */
export interface GraphNode {
  id: string;
  title: string;
  category?: string;
  excerpt?: string;
  cover?: string;
  coverUrl?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  weight?: number;
  description?: string;
}

export interface KnowledgeGraph {
  center?: GraphNode;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * 分类树
 */
export interface SubCategoryInfo {
  name: string;
  count: number;
}

export interface CategoryInfo {
  id: CategoryKey;
  name_cn: string;
  total: number;
  sub_categories: SubCategoryInfo[];
}

/**
 * 标签
 */
export interface TagInfo {
  tag: string;
  count: number;
}
