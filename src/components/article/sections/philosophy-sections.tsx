/**
 * 思想智慧详情页 — 突出思想解读
 * 1. 核心概念
 * 2. 经典原文
 * 3. 出处
 * 4. AI 现代语言解释
 * 5. 历史背景
 * 6. 与其他思想流派对比
 * 7. 现实生活中的应用案例
 */
import { SectionHeading } from "../section-heading";
import { BasicInfoCard, I } from "../basic-info-card";
import { getCategoryMeta } from "../category-meta";
import { useAIFill } from "@/hooks/article-hooks";
import { Brain, BookText, History, Sparkles, GitCompare, Lightbulb, Quote, ArrowRight, Loader2 } from "lucide-react";
import type { Article, RelatedItem } from "@/lib/knowledge-types";
import { useState } from "react";

interface Props {
  article: Article;
  /** 经典原文 */
  classics?: { title: string; text: string; source?: string }[];
  /** 其他流派对比 */
  comparisons?: { school: string; compare: string }[];
  /** 现实应用 */
  applications?: { scene: string; example: string }[];
}

export function PhilosophySections({ article, classics = [], comparisons = [], applications = [] }: Props) {
  const meta = getCategoryMeta("philosophy");
  const accent = meta.accent;
  const fill = useAIFill(article, ["commentary"]);

  return (
    <>
      {/* === 1. 基础信息卡 === */}
      <BasicInfoCard
        title="思想档案"
        accent={accent}
        columns={4}
        items={[
          { icon: I.user, label: "代表人物", value: article.author || "—", primary: true },
          { icon: I.calendar, label: "兴起年代", value: article.dynasty || article.era || "—", primary: true },
          { icon: I.tag, label: "所属流派", value: article.subCategory || "—", primary: true },
          { icon: I.book, label: "核心典籍", value: (article as any).coreText || "—", primary: true },
          { icon: I.beaker, label: "核心概念", value: (article as any).coreConcept || "—", primary: false },
          { icon: I.feather, label: "思想关键词", value: (article as any).keywords || "—", primary: false },
          { icon: I.crown, label: "历史地位", value: (article as any).position || "—", primary: false },
          { icon: I.clock, label: "影响范围", value: (article as any).scope || "—", primary: false },
        ]}
      />

      {/* === 2. 核心概念 === */}
      {article.excerpt && (
        <section className="mb-8">
          <SectionHeading icon={Brain} title="核心概念" watermark="核" accent={accent} />
          <div
            className="rounded-2xl border p-6"
            style={{
              borderColor: accent,
              background: `linear-gradient(135deg, color-mix(in oklab, ${accent} 6%, var(--color-card)) 0%, var(--color-card) 100%)`,
            }}
          >
            <p className="whitespace-pre-line font-serif text-base leading-loose text-foreground/90">
              {article.excerpt}
            </p>
          </div>
        </section>
      )}

      {/* === 3. 经典原文 === */}
      {classics.length > 0 && (
        <section className="mb-8">
          <SectionHeading icon={BookText} title="经典原文" watermark="原" accent={accent} />
          <div className="space-y-3">
            {classics.map((c, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="font-serif text-sm font-semibold text-foreground">{c.title}</h4>
                  {c.source && (
                    <span
                      className="rounded-sm border px-1.5 py-0.5 font-serif text-[10px] tracking-widest"
                      style={{ borderColor: accent, color: accent }}
                    >
                      出自《{c.source}》
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-line font-serif text-base leading-loose text-foreground/85">
                  {c.text}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* === 4. AI 现代语言解释 === */}
      <section className="mb-8">
        <SectionHeading
          icon={Sparkles}
          title="AI 现代语言解释"
          subtitle="AI INTERPRETATION"
          watermark="释"
          accent={accent}
        />
        <ModernInterpretation
          commentary={fill.commentary}
          loading={fill.loading.commentary}
          onReload={() => fill.fill("commentary")}
          accent={accent}
          article={article}
        />
      </section>

      {/* === 5. 历史背景 === */}
      {article.history && (
        <section className="mb-8">
          <SectionHeading icon={History} title="历史背景" watermark="源" accent={accent} />
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="whitespace-pre-line font-serif text-sm leading-relaxed text-foreground/85">
              {article.history}
            </p>
          </div>
        </section>
      )}

      {/* === 6. 与其他思想流派对比 === */}
      {comparisons.length > 0 && (
        <section className="mb-8">
          <SectionHeading icon={GitCompare} title="与其他思想流派对比" watermark="比" accent={accent} />
          <div className="space-y-3">
            {comparisons.map((c, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm font-serif text-xs font-bold text-white"
                  style={{ background: accent }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="font-serif text-sm font-semibold text-foreground">{c.school}</h4>
                  <p className="mt-1.5 font-serif text-sm leading-relaxed text-foreground/75">
                    {c.compare}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* === 7. 现实生活中的应用案例 === */}
      {applications.length > 0 && (
        <section className="mb-8">
          <SectionHeading icon={Lightbulb} title="现实生活中的应用" watermark="用" accent={accent} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {applications.map((a, i) => (
              <div
                key={i}
                className="group rounded-2xl border border-border bg-card p-4 transition hover:border-foreground/30 hover:shadow-md"
              >
                <div className="mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" style={{ color: accent }} />
                  <h4 className="font-serif text-sm font-semibold text-foreground">{a.scene}</h4>
                </div>
                <p className="font-serif text-sm leading-relaxed text-foreground/75">{a.example}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* === 8. 后世影响 === */}
      {article.influence && (
        <section className="mb-8">
          <SectionHeading icon={Quote} title="后世影响" watermark="响" accent={accent} />
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="whitespace-pre-line font-serif text-sm leading-relaxed text-foreground/85">
              {article.influence}
            </p>
          </div>
        </section>
      )}
    </>
  );
}

function ModernInterpretation({
  commentary,
  loading,
  onReload,
  accent,
  article,
}: {
  commentary: string;
  loading?: boolean;
  onReload: () => void;
  accent: string;
  article: Article;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="font-serif">AI 正在用现代语言重新解释「{article.title}」…</span>
      </div>
    );
  }
  if (commentary) {
    return (
      <div
        className="rounded-2xl border p-5"
        style={{
          borderColor: accent,
          background: `color-mix(in oklab, ${accent} 5%, var(--color-card))`,
        }}
      >
        <p className="whitespace-pre-line font-serif text-sm leading-loose text-foreground/85">
          {commentary}
        </p>
      </div>
    );
  }
  return (
    <button
      onClick={onReload}
      className="flex w-full items-center justify-between rounded-2xl border border-dashed border-border bg-card/50 px-5 py-6 text-sm text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
    >
      <span className="font-serif">点击生成「{article.title}」的现代语言解释</span>
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}
