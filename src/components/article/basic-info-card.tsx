import { User, MapPin, Calendar, BookOpen, Crown, Feather, Building, Beaker, ScrollText, Tag } from "lucide-react";
import { SectionHeading } from "./section-heading";

interface InfoItem {
  icon: React.ReactNode;
  label: string;
  value: string;
  /** 高亮显示 */
  primary?: boolean;
}

interface BasicInfoCardProps {
  items: InfoItem[];
  title?: string;          // 卡片标题 (默认"基础信息")
  accent?: string;
  columns?: 2 | 3 | 4;
}

/**
 * 详情页基础信息卡 — 适用于人物/建筑/节日/典籍等
 * 按列均匀排布，每项有 icon + label + value
 */
export function BasicInfoCard({
  items,
  title = "基础信息",
  accent = "var(--color-cinnabar)",
  columns = 2,
}: BasicInfoCardProps) {
  if (!items || items.length === 0) return null;
  const colClass =
    columns === 4
      ? "grid-cols-2 md:grid-cols-4"
      : columns === 3
        ? "grid-cols-2 md:grid-cols-3"
        : "grid-cols-1 md:grid-cols-2";

  return (
    <section className="mb-8">
      <SectionHeading
        icon={ScrollText}
        title={title}
        watermark="基"
        accent={accent}
      />
      <div className={`grid gap-3 ${colClass}`}>
        {items.map((item, i) => (
          <div
            key={i}
            className="group relative flex items-start gap-3 overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:border-foreground/20 hover:shadow-sm"
          >
            {/* 左侧 icon 方块 */}
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
              style={{
                background: `color-mix(in oklab, ${accent} 10%, transparent)`,
                color: accent,
              }}
            >
              {item.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 font-serif text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                {item.label}
              </div>
              <div
                className={`font-serif text-sm leading-snug ${item.primary ? "text-base font-semibold" : "text-foreground/85"}`}
                style={item.primary ? { color: accent } : undefined}
              >
                {item.value}
              </div>
            </div>
            {/* 角纹 */}
            <span
              aria-hidden
              className="pointer-events-none absolute right-2 top-2 h-2 w-2 rounded-sm opacity-0 transition-opacity group-hover:opacity-100"
              style={{ background: accent }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

// 常用 icon 工厂
export const I = {
  user: <User className="h-4 w-4" />,
  map: <MapPin className="h-4 w-4" />,
  calendar: <Calendar className="h-4 w-4" />,
  book: <BookOpen className="h-4 w-4" />,
  crown: <Crown className="h-4 w-4" />,
  feather: <Feather className="h-4 w-4" />,
  building: <Building className="h-4 w-4" />,
  beaker: <Beaker className="h-4 w-4" />,
  tag: <Tag className="h-4 w-4" />,
};
