import { Sparkles, Loader2 } from "lucide-react";

interface HeroBlockProps {
  title: string;
  excerpt: string;
  categoryLabel: string;
  subCategory?: string;
  tags?: string[];
  cover?: string;             // emoji
  coverUrl?: string;          // AI 水墨配图
  dynasty?: string;
  era?: string;
  region?: string;
  author?: string;
  favorites?: number;
  viewCount?: number;
  heroHint?: string;
  seal?: string;              // 印章字
  accent?: string;            // 主色
  accent2?: string;           // 副色
  aiSummary?: string;         // AI 一句话摘要
  aiLoading?: boolean;        // AI 摘要加载中
}

/**
 * 详情页 Hero — 统一基础结构
 * 顶栏：分类 + 子分类 + 标签 + 收藏数
 * 中部：标题 + AI 一句话摘要
 * 装饰：水墨插画（coverUrl 优先，否则 emoji）
 */
export function HeroBlock({
  title,
  excerpt,
  categoryLabel,
  subCategory,
  tags = [],
  cover = "📜",
  coverUrl,
  dynasty,
  era,
  region,
  author,
  favorites,
  viewCount,
  heroHint,
  seal = "溯",
  accent = "var(--color-cinnabar)",
  accent2 = "#E8D8B0",
  aiSummary,
  aiLoading = false,
}: HeroBlockProps) {
  return (
    <section
      className="relative mb-10 overflow-hidden rounded-3xl border border-border"
      style={{
        background: `linear-gradient(135deg, var(--color-paper) 0%, color-mix(in oklab, ${accent2} 60%, var(--color-paper)) 100%)`,
      }}
    >
      {/* 装饰底纹：左下水墨晕染 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 50% 50% at 20% 80%, color-mix(in oklab, ${accent} 8%, transparent), transparent 60%), radial-gradient(ellipse 40% 40% at 90% 10%, color-mix(in oklab, ${accent} 6%, transparent), transparent 60%)`,
        }}
      />
      {/* 右侧大水印字 */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-4 select-none font-serif text-[180px] font-bold leading-none opacity-[0.06]"
        style={{ color: accent, writingMode: "vertical-rl", letterSpacing: "0.1em" }}
      >
        {seal}
      </span>

      <div className="relative grid grid-cols-1 gap-6 p-6 md:grid-cols-[1fr_280px] md:gap-8 md:p-10">
        {/* 左侧：标题 + 摘要 + 标签 */}
        <div className="flex min-w-0 flex-col">
          {/* 顶部分类标签 */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-3 py-1 font-serif text-xs font-semibold tracking-widest text-white"
              style={{ background: accent }}
            >
              {categoryLabel}
            </span>
            {subCategory && (
              <span className="rounded-full border border-border bg-background/80 px-3 py-1 font-serif text-xs tracking-widest text-muted-foreground">
                · {subCategory} ·
              </span>
            )}
            {tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded border border-border bg-background/60 px-2 py-0.5 font-serif text-[10px] tracking-widest text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* 标题 */}
          <h1 className="font-serif text-3xl font-semibold leading-tight tracking-wide text-foreground md:text-5xl">
            {title}
          </h1>

          {/* Hero 副标 */}
          {heroHint && (
            <p className="mt-3 font-serif text-sm italic tracking-wider text-muted-foreground">
              — {heroHint} —
            </p>
          )}

          {/* AI 一句话摘要 */}
          <div
            className="mt-5 flex items-start gap-2.5 rounded-xl border-l-4 bg-background/70 px-4 py-3 backdrop-blur-sm"
            style={{ borderColor: accent }}
          >
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accent }} />
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                <span>AI · 一句话概览</span>
                {aiLoading && <Loader2 className="h-3 w-3 animate-spin" />}
              </div>
              <p className="font-serif text-sm leading-relaxed text-foreground/85">
                {aiSummary || aiLoading ? aiSummary || "AI 正在为你提炼…" : excerpt}
              </p>
            </div>
          </div>

          {/* 元信息行 */}
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {author && !/溯光|编辑部|蜀光|水墨编辑部/.test(author) && (
              <span className="flex items-center gap-1">
                <span className="font-serif text-[10px] tracking-widest text-muted-foreground/60">著</span>
                <b className="font-serif text-foreground/80">{author}</b>
              </span>
            )}
            {dynasty && (
              <span className="flex items-center gap-1">
                <span className="font-serif text-[10px] tracking-widest text-muted-foreground/60">代</span>
                <b className="font-serif text-foreground/80">{dynasty}</b>
              </span>
            )}
            {era && dynasty !== era && (
              <span className="flex items-center gap-1">
                <span className="font-serif text-[10px] tracking-widest text-muted-foreground/60">纪元</span>
                <b className="font-serif text-foreground/80">{era}</b>
              </span>
            )}
            {region && (
              <span className="flex items-center gap-1">
                <span className="font-serif text-[10px] tracking-widest text-muted-foreground/60">地</span>
                <b className="font-serif text-foreground/80">{region}</b>
              </span>
            )}
            {favorites != null && (
              <span className="flex items-center gap-1">
                <span className="font-serif text-[10px] tracking-widest text-muted-foreground/60">藏</span>
                <b className="font-serif text-foreground/80">{favorites.toLocaleString()}</b>
              </span>
            )}
            {viewCount != null && (
              <span className="flex items-center gap-1">
                <span className="font-serif text-[10px] tracking-widest text-muted-foreground/60">阅</span>
                <b className="font-serif text-foreground/80">{viewCount.toLocaleString()}</b>
              </span>
            )}
          </div>
        </div>

        {/* 右侧：封面 / 配图 */}
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-border bg-secondary shadow-md md:aspect-[4/3]">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              loading="eager"
            />
          ) : (
            <div
              className="relative h-full w-full"
              style={{
                background: `linear-gradient(135deg, ${accent2} 0%, color-mix(in oklab, ${accent} 25%, ${accent2}) 100%)`,
              }}
            >
              {/* 大字 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="text-8xl drop-shadow-lg md:text-9xl"
                  style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.15))" }}
                >
                  {cover}
                </span>
              </div>
              {/* 装饰墨点 */}
              <div
                aria-hidden
                className="absolute inset-0 opacity-30"
                style={{
                  background: `radial-gradient(circle at 30% 20%, color-mix(in oklab, ${accent} 30%, transparent), transparent 40%)`,
                }}
              />
            </div>
          )}
          {/* 角章 */}
          <span
            className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-sm font-serif text-xs font-bold text-white shadow-md"
            style={{ background: accent }}
            aria-hidden
          >
            {seal}
          </span>
        </div>
      </div>
    </section>
  );
}
