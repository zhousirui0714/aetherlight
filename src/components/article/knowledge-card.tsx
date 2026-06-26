import { Link } from "@tanstack/react-router";
import { ArrowUpRight, BookOpen, ExternalLink } from "lucide-react";
import type { RelatedItem } from "@/lib/knowledge-types";
import { CATEGORY_CN } from "@/lib/knowledge-types";

interface KnowledgeCardProps {
  item: RelatedItem;
  accent?: string;
}

/**
 * 关联条目卡片 — 用于人物关系、相似作品、相关建筑等
 */
export function KnowledgeCard({ item, accent = "var(--color-cinnabar)" }: KnowledgeCardProps) {
  const categoryLabel = item.category
    ? CATEGORY_CN[item.category as keyof typeof CATEGORY_CN] || item.category
    : undefined;

  const inner = (
    <div
      className="group relative h-full overflow-hidden rounded-xl border border-border bg-card p-3.5 transition-all hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-md"
    >
      {/* 顶部：分类小章 */}
      {categoryLabel && (
        <div className="mb-2 flex items-center gap-1.5">
          <span
            className="rounded-sm px-1.5 py-0.5 font-serif text-[9px] tracking-widest text-white"
            style={{ background: accent }}
          >
            {categoryLabel}
          </span>
          {item.external && <ExternalLink className="h-3 w-3 text-muted-foreground/60" />}
        </div>
      )}
      {/* 标题 */}
      <h4 className="font-serif text-sm font-semibold leading-snug text-foreground group-hover:text-foreground">
        {item.title}
      </h4>
      {/* 简介 */}
      {item.brief && (
        <p className="mt-1.5 line-clamp-2 font-serif text-xs leading-relaxed text-foreground/65">
          {item.brief}
        </p>
      )}
      {/* 角上箭头 */}
      <ArrowUpRight
        className="absolute right-2 top-2 h-3.5 w-3.5 text-muted-foreground/40 transition-all group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      />
    </div>
  );

  if (item.external && item.externalUrl) {
    return (
      <a
        href={item.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {inner}
      </a>
    );
  }
  return (
    <Link
      to="/article/$id"
      params={{ id: item.id }}
      className="block"
    >
      {inner}
    </Link>
  );
}

/**
 * 关联条目网格 (3 列)
 */
interface RelatedItemsBlockProps {
  items: RelatedItem[];
  title?: string;
  accent?: string;
  icon?: React.ReactNode;
  watermark?: string;
  emptyHint?: string;
}

import { SectionHeading } from "./section-heading";
import { Network } from "lucide-react";

export function RelatedItemsBlock({
  items,
  title = "关联条目",
  accent = "var(--color-cinnabar)",
  icon = <Network className="h-3.5 w-3.5" />,
  watermark = "联",
  emptyHint = "暂无关联条目",
}: RelatedItemsBlockProps) {
  if (!items || items.length === 0) {
    return (
      <section className="mb-8">
        <SectionHeading icon={Network} title={title} watermark={watermark} accent={accent} />
        <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-8 text-center text-sm text-muted-foreground">
          {emptyHint}
        </div>
      </section>
    );
  }
  return (
    <section className="mb-8">
      <SectionHeading
        icon={Network}
        title={title}
        watermark={watermark}
        accent={accent}
        trailing={
          <span className="font-serif text-[10px] tracking-widest text-muted-foreground">
            共 {items.length} 条
          </span>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {items.map((item, i) => (
          <KnowledgeCard key={i} item={item} accent={accent} />
        ))}
      </div>
    </section>
  );
}
