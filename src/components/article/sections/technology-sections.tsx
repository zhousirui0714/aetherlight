/**
 * 古代科技详情页 — 突出原理展示
 * 1. 发明时间
 * 2. 发明背景
 * 3. 发明者
 * 4. 工作原理
 * 5. 历史意义
 * 6. 传播路线
 * 7. 对世界文明的影响
 * 8. 现代技术延续
 * 9. AI 原理解读
 */
import { SectionHeading } from "../section-heading";
import { BasicInfoCard, I } from "../basic-info-card";
import { TimelineBlock, type TimelineEvent } from "../timeline-block";
import { ProcessFlow, type ProcessStep } from "../process-flow";
import { getCategoryMeta } from "../category-meta";
import { useAIFill } from "@/hooks/article-hooks";
import { Calendar, History, User, Cpu, Award, Globe, ArrowRight, Sparkles, Wrench, Loader2, Map } from "lucide-react";
import type { Article } from "@/lib/knowledge-types";

interface Props {
  article: Article;
  /** 工作原理步骤 */
  principle?: ProcessStep[];
  /** 传播路线时间轴 */
  spreadRoute?: TimelineEvent[];
  /** 现代技术延续 */
  modernContinuations?: { name: string; description: string }[];
}

export function TechnologySections({
  article,
  principle = [],
  spreadRoute = [],
  modernContinuations = [],
}: Props) {
  const meta = getCategoryMeta("technology");
  const accent = meta.accent;
  const fill = useAIFill(article, ["commentary"]);

  return (
    <>
      {/* === 1. 基础信息卡 === */}
      <BasicInfoCard
        title="科技档案"
        accent={accent}
        columns={4}
        items={[
          { icon: I.calendar, label: "发明时间", value: article.dynasty || article.era || "—", primary: true },
          { icon: I.user, label: "发明者", value: article.author || (article as any).inventor || "佚名", primary: true },
          { icon: I.tag, label: "类别", value: article.subCategory || "—", primary: true },
          { icon: I.map, label: "起源地区", value: article.region || "中国", primary: true },
          { icon: I.beaker, label: "应用领域", value: (article as any).field || "—", primary: false },
          { icon: I.clock, label: "使用时间", value: (article as any).usedPeriod || "—", primary: false },
          { icon: I.crown, label: "意义等级", value: (article as any).significance || "—", primary: false },
          { icon: I.feather, label: "关键词", value: (article as any).keywords || "—", primary: false },
        ]}
      />

      {/* === 2. 发明背景 === */}
      {article.history && (
        <section className="mb-8">
          <SectionHeading icon={History} title="发明背景" watermark="源" accent={accent} />
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

      {/* === 3. 工作原理 === */}
      {principle.length > 0 ? (
        <ProcessFlow
          title="工作原理"
          steps={principle}
          accent={accent}
          watermark="理"
        />
      ) : article.content ? (
        <section className="mb-8">
          <SectionHeading icon={Cpu} title="工作原理" watermark="理" accent={accent} />
          <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
            <div className="prose prose-lg max-w-none font-serif leading-loose text-foreground/85">
              <div className="whitespace-pre-wrap">{article.content}</div>
            </div>
          </div>
        </section>
      ) : null}

      {/* === 4. AI 原理解读 === */}
      <section className="mb-8">
        <SectionHeading
          icon={Sparkles}
          title="AI 原理解读"
          subtitle="AI EXPLAIN"
          watermark="智"
          accent={accent}
        />
        <AiPrincipleBox
          article={article}
          commentary={fill.commentary}
          loading={fill.loading.commentary}
          onReload={() => fill.fill("commentary")}
          accent={accent}
        />
      </section>

      {/* === 5. 历史意义 === */}
      {article.excerpt && (
        <section className="mb-8">
          <SectionHeading icon={Award} title="历史意义" watermark="义" accent={accent} />
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="whitespace-pre-line font-serif text-sm leading-relaxed text-foreground/85">
              {article.excerpt}
            </p>
          </div>
        </section>
      )}

      {/* === 6. 传播路线 === */}
      {spreadRoute.length > 0 && (
        <TimelineBlock
          title="对世界文明的传播路线"
          events={spreadRoute}
          accent={accent}
          watermark="传"
        />
      )}

      {/* === 7. 现代技术延续 === */}
      {modernContinuations.length > 0 && (
        <section className="mb-8">
          <SectionHeading icon={Wrench} title="现代技术延续" watermark="今" accent={accent} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {modernContinuations.map((m, i) => (
              <div
                key={i}
                className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 transition hover:border-foreground/30 hover:shadow-md"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm font-serif text-sm font-bold text-white"
                  style={{ background: accent }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="font-serif text-sm font-semibold text-foreground">{m.name}</h4>
                  <p className="mt-1.5 font-serif text-sm leading-relaxed text-foreground/75">
                    {m.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* === 8. 对世界文明的影响 === */}
      {article.influence && (
        <section className="mb-8">
          <SectionHeading icon={Globe} title="对世界文明的影响" watermark="界" accent={accent} />
          <div
            className="rounded-2xl border-l-4 bg-card p-5 md:p-6"
            style={{ borderColor: accent }}
          >
            <p className="whitespace-pre-line font-serif text-sm leading-loose text-foreground/85">
              {article.influence}
            </p>
          </div>
        </section>
      )}
    </>
  );
}

function AiPrincipleBox({
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
  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="font-serif">AI 正在解读「{article.title}」的工作原理…</span>
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
      <span className="font-serif">点击生成「{article.title}」的 AI 原理解读</span>
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}
