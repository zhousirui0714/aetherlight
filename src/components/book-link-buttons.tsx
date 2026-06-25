/**
 * 典籍外链按钮组
 *
 * 用于知识库文章页、ancient-books API 响应
 * 跳转到权威第三方平台看原文（零侵权、零爬虫）
 */

import { ExternalLink, BookText, ScrollText } from "lucide-react";

export interface BookLinkButtonsProps {
  shidianguji?: string;
  ctext?: string;
  wikisource?: string;
  title?: string;
  size?: "sm" | "md";
}

export function BookLinkButtons({ shidianguji, ctext, wikisource, title, size = "sm" }: BookLinkButtonsProps) {
  const links: Array<{ url: string; label: string; icon: string; color: string }> = [];
  if (ctext) {
    links.push({
      url: ctext,
      label: "ctext.org",
      icon: "📚",
      color: "bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100",
    });
  }
  if (shidianguji) {
    links.push({
      url: shidianguji,
      label: "识典古籍",
      icon: "📜",
      color: "bg-rose-50 border-rose-200 text-rose-900 hover:bg-rose-100",
    });
  }
  if (wikisource) {
    links.push({
      url: wikisource,
      label: "维基文库",
      icon: "📖",
      color: "bg-stone-50 border-stone-200 text-stone-900 hover:bg-stone-100",
    });
  }
  if (links.length === 0) return null;

  const sizeClasses = size === "sm" ? "text-[10px] px-2 py-1" : "text-xs px-3 py-1.5";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className={`inline-flex items-center gap-1 text-muted-foreground ${size === "sm" ? "text-[10px]" : "text-xs"}`}>
        <BookText className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
        查看原典：
      </span>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 rounded-full border transition ${sizeClasses} ${l.color}`}
          title={title ? `在 ${l.label} 查看《${title}》` : `在 ${l.label} 查看`}
        >
          <span>{l.icon}</span>
          {l.label}
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      ))}
    </div>
  );
}
