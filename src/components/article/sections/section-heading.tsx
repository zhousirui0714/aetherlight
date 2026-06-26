import type { LucideIcon } from "lucide-react";

interface SectionHeadingProps {
  /** 左侧图标（lucide-react） */
  icon: LucideIcon;
  /** 标题文本 */
  title: string;
  /** 右侧水印字符（单字） */
  watermark: string;
  /** 主题强调色（CSS 颜色值） */
  accent: string;
}

/**
 * 详情页章节标题
 * - 左侧图标 + 竖直强调线 + 标题
 * - 右侧超大半透明水印汉字
 */
export function SectionHeading({ icon: Icon, title, watermark, accent }: SectionHeadingProps) {
  return (
    <div className="relative mb-4 flex items-center gap-3 pl-2">
      <span
        className="block h-7 w-1 rounded-sm"
        style={{ background: accent }}
        aria-hidden
      />
      <Icon
        className="h-5 w-5"
        style={{ color: accent }}
        aria-hidden
      />
      <h2 className="font-serif text-xl font-semibold tracking-wider text-foreground">
        {title}
      </h2>
      <span
        className="pointer-events-none absolute -right-1 top-1/2 -translate-y-1/2 select-none font-serif text-[88px] font-bold leading-none text-foreground/[0.04] sm:text-[110px]"
        aria-hidden
      >
        {watermark}
      </span>
    </div>
  );
}
