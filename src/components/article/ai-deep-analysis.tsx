import { useState, useEffect, useRef } from "react";
import { useAIFill, type AIFillField } from "@/hooks/article-hooks";
import { SectionHeading } from "./section-heading";
import { Sparkles, Loader2, HelpCircle, Quote, BookText, ChevronRight, RefreshCw } from "lucide-react";
import type { Article } from "@/lib/knowledge-types";

interface AiDeepAnalysisProps {
  article: Article;
  /** 要展示的字段 — 默认全展示 */
  fields?: AIFillField[];
  accent?: string;
}

/**
 * AI 深度解析 — 懒加载 history / influence / faq / commentary
 * 当文章缺少结构化数据时由 AI 补全
 */
export function AiDeepAnalysis({
  article,
  fields = ["history", "influence", "faq", "commentary"],
  accent = "var(--color-cinnabar)",
}: AiDeepAnalysisProps) {
  const fill = useAIFill(article, fields);

  const showHistory = fields.includes("history");
  const showInfluence = fields.includes("influence");
  const showFaq = fields.includes("faq");
  const showCommentary = fields.includes("commentary");

  return (
    <section className="mb-8">
      <SectionHeading
        icon={Sparkles}
        title="AI 深度解析"
        subtitle="AI INSIGHT"
        watermark="智"
        accent={accent}
        trailing={
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="font-serif tracking-widest">由 AI 实时解读</span>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* 历史背景 */}
        {showHistory && (
          <InsightCard
            title="历史背景"
            icon={<BookText className="h-3.5 w-3.5" />}
            accent={accent}
            loading={fill.loading.history}
            value={fill.history || article.history}
            onReload={() => fill.fill("history")}
            placeholder="点击「AI 补全」生成历史背景"
          />
        )}

        {/* 后世影响 */}
        {showInfluence && (
          <InsightCard
            title="后世影响"
            icon={<Sparkles className="h-3.5 w-3.5" />}
            accent={accent}
            loading={fill.loading.influence}
            value={fill.influence || article.influence}
            onReload={() => fill.fill("influence")}
            placeholder="点击「AI 补全」生成后世影响"
          />
        )}

        {/* AI 解读/赏析 */}
        {showCommentary && (
          <div className="md:col-span-2">
            <InsightCard
              title="AI 解读"
              icon={<Quote className="h-3.5 w-3.5" />}
              accent={accent}
              loading={fill.loading.commentary}
              value={fill.commentary}
              onReload={() => fill.fill("commentary")}
              placeholder="点击「AI 补全」生成深度解读"
            />
          </div>
        )}
      </div>

      {/* FAQ */}
      {showFaq && (
        <div className="mt-5">
          <FaqBlock
            faq={fill.faq}
            loading={fill.loading.faq}
            onReload={() => fill.fill("faq")}
            accent={accent}
          />
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// InsightCard
// ---------------------------------------------------------------------------
function InsightCard({
  title,
  icon,
  accent,
  loading,
  value,
  onReload,
  placeholder,
}: {
  title: string;
  icon: React.ReactNode;
  accent: string;
  loading?: boolean;
  value?: string;
  onReload?: () => void;
  placeholder?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5">
      {/* 左侧色条 */}
      <span
        aria-hidden
        className="absolute left-0 top-0 h-full w-1"
        style={{ background: accent }}
      />

      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-sm text-white"
            style={{ background: accent }}
          >
            {icon}
          </span>
          <h3 className="font-serif text-sm font-semibold tracking-wider text-foreground">
            {title}
          </h3>
        </div>
        {onReload && (
          <button
            onClick={onReload}
            disabled={loading}
            className="rounded-full p-1 text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-50"
            title="重新生成"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="font-serif">AI 正在为你解读…</span>
        </div>
      ) : value ? (
        <p className="whitespace-pre-line font-serif text-sm leading-relaxed text-foreground/85">
          {value}
        </p>
      ) : (
        <button
          onClick={onReload}
          className="flex w-full items-center justify-between rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
        >
          <span className="font-serif italic">{placeholder}</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FaqBlock
// ---------------------------------------------------------------------------
function FaqBlock({
  faq,
  loading,
  onReload,
  accent,
}: {
  faq: import("@/lib/knowledge-types").FAQItem[];
  loading?: boolean;
  onReload?: () => void;
  accent: string;
}) {
  const [open, setOpen] = useState<number | null>(0);
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="font-serif">AI 正在生成常见问答…</span>
      </div>
    );
  }
  if (!faq || faq.length === 0) {
    return (
      <button
        onClick={onReload}
        className="flex w-full items-center justify-between rounded-xl border border-dashed border-border px-5 py-4 text-sm text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
      >
        <span className="flex items-center gap-2 font-serif">
          <HelpCircle className="h-4 w-4" />
          AI 生成常见问答 (FAQ)
        </span>
        <ChevronRight className="h-4 w-4" />
      </button>
    );
  }
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-sm text-white"
            style={{ background: accent }}
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </span>
          <h3 className="font-serif text-sm font-semibold tracking-wider text-foreground">常见问答</h3>
        </div>
        {onReload && (
          <button
            onClick={onReload}
            className="rounded-full p-1 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            title="重新生成"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="space-y-2">
        {faq.map((item, i) => (
          <details
            key={i}
            open={open === i}
            onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open ? i : null)}
            className="group rounded-lg border border-border bg-background/60 open:bg-background"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-serif text-sm font-semibold text-foreground">
              <span className="flex items-center gap-2">
                <span
                  className="font-serif text-xs font-bold"
                  style={{ color: accent }}
                >
                  Q{(i + 1).toString().padStart(2, "0")}
                </span>
                {item.question}
              </span>
              <ChevronRight className="h-3.5 w-3.5 transition group-open:rotate-90" />
            </summary>
            <div className="border-t border-border px-4 py-3 font-serif text-sm leading-relaxed text-foreground/85">
              <span
                className="mr-1 font-serif text-xs font-bold"
                style={{ color: accent }}
              >
                A
              </span>
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
