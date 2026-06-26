/**
 * 诗词文章详情页 — 以阅读体验为核心
 * 1. 原文（卷轴/竖排）
 * 2. 拼音（可选）
 * 3. 朗读
 * 4. AI 一句话概括
 * 5. 逐句白话译文
 * 6. 注释
 * 7. 创作背景
 * 8. 名句赏析
 * 9. 艺术特色
 * 10. 历史影响
 * 11. 相似主题作品推荐
 * 12. AI 深度赏析
 *
 * 大部分细节用 FullTextPanel 复用
 */
import { SectionHeading } from "../section-heading";
import { getCategoryMeta } from "../category-meta";
import { FullTextPanel } from "@/components/full-text-panel";
import { RelatedItemsBlock } from "../knowledge-card";
import { useTranslation } from "@/lib/use-translation";
import { Sparkles, BookOpen, Volume2, Award, Quote, Loader2, Languages } from "lucide-react";
import { useState } from "react";
import type { Article } from "@/lib/knowledge-types";

interface Props {
  article: Article;
}

export function PoemSections({ article }: Props) {
  const meta = getCategoryMeta("poems");
  const accent = meta.accent;

  return (
    <>
      {/* === 1. 原文 + 译注 + 释义（复用 FullTextPanel） === */}
      <section className="mb-8">
        <SectionHeading
          icon={BookOpen}
          title="原文 · 译注 · 释义"
          subtitle="ORIGINAL"
          watermark="文"
          accent={accent}
        />
        <FullTextPanel
          articleId={article.id}
          title={article.title}
          category="poems"
          body={article.content}
          fullText={article.fullText || article.bodyExtended}
        />
      </section>

      {/* === 2. AI 一句话概括 === */}
      <PoemSummary article={article} accent={accent} />

      {/* === 3. 创作背景 === */}
      {article.history && (
        <section className="mb-8">
          <SectionHeading icon={Quote} title="创作背景" watermark="源" accent={accent} />
          <div
            className="rounded-2xl border-l-4 bg-card p-5 md:p-6"
            style={{ borderColor: accent }}
          >
            <p className="whitespace-pre-line font-serif text-base leading-loose text-foreground/85">
              {article.history}
            </p>
          </div>
        </section>
      )}

      {/* === 4. 名句赏析 === */}
      {article.classics && article.classics.length > 0 && (
        <section className="mb-8">
          <SectionHeading icon={Sparkles} title="名句赏析" watermark="名" accent={accent} />
          <div className="space-y-3">
            {article.classics.map((line, i) => (
              <div
                key={i}
                className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-foreground/30"
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm font-serif text-xs font-bold text-white"
                  style={{ background: accent }}
                >
                  名
                </span>
                <p className="font-serif text-base leading-relaxed text-foreground">
                  「{line}」
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* === 5. 艺术特色 === */}
      {(article as any).artisticFeatures && (
        <section className="mb-8">
          <SectionHeading icon={Award} title="艺术特色" watermark="艺" accent={accent} />
          <p className="whitespace-pre-line rounded-2xl border border-border bg-card p-5 font-serif text-sm leading-relaxed text-foreground/85">
            {(article as any).artisticFeatures}
          </p>
        </section>
      )}

      {/* === 6. 历史影响 === */}
      {article.influence && (
        <section className="mb-8">
          <SectionHeading icon={Volume2} title="历史影响" watermark="响" accent={accent} />
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="whitespace-pre-line font-serif text-sm leading-relaxed text-foreground/85">
              {article.influence}
            </p>
          </div>
        </section>
      )}

      {/* === 7. 相似主题作品推荐 === */}
      {article.relatedPoems && article.relatedPoems.length > 0 && (
        <RelatedItemsBlock
          title="相似主题作品"
          accent={accent}
          items={article.relatedPoems}
          watermark="似"
        />
      )}
    </>
  );
}

function PoemSummary({ article, accent }: { article: Article; accent: string }) {
  const { translation, loading, open, toggle } = useTranslation({
    mode: "scholar",
    text: article.content || article.excerpt,
  });

  return (
    <section className="mb-8">
      <SectionHeading
        icon={Sparkles}
        title="AI 一句话概括"
        subtitle="ONE-LINER"
        watermark="概"
        accent={accent}
        trailing={
          <button
            onClick={toggle}
            disabled={loading}
            className="flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 font-serif text-[10px] tracking-widest text-muted-foreground transition hover:border-foreground/30 hover:text-foreground disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
            {open ? "收起" : "学者译文"}
          </button>
        }
      />
      <div
        className="rounded-2xl border p-5"
        style={{
          borderColor: accent,
          background: `color-mix(in oklab, ${accent} 5%, var(--color-card))`,
        }}
      >
        <p className="font-serif text-base italic leading-relaxed text-foreground/85">
          「{article.excerpt}」
        </p>
        {open && translation && (
          <div
            className="mt-4 border-t pt-4 font-serif text-sm leading-loose text-foreground/80"
            style={{ borderColor: `color-mix(in oklab, ${accent} 30%, transparent)` }}
          >
            <div className="mb-1.5 flex items-center gap-1.5 text-[10px] tracking-widest" style={{ color: accent }}>
              <Sparkles className="h-3 w-3" /> 学者译文
            </div>
            <p className="whitespace-pre-wrap">{translation}</p>
          </div>
        )}
      </div>
    </section>
  );
}
