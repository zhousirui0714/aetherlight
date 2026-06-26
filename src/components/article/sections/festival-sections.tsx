/**
 * 节日节气详情页 — 突出传统文化体验
 * 1. 倒计时
 * 2. 日期 / 农历
 * 3. 历史起源
 * 4. 演变时间轴
 * 5. 传统习俗
 * 6. 地域差异
 * 7. 传统饮食
 * 8. 相关诗词
 */
import { SectionHeading } from "../section-heading";
import { BasicInfoCard, I } from "../basic-info-card";
import { TimelineBlock, type TimelineEvent } from "../timeline-block";
import { RelatedItemsBlock } from "../knowledge-card";
import { useCountdown } from "@/hooks/article-hooks";
import { getCategoryMeta } from "../category-meta";
import { Calendar, Clock, MapPin, Utensils, ScrollText, History, Sparkles, Sun, Moon } from "lucide-react";
import type { Article, RelatedItem } from "@/lib/knowledge-types";

interface Props {
  article: Article;
  /** 倒计时目标日期（ISO 字符串或 Date） */
  targetDate?: Date | string;
  /** 演变时间轴 */
  evolution?: TimelineEvent[];
  /** 地域差异 */
  regionalVariations?: { region: string; custom: string }[];
  /** 传统饮食 */
  foods?: { name: string; description: string }[];
}

export function FestivalSections({
  article,
  targetDate,
  evolution = [],
  regionalVariations = [],
  foods = [],
}: Props) {
  const meta = getCategoryMeta("festivals");
  const accent = meta.accent;
  const countdown = useCountdown(targetDate);

  return (
    <>
      {/* === 1. 倒计时（如果提供目标日期） === */}
      {targetDate && (
        <CountdownPanel countdown={countdown} accent={accent} title={article.title} />
      )}

      {/* === 2. 基础信息卡 === */}
      <BasicInfoCard
        title="节日档案"
        accent={accent}
        columns={4}
        items={[
          { icon: I.calendar, label: "公历日期", value: (article as any).solarDate || article.dynasty || "—", primary: true },
          { icon: I.calendar, label: "农历日期", value: (article as any).lunarDate || "—", primary: true },
          { icon: I.tag, label: "节日类型", value: article.subCategory || (article as any).festivalType || "—", primary: true },
          { icon: I.clock, label: "所属季节", value: (article as any).season || "—", primary: false },
          { icon: I.map, label: "流行地区", value: article.region || "全中国", primary: false },
          { icon: I.beaker, label: "文化意义", value: (article as any).significance || "—", primary: false },
        ]}
      />

      {/* === 3. 历史起源 === */}
      {article.history && (
        <section className="mb-8">
          <SectionHeading icon={History} title="历史起源" watermark="源" accent={accent} />
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

      {/* === 4. 演变时间轴 === */}
      {evolution.length > 0 && (
        <TimelineBlock
          title="演变时间轴"
          events={evolution}
          accent={accent}
          watermark="变"
        />
      )}

      {/* === 5. 传统习俗 === */}
      {article.content && (
        <section className="mb-8">
          <SectionHeading icon={Sparkles} title="传统习俗" watermark="俗" accent={accent} />
          <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
            <div className="prose prose-lg max-w-none font-serif leading-loose text-foreground/85">
              <div className="whitespace-pre-wrap">{article.content}</div>
            </div>
          </div>
        </section>
      )}

      {/* === 6. 地域差异 === */}
      {regionalVariations.length > 0 && (
        <section className="mb-8">
          <SectionHeading icon={MapPin} title="地域差异" watermark="域" accent={accent} />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {regionalVariations.map((r, i) => (
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
                  <p className="mt-1 font-serif text-sm leading-relaxed text-foreground/75">{r.custom}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* === 7. 传统饮食 === */}
      {foods.length > 0 && (
        <section className="mb-8">
          <SectionHeading icon={Utensils} title="传统饮食" watermark="食" accent={accent} />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {foods.map((f, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-sm font-serif text-xs font-bold text-white"
                    style={{ background: accent }}
                  >
                    {i + 1}
                  </span>
                  <h4 className="font-serif text-base font-semibold text-foreground">{f.name}</h4>
                </div>
                <p className="font-serif text-sm leading-relaxed text-foreground/75">{f.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* === 8. 相关诗词 === */}
      {article.relatedPoems && article.relatedPoems.length > 0 && (
        <RelatedItemsBlock
          title="相关诗词"
          accent={accent}
          items={article.relatedPoems}
          watermark="诗"
        />
      )}
    </>
  );
}

function CountdownPanel({
  countdown,
  accent,
  title,
}: {
  countdown: ReturnType<typeof useCountdown>;
  accent: string;
  title: string;
}) {
  return (
    <section
      className="relative mb-8 overflow-hidden rounded-2xl border p-6 md:p-8"
      style={{
        borderColor: accent,
        background: `linear-gradient(135deg, color-mix(in oklab, ${accent} 8%, var(--color-card)) 0%, var(--color-card) 100%)`,
      }}
    >
      {/* 背景大字 */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-4 -top-6 select-none font-serif text-[120px] font-bold leading-none opacity-[0.05]"
        style={{ color: accent, writingMode: "vertical-rl" }}
      >
        节
      </span>

      <div className="relative grid grid-cols-1 items-center gap-4 md:grid-cols-[1fr_auto]">
        <div>
          <div className="flex items-center gap-2 text-xs tracking-widest" style={{ color: accent }}>
            <Clock className="h-3.5 w-3.5" />
            距离下一个「{title}」
          </div>
          <h3 className="mt-2 font-serif text-2xl font-semibold tracking-wider text-foreground md:text-3xl">
            {countdown.reached ? "已到来" : `${countdown.days} 天 ${countdown.hours} 时 ${countdown.minutes} 分`}
          </h3>
          <p className="mt-1 font-serif text-xs text-muted-foreground">
            目标日期：{countdown.next.toLocaleDateString("zh-CN")}
          </p>
        </div>
        {/* 倒计时格子 */}
        <div className="flex gap-2">
          <CountdownCell value={countdown.days} label="天" accent={accent} />
          <CountdownCell value={countdown.hours} label="时" accent={accent} />
          <CountdownCell value={countdown.minutes} label="分" accent={accent} />
          <CountdownCell value={countdown.seconds} label="秒" accent={accent} />
        </div>
      </div>
    </section>
  );
}

function CountdownCell({ value, label, accent }: { value: number; label: string; accent: string }) {
  return (
    <div
      className="flex h-20 w-20 flex-col items-center justify-center rounded-xl border-2"
      style={{ borderColor: accent, background: "var(--color-paper)" }}
    >
      <span
        className="font-serif text-2xl font-bold tabular-nums"
        style={{ color: accent }}
      >
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-1 font-serif text-[10px] tracking-widest text-muted-foreground">{label}</span>
    </div>
  );
}
