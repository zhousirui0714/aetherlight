/**
 * 饮食服饰详情页 — 突出生活文化
 * 1. 起源
 * 2. 地区 / 朝代
 * 3. 制作工艺
 * 4. 历史演变
 * 5. 文化寓意
 * 6. 地域差异
 * 7. 现代体验方式
 * 8. 相关节日或民俗
 */
import { SectionHeading } from "../section-heading";
import { BasicInfoCard, I } from "../basic-info-card";
import { TimelineBlock, type TimelineEvent } from "../timeline-block";
import { RelatedItemsBlock } from "../knowledge-card";
import { ProcessFlow, type ProcessStep } from "../process-flow";
import { getCategoryMeta } from "../category-meta";
import { Coffee, MapPin, Wrench, History, Heart, Globe, Calendar, Sparkles, Utensils, Shirt } from "lucide-react";
import type { Article, RelatedItem } from "@/lib/knowledge-types";

interface Props {
  article: Article;
  /** 制作工艺 */
  craft?: ProcessStep[];
  /** 历史演变 */
  evolution?: TimelineEvent[];
  /** 地域差异 */
  regionalVariants?: { region: string; features: string }[];
  /** 现代体验 */
  modernExperiences?: { name: string; description: string; url?: string }[];
  /** 相关节日 */
  relatedFestivals?: RelatedItem[];
}

export function LifestyleSections({
  article,
  craft = [],
  evolution = [],
  regionalVariants = [],
  modernExperiences = [],
  relatedFestivals = [],
}: Props) {
  const meta = getCategoryMeta("lifestyle");
  const accent = meta.accent;
  const isFood = article.subCategory?.includes("食") || article.subCategory?.includes("茶") || article.subCategory?.includes("酒");
  const Icon = isFood ? Utensils : Shirt;

  return (
    <>
      {/* === 1. 基础信息卡 === */}
      <BasicInfoCard
        title={isFood ? "饮食档案" : "服饰档案"}
        accent={accent}
        columns={4}
        items={[
          { icon: I.map, label: "起源地区", value: article.region || "—", primary: true },
          { icon: I.calendar, label: "兴起朝代", value: article.dynasty || "—", primary: true },
          { icon: I.tag, label: "类别", value: article.subCategory || "—", primary: true },
          { icon: I.feather, label: "代表流派", value: (article as any).school || "—", primary: false },
          { icon: I.beaker, label: "主要材料", value: (article as any).materials || "—", primary: false },
          { icon: I.crown, label: "文化地位", value: (article as any).status || "—", primary: false },
          { icon: I.user, label: "代表人物", value: (article as any).representative || "—", primary: false },
          { icon: I.clock, label: "流行时间", value: (article as any).popularEra || "—", primary: false },
        ]}
      />

      {/* === 2. 起源 === */}
      {article.history && (
        <section className="mb-8">
          <SectionHeading icon={History} title="起源" watermark="源" accent={accent} />
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

      {/* === 3. 制作工艺 === */}
      {craft.length > 0 && (
        <ProcessFlow
          title={isFood ? "制作工艺流程" : "制作工艺"}
          steps={craft}
          accent={accent}
          watermark="工"
        />
      )}

      {/* === 4. 历史演变 === */}
      {evolution.length > 0 && (
        <TimelineBlock
          title="历史演变"
          events={evolution}
          accent={accent}
          watermark="变"
        />
      )}

      {/* === 5. 文化寓意 === */}
      {article.excerpt && (
        <section className="mb-8">
          <SectionHeading icon={Heart} title="文化寓意" watermark="意" accent={accent} />
          <div
            className="rounded-2xl border p-5"
            style={{
              borderColor: accent,
              background: `color-mix(in oklab, ${accent} 5%, var(--color-card))`,
            }}
          >
            <p className="whitespace-pre-line font-serif text-sm leading-relaxed text-foreground/85">
              {article.excerpt}
            </p>
          </div>
        </section>
      )}

      {/* === 6. 地域差异 === */}
      {regionalVariants.length > 0 && (
        <section className="mb-8">
          <SectionHeading icon={MapPin} title="地域差异" watermark="域" accent={accent} />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {regionalVariants.map((r, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm font-serif text-xs font-bold text-white"
                  style={{ background: accent }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="font-serif text-sm font-semibold text-foreground">{r.region}</h4>
                  <p className="mt-1.5 font-serif text-sm leading-relaxed text-foreground/75">
                    {r.features}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* === 7. 现代体验方式 === */}
      {modernExperiences.length > 0 && (
        <section className="mb-8">
          <SectionHeading icon={Globe} title="现代体验方式" watermark="今" accent={accent} />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {modernExperiences.map((m, i) => (
              <a
                key={i}
                href={m.url || "#"}
                target={m.url ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-foreground/30 hover:shadow-sm"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
                  style={{
                    background: `color-mix(in oklab, ${accent} 10%, transparent)`,
                    color: accent,
                  }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="font-serif text-sm font-semibold text-foreground">{m.name}</h4>
                  <p className="mt-1 font-serif text-xs leading-relaxed text-foreground/70">
                    {m.description}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* === 8. 相关节日/民俗 === */}
      {relatedFestivals.length > 0 && (
        <RelatedItemsBlock
          title="相关节日或民俗"
          accent={accent}
          items={relatedFestivals}
          watermark="俗"
        />
      )}
    </>
  );
}
