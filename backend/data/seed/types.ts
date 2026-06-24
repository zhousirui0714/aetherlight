// 知识条目类型契约 v3
// 与 .trae/documents/knowledge-gallery-v3-contract.md 保持一致
export type CategoryId =
  | "figures" | "poems" | "classics" | "festivals" | "mythology"
  | "intangible" | "artifacts" | "lifestyle" | "philosophy" | "technology";

export interface FAQItem { question: string; answer: string; }
export interface RelatedItem { id: string; title: string; category: CategoryId; type?: "internal" | "external"; url?: string; cover?: string; }

export interface Article {
  id: string;
  title: string;
  category: CategoryId;
  sub_category: string;
  tags: string[];
  excerpt: string;
  body: string;
  full_text?: string;          // 仅 诗词/典籍 使用
  full_text_lang?: "classical" | "modern";
  cover: string;
  cover_url?: string | null;
  source: string;
  author: string;
  dynasty: string;
  era: string;
  region: string;
  history: string;
  influence: string;
  body_extended: string;
  view_count?: number;
  sort_weight?: number;
  created_at?: string;
  related_people: RelatedItem[];
  related_books: RelatedItem[];
  related_events: RelatedItem[];
  related_poems: RelatedItem[];
  related_articles: RelatedItem[];
  faq: FAQItem[];
}
