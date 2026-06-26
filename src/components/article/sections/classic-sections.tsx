/**
 * 典籍经典详情页 — 以导读为核心
 * 1. 作者 + 成书背景
 * 2. 核心思想
 * 3. 章节目录
 * 4. 经典原文
 * 5. 逐段 AI 白话解读
 * 6. 后世影响
 * 7. 思想体系关联
 * 8. 推荐阅读顺序
 */
import { SectionHeading } from "../section-heading";
import { BasicInfoCard, I } from "../basic-info-card";
import { getCategoryMeta } from "../category-meta";
import { FullTextPanel } from "@/components/full-text-panel";
import { useAIFill } from "@/hooks/article-hooks";
import { User, BookText, Library, Brain, Network, ArrowRight, BookOpen, Quote, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import type { Article, RelatedItem } from "@/lib/knowledge-types";

interface Props {
  article: Article;
  /** 章节目录 */
  chapters?: { title: string; brief?: string }[];
  /** 思想流派关联 */
  relatedSchools?: RelatedItem[];
}

export function ClassicSections({ article, chapters = [], relatedSchools = [] }: Props) {
  const meta = getCategoryMeta("classics");
  const accent = meta.accent;
  const fill = useAIFill(article, ["commentary"]);

  return (
    <>
      {/* === 1. 基础信息卡 === */}
      <BasicInfoCard
        title="典籍档案"
        accent={accent}
        columns={4}
        items={[
          { icon: I.user, label: "作者", value: article.author || "佚名", primary: true },
          { icon: I.calendar, label: "成书年代", value: article.dynasty || article.era || "—", primary: true },
          { icon: I.book, label: "类别", value: article.subCategory || "—", primary: true },
          { icon: I.library, label: "总字数", value: (article as any).wordCount || "—", primary: false },
          { icon: I.beaker, label: "成书背景", value: (article as any).background || "—", primary: false },
          { icon: I.tag, label: "学派归属", value: (article as any).school || "—", primary: false },
          { icon: I.crown, label: "版本", value: (article as any).edition || "传世本", primary: false },
          { icon: I.feather, label: "语言", value: "文言文", primary: false },
        ]}
      />

      {/* === 2. 核心思想 === */}
      {article.excerpt && (
        <section className="mb-8">
          <SectionHeading icon={Brain} title="核心思想" watermark="魂" accent={accent} />
          <div
            className="rounded-2xl border p-6"
            style={{
              borderColor: accent,
              background: `color-mix(in oklab, ${accent} 5%, var(--color-card))`,
            }}
          >
            <p className="whitespace-pre-line font-serif text-base leading-loose text-foreground/90">
              {article.excerpt}
            </p>
          </div>
        </section>
      )}

      {/* === 3. 章节目录 === */}
      {chapters.length > 0 && (
        <section className="mb-8">
          <SectionHeading icon={Library} title="章节目录" watermark="卷" accent={accent} />
          <div className="rounded-2xl border border-border bg-card p-5">
            <ol className="space-y-1">
              {chapters.map((c, i) => (
                <li
                  key={i}
                  className="group flex items-baseline gap-3 border-b border-dashed border-border/50 py-2 last:border-0 hover:border-solid"
                >
                  <span
                    className="font-serif text-xs font-bold"
                    style={{ color: accent }}
                  >
                    卷{String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 font-serif text-sm font-semibold text-foreground">
                    {c.title}
                  </span>
                  {c.brief && (
                    <span className="line-clamp-1 max-w-[60%] font-serif text-xs text-muted-foreground">
                      {c.brief}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* === 4. 经典原文 === */}
      <section className="mb-8">
        <SectionHeading icon={BookText} title="经典原文" watermark="原" accent={accent} />
        <FullTextPanel
          articleId={article.id}
          title={article.title}
          category="classics"
          body={article.content}
          fullText={article.fullText || article.bodyExtended}
        />
      </section>

      {/* === 5. 逐段 AI 白话解读 === */}
      <section className="mb-8">
        <SectionHeading
          icon={Quote}
          title="逐段 AI 白话解读"
          subtitle="AI COMMENTARY"
          watermark="释"
          accent={accent}
        />
        <CommentaryBox
          article={article}
          commentary={fill.commentary}
          loading={fill.loading.commentary}
          onReload={() => fill.fill("commentary")}
          accent={accent}
        />
      </section>

      {/* === 6. 后世影响 === */}
      {article.influence && (
        <section className="mb-8">
          <SectionHeading icon={Network} title="后世影响" watermark="泽" accent={accent} />
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="whitespace-pre-line font-serif text-sm leading-relaxed text-foreground/85">
              {article.influence}
            </p>
          </div>
        </section>
      )}

      {/* === 7. 思想体系关联 === */}
      {relatedSchools.length > 0 && (
        <section className="mb-8">
          <SectionHeading icon={BookOpen} title="思想体系关联" watermark="系" accent={accent} />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {relatedSchools.map((s, i) => (
              <Link
                key={i}
                to="/article/$id"
                params={{ id: s.id }}
                className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition hover:border-foreground/30 hover:shadow-sm"
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm font-serif text-[10px] font-bold text-white"
                  style={{ background: accent }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-sm font-semibold text-foreground">{s.title}</p>
                  {s.brief && (
                    <p className="line-clamp-1 font-serif text-[11px] text-muted-foreground">{s.brief}</p>
                  )}
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 transition group-hover:translate-x-0.5 group-hover:text-foreground" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* === 8. 推荐阅读顺序 === */}
      {article.relatedBooks && article.relatedBooks.length > 0 && (
        <ReadingOrder article={article} accent={accent} />
      )}
    </>
  );
}

function CommentaryBox({
  article,
  commentary,
  loading,
  onReload,
  accent,
}: {
  article: Article;
  commentary: string;
  loading?: boolean;
  onReload: () => void;
  accent: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-5"
      style={{
        borderColor: accent,
        background: `color-mix(in oklab, ${accent} 4%, var(--color-card))`,
      }}
    >
      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="font-serif">AI 正在为《{article.title}》做逐段白话解读…</span>
        </div>
      ) : commentary ? (
        <p className="whitespace-pre-line font-serif text-sm leading-loose text-foreground/85">
          {commentary}
        </p>
      ) : (
        <button
          onClick={onReload}
          className="flex w-full items-center justify-between rounded-lg border border-dashed border-border bg-background/50 px-4 py-6 text-sm text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
        >
          <span className="font-serif">点击生成《{article.title}》的逐段 AI 解读</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function ReadingOrder({ article, accent }: { article: Article; accent: string }) {
  return (
    <section className="mb-8">
      <SectionHeading icon={Library} title="推荐阅读顺序" watermark="序" accent={accent} />
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="mb-3 font-serif text-xs tracking-widest text-muted-foreground">
          延伸阅读 · 由浅入深
        </p>
        <ol className="space-y-2">
          {article.relatedBooks?.map((b, i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-lg border border-border bg-background/50 px-4 py-2.5 transition hover:border-foreground/30"
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm font-serif text-[10px] font-bold text-white"
                style={{ background: accent }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-serif text-sm font-semibold text-foreground">{b.title}</span>
              {b.brief && (
                <span className="line-clamp-1 flex-1 font-serif text-xs text-muted-foreground">
                  {b.brief}
                </span>
              )}
              {b.external && b.externalUrl ? (
                <a
                  href={b.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent hover:underline"
                >
                  外部 →
                </a>
              ) : (
                <Link
                  to="/article/$id"
                  params={{ id: b.id }}
                  className="text-xs text-accent hover:underline"
                >
                  进入 →
                </Link>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
