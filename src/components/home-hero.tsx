import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, ChevronDown, Loader2 } from "lucide-react";
import { fetchDailyPush } from "@/lib/daily-push.functions";
import { HOME_FALLBACK_IMAGES } from "@/lib/home-illustrations";

type DailyPush = { date: string; title: string; body: string; source_note: string | null; image_prompt?: string };

function fmtDate(d: Date) { return d.toISOString().slice(0, 10); }
function chineseDate(d: Date) {
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}

// 按日期种子从 4 张 AI 水墨图中选一张，保证同一天背景稳定
function pickFallbackByDate(date: Date): string {
  const dayKey = date.toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < dayKey.length; i++) hash = (hash * 31 + dayKey.charCodeAt(i)) | 0;
  return HOME_FALLBACK_IMAGES[Math.abs(hash) % HOME_FALLBACK_IMAGES.length];
}

export function HomeHero() {
  const navigate = useNavigate();
  const [data, setData] = useState<DailyPush | null>(null);
  const [imageUrl, setImageUrl] = useState<string>(pickFallbackByDate(new Date()));
  const [searchInput, setSearchInput] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const today = new Date();
        const res = await fetchDailyPush({ data: { date: fmtDate(today) } });
        if (!cancelled) setData(res);
      } catch (e) {
        // 失败 fallback 已设
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (!q) return;
    setSearching(true);
    navigate({ to: "/search", search: { q } });
  };

  const handleScrollDown = () => {
    // 滚到下方文明地图
    const next = document.querySelector('[data-section="civilization-map"]');
    if (next) {
      next.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollBy({ top: window.innerHeight * 0.95, behavior: "smooth" });
    }
  };

  return (
    <section className="relative w-full overflow-hidden bg-background paper-texture">
      {/* ① 顶部 70vh - 山水画卷（横长比例裁剪） */}
      <div className="relative h-[70vh] min-h-[480px] w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${imageUrl})`,
            // 把夜景水墨调成"白天淡彩"宣纸感
            filter: "brightness(1.15) contrast(0.85) saturate(0.5) sepia(0.15)",
          }}
        />
        {/* 70vh → 下方内容区的淡渐变过渡（让图自然过渡到宣纸底） */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background" />

        {/* 顶部：今日撷光印章 + 日期（贴图上，不与下方内容区重复） */}
        <div className="absolute left-1/2 top-20 z-10 -translate-x-1/2">
          <div className="inline-flex items-center gap-3 rounded-full border border-foreground/20 bg-background/80 px-5 py-2 backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.04)]">
            <span
              className="flex h-5 w-5 items-center justify-center border border-rose-800/70 bg-rose-700/90 font-serif text-[10px] text-[#faf5e8]"
              style={{ borderRadius: "2px" }}
            >
              今
            </span>
            <span className="font-serif text-sm tracking-[0.3em] text-foreground/80">每日撷光</span>
            <span className="text-xs text-muted-foreground">
              {data ? chineseDate(new Date(data.date)) : chineseDate(new Date())}
            </span>
          </div>
        </div>

        {/* 右下：题款 + 朱砂小印 */}
        <div className="absolute bottom-10 right-8 z-10 flex flex-col items-end gap-2 md:bottom-14 md:right-16">
          <div className="font-serif text-sm tracking-widest text-foreground/85 md:text-base drop-shadow-sm">
            夏日山居图 · 南宋
          </div>
          <div
            className="flex h-9 w-9 items-center justify-center border border-rose-800/70 bg-rose-700/90 font-serif text-sm text-[#faf5e8] shadow-[0_2px_6px_rgba(180,40,40,0.35)]"
            style={{ borderRadius: "2px" }}
          >
            光
          </div>
        </div>
      </div>

      {/* ② 下方内容区 - 标题 + 搜索 + chip + 滚动提示（与全站 1200px 容器一致） */}
      <div className="relative mx-auto max-w-[1200px] px-6 pb-20 pt-12 md:pt-16">
        {/* 章节标题 - 与全站三段式一致（EXPLORE / 中文 / 副标） */}
        <div className="mb-10 text-center">
          <div className="font-serif text-xs tracking-[0.4em] text-accent">EXPLORE BY AETHERLIGHT</div>
          <h1 className="mt-3 font-serif text-4xl text-foreground md:text-5xl">
            {data?.title || "探索中华文明"}
          </h1>
          {data?.body ? (
            <p className="mt-3 text-base text-muted-foreground md:text-lg line-clamp-2">
              {data.body}
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              故事 → 分类 → 问题 → 知识 → 对话 · 五种方式穿越五千年
            </p>
          )}
          {data?.source_note && (
            <p className="mt-2 text-xs italic text-accent/80">— {data.source_note}</p>
          )}
        </div>

        {/* 搜索框 - 宣纸卡 + 朱砂按钮（与全站卡片语言一致） */}
        <form
          onSubmit={handleSearch}
          className="mx-auto flex w-full max-w-2xl items-center gap-2 rounded-full border border-stone-300/60 bg-[#faf5e8]/80 p-2 shadow-[0_1px_0_rgba(0,0,0,0.02)] backdrop-blur-sm transition-all focus-within:border-stone-500/70 focus-within:shadow-md"
        >
          <div className="flex flex-1 items-center pl-5">
            <Search className="h-4 w-4 text-foreground/60" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="李白 / 端午节 / 山海经..."
              className="ml-3 w-full bg-transparent text-foreground placeholder:text-foreground/40 outline-none font-serif text-base"
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="inline-flex items-center gap-1.5 rounded-full border border-rose-800 bg-rose-700/90 px-6 py-2.5 font-serif text-sm tracking-[0.15em] text-[#faf5e8] transition hover:bg-rose-800 hover:border-rose-900 disabled:opacity-50"
          >
            {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "探索中华文明"}
            {!searching && <Search className="h-3.5 w-3.5" />}
          </button>
        </form>

        {/* 推荐关键词 - 8 个朱砂小方印（与 CivilizationMap 的 seal 风格一致） */}
        <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-4">
          {["李白", "诗经", "敦煌", "端午", "论语", "王阳明", "京剧", "山海经"].map((kw) => (
            <button
              key={kw}
              onClick={() => setSearchInput(kw)}
              className="group flex flex-col items-center gap-1.5 transition-transform hover:-translate-y-0.5"
            >
              <div
                className="flex h-8 w-8 items-center justify-center border border-rose-800/70 bg-rose-700/90 font-serif text-[13px] text-[#faf5e8] shadow-[0_1px_2px_rgba(180,40,40,0.3)] transition-all group-hover:border-rose-900 group-hover:bg-rose-800 group-hover:shadow-[0_2px_6px_rgba(180,40,40,0.45)]"
                style={{ borderRadius: "2px" }}
              >
                {kw[0]}
              </div>
              <span className="text-[11px] text-foreground/65 transition group-hover:text-rose-800">{kw}</span>
            </button>
          ))}
        </div>

        {/* 滚动提示 */}
        <div className="mt-14 flex justify-center md:mt-20">
          <button
            onClick={handleScrollDown}
            className="flex flex-col items-center gap-1 font-serif text-xs tracking-[0.3em] text-foreground/55 transition hover:text-foreground/85"
          >
            <span>向下 · 探索文明地图</span>
            <ChevronDown className="h-4 w-4 animate-bounce" />
          </button>
        </div>
      </div>
    </section>
  );
}
