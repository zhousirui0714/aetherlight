import { Link } from "@tanstack/react-router";
import { ExternalLink, ArrowRight, BookOpen, User, Calendar, Scroll, Sparkles, Library } from "lucide-react";

/**
 * 关联条目类型（与 DB JSONB 同构）
 */
export type RelatedItem = {
  id: string;
  title: string;
  category?: string;
  brief?: string;
  external?: boolean;
  externalUrl?: string;
};

/**
 * 解析 id：如果是 UUID 形式，认为是站内；否则尝试识别
 */
function isLikelyInternalId(id: string): boolean {
  // UUID v4 形式: 8-4-4-4-12 hex
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

type RelatedCardProps = {
  item: RelatedItem;
  variant?: "default" | "compact";
};

/**
 * 单个关联条目卡片：站内/外链自适应
 */
export function RelatedCard({ item, variant = "default" }: RelatedCardProps) {
  const isExternal = item.external === true || (item.externalUrl && !isLikelyInternalId(item.id));

  if (isExternal && item.externalUrl) {
    return (
      <a
        href={item.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`group block rounded-xl border border-border bg-card p-4 transition hover:border-accent/40 hover:bg-accent/5 ${
          variant === "compact" ? "p-3" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-serif text-base font-semibold text-foreground group-hover:text-accent line-clamp-2">
            {item.title}
          </h4>
          <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-accent" />
        </div>
        {item.brief && (
          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{item.brief}</p>
        )}
        {item.category && (
          <span className="mt-2 inline-block rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
            {item.category}
          </span>
        )}
      </a>
    );
  }

  // 站内
  return (
    <Link
      to="/article/$id"
      params={{ id: item.id }}
      className={`group block rounded-xl border border-border bg-card p-4 transition hover:border-accent/40 hover:bg-accent/5 ${
        variant === "compact" ? "p-3" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-serif text-base font-semibold text-foreground group-hover:text-accent line-clamp-2">
          {item.title}
        </h4>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-accent transition group-hover:translate-x-0.5" />
      </div>
      {item.brief && (
        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{item.brief}</p>
      )}
      {item.category && (
        <span className="mt-2 inline-block rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
          {item.category}
        </span>
      )}
    </Link>
  );
}

type RelatedSectionProps = {
  title: string;
  icon?: "person" | "book" | "event" | "poem" | "article" | "default";
  items: RelatedItem[];
  emptyHint?: string;
};

const ICON_MAP = {
  person: User,
  book: BookOpen,
  event: Calendar,
  poem: Scroll,
  article: Library,
  default: Sparkles,
};

/**
 * 关联条目分组区块
 */
export function RelatedSection({ title, icon = "default", items, emptyHint }: RelatedSectionProps) {
  if (!items || items.length === 0) {
    if (emptyHint) {
      return (
        <section className="my-6">
          <h3 className="mb-3 font-serif text-lg font-semibold text-foreground/90">{title}</h3>
          <p className="text-sm text-muted-foreground italic">{emptyHint}</p>
        </section>
      );
    }
    return null;
  }

  const Icon = ICON_MAP[icon];

  return (
    <section className="my-8">
      <h3 className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold text-foreground/90">
        <Icon className="h-5 w-5 text-accent" />
        {title}
        <span className="ml-2 text-xs font-normal text-muted-foreground">({items.length})</span>
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, idx) => (
          <RelatedCard key={`${item.id}-${idx}`} item={item} />
        ))}
      </div>
    </section>
  );
}
