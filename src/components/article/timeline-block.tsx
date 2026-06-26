import { SectionHeading } from "./section-heading";
import { Clock } from "lucide-react";

export interface TimelineEvent {
  year: string;          // 显示年份/朝代 (如"开元十二年"或"712 年")
  title: string;         // 事件标题
  description?: string;  // 事件描述
  /** 高亮 — 当前文章锚定事件 */
  highlight?: boolean;
  icon?: React.ReactNode;
}

interface TimelineBlockProps {
  events: TimelineEvent[];
  title?: string;        // 默认"时间轴"
  accent?: string;
  watermark?: string;
}

/**
 * 通用时间轴 — 适用于人物生平、节日演变、思想发展、科技沿革
 * 垂直时间线 + 朝代色块 + 节点印章
 */
export function TimelineBlock({
  events,
  title = "时间轴",
  accent = "var(--color-cinnabar)",
  watermark = "时",
}: TimelineBlockProps) {
  if (!events || events.length === 0) return null;

  return (
    <section className="mb-8">
      <SectionHeading icon={Clock} title={title} watermark={watermark} accent={accent} />
      <div className="relative pl-8 md:pl-10">
        {/* 竖向墨线 */}
        <span
          aria-hidden
          className="absolute left-3 top-0 h-full w-px md:left-4"
          style={{
            background: `linear-gradient(to bottom, ${accent} 0%, color-mix(in oklab, ${accent} 30%, transparent) 100%)`,
          }}
        />

        <ul className="space-y-5">
          {events.map((ev, idx) => (
            <li
              key={idx}
              className="relative animate-in fade-in slide-in-from-left-3"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              {/* 节点印章 */}
              <span
                aria-hidden
                className="absolute -left-7 top-1.5 flex h-5 w-5 items-center justify-center rounded-sm border-2 text-[10px] font-serif font-bold text-white shadow-sm md:-left-9 md:h-6 md:w-6"
                style={{
                  borderColor: accent,
                  background: ev.highlight ? accent : "var(--color-paper)",
                  color: ev.highlight ? "white" : accent,
                }}
              >
                {ev.icon || (idx + 1)}
              </span>

              <div
                className={`rounded-xl border p-4 transition-all ${
                  ev.highlight
                    ? "border-l-4 shadow-sm"
                    : "border-border hover:border-foreground/20"
                }`}
                style={
                  ev.highlight
                    ? { borderColor: accent, background: `color-mix(in oklab, ${accent} 5%, var(--color-card))` }
                    : undefined
                }
              >
                <div className="mb-1 flex flex-wrap items-baseline gap-2">
                  <span
                    className="font-serif text-xs font-semibold tracking-widest"
                    style={{ color: ev.highlight ? accent : "var(--color-muted-foreground)" }}
                  >
                    {ev.year}
                  </span>
                  <span className="font-serif text-base font-semibold text-foreground">
                    {ev.title}
                  </span>
                </div>
                {ev.description && (
                  <p className="mt-1.5 font-serif text-sm leading-relaxed text-foreground/80">
                    {ev.description}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
