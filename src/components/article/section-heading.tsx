import type { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface Props {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  subtitle?: string;
  accent?: string;       // 强调色 (默认朱砂)
  watermark?: string;    // 右侧大水印字
  className?: string;
  trailing?: ReactNode;  // 右侧操作区
  id?: string;           // 锚点
}

/**
 * 详情页章节标题 — 统一设计语言
 * 左侧：竖向墨线 + 印章
 * 中央：标题 + 副标
 * 右侧：装饰 + 操作区
 */
export function SectionHeading({
  icon: Icon,
  emoji,
  title,
  subtitle,
  accent = "var(--color-cinnabar)",
  watermark,
  className = "",
  trailing,
  id,
}: Props) {
  return (
    <div
      id={id}
      className={`group relative mb-5 flex items-center gap-3 ${className}`}
    >
      {/* 左侧：竖线 + 印章 */}
      <div className="flex flex-col items-center gap-1.5">
        <span
          aria-hidden
          className="block h-7 w-1.5 rounded-sm"
          style={{ background: accent, opacity: 0.7 }}
        />
        <span
          className="flex h-6 w-6 items-center justify-center rounded-sm text-[11px] font-serif font-bold text-white"
          style={{ background: accent }}
        >
          {Icon ? <Icon className="h-3.5 w-3.5" /> : (emoji || "溯")}
        </span>
      </div>

      {/* 中央：标题 + 副标 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-3">
          <h2 className="font-serif text-xl font-semibold tracking-wider text-foreground">
            {title}
          </h2>
          {subtitle && (
            <span className="font-serif text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* 右侧：操作区 */}
      {trailing && <div className="shrink-0">{trailing}</div>}

      {/* 右侧大水印 */}
      {watermark && (
        <span
          aria-hidden
          className="pointer-events-none absolute -right-2 -top-3 select-none font-serif text-[64px] font-bold opacity-[0.04]"
          style={{ color: accent, writingMode: "horizontal-tb" }}
        >
          {watermark}
        </span>
      )}

      {/* 底部墨线 */}
      <span
        aria-hidden
        className="absolute bottom-0 left-0 h-px w-full opacity-30"
        style={{
          background: `linear-gradient(to right, ${accent} 0%, ${accent}66 40%, transparent 100%)`,
        }}
      />
    </div>
  );
}
