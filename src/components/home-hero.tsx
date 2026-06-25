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

// 4 张水墨主题种子（用于 picsum 兜底）
const SUUGUANG_SEEDS = ["sumi-mountain", "sumi-river", "sumi-pine", "sumi-pavilion"];

function hashDate(date: Date): number {
  const dayKey = date.toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < dayKey.length; i++) hash = (hash * 31 + dayKey.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

function pickSupabaseByDate(date: Date): string {
  return HOME_FALLBACK_IMAGES[hashDate(date) % HOME_FALLBACK_IMAGES.length];
}

function picsumFallback(date: Date): string {
  const seed = SUUGUANG_SEEDS[hashDate(date) % SUUGUANG_SEEDS.length];
  return `https://picsum.photos/seed/${seed}-${date.toISOString().slice(0, 10)}/1920/1080`;
}

export function HomeHero() {
  const navigate = useNavigate();
  const [data, setData] = useState<DailyPush | null>(null);
  const [imageUrl, setImageUrl] = useState<string>(pickSupabaseByDate(new Date()));
  const [imageFailed, setImageFailed] = useState(false);
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
        // 失败 fallback
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleImageError = () => {
    if (!imageFailed) {
      setImageFailed(true);
      setImageUrl(picsumFallback(new Date()));
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (!q) return;
    setSearching(true);
    navigate({ to: "/search", search: { q } });
  };

  const handleScrollDown = () => {
    const next = document.querySelector('[data-section="civilization-map"]');
    if (next) next.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative h-[100vh] min-h-[680px] w-full overflow-hidden bg-background paper-texture">
      {/* 满屏背景图 */}
      <img
        src={imageUrl}
        alt=""
        onError={handleImageError}
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          // 把任何图调成"白天淡彩"宣纸感
          filter: "brightness(1.08) contrast(0.85) saturate(0.4) sepia(0.12)",
        }}
      />
      {/* 顶→底米白渐变蒙版：上方让图清晰，中央保证文字可读，底部图渐隐融入下方文明地图 */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/15 via-background/55 to-background/95" />

      {/* 中央文字内容（直接放，不放毛玻璃面板，保持宣纸留白调性） */}
      <div className="relative z-10 mx-auto flex h-full max-w-[1200px] flex-col items-center justify-center px-6 py-24">
        {/* 顶部 chip */}
        <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-foreground/15 bg-background/80 px-4 py-1.5 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-sm">
          <span
            className="flex h-4 w-4 items-center justify-center border border-rose-800/70 bg-rose-700/90 font-serif text-[9px] text-[#faf5e8]"
            style={{ borderRadius: "2px" }}
          >
            今
          </span>
          <span className="font-serif text-xs tracking-[0.3em] text-foreground/80">每日撷光</span>
          <span className="text-[11px] text-muted-foreground">
            {data ? chineseDate(new Date(data.date)) : chineseDate(new Date())}
          </span>
        </div>

        {/* 标题 - 全站三段式 */}
        <div className="text-center">
          <div className="font-serif text-xs tracking-[0.4em] text-accent">EXPLORE BY AETHERLIGHT</div>
          <h1 className="mt-3 font-serif text-4xl text-foreground md:text-5xl lg:text-6xl">
            {data?.title || "探索中华文明"}
          </h1>
          {data?.body ? (
            <p className="mx-auto mt-4 max-w-2xl text-sm text-foreground/75 md:text-base line-clamp-3">
              {data.body}
            </p>
          ) : (
            <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground md:text-base">
              故事 → 分类 → 问题 → 知识 → 对话 · 五种方式穿越五千年
            </p>
          )}
          {data?.source_note && (
            <p className="mt-2 text-xs italic text-accent/80">— {data.source_note}</p>
          )}
        </div>

        {/* 搜索框 - 宣纸卡 + 朱砂按钮 */}
        <form
          onSubmit={handleSearch}
          className="mt-8 flex w-full max-w-2xl items-center gap-2 rounded-full border border-stone-300/60 bg-background/85 p-1.5 shadow-[0_1px_0_rgba(0,0,0,0.02)] backdrop-blur-sm transition-all focus-within:border-stone-500/70 focus-within:shadow-md"
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
            className="inline-flex items-center gap-1.5 rounded-full border border-rose-800 bg-rose-700/90 px-5 py-2 font-serif text-sm tracking-[0.15em] text-[#faf5e8] transition hover:bg-rose-800 hover:border-rose-900 disabled:opacity-50"
          >
            {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "探索中华文明"}
            {!searching && <Search className="h-3.5 w-3.5" />}
          </button>
        </form>

        {/* 推荐关键词 - 8 个朱砂小方印 */}
        <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-3">
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
              <span className="text-[11px] text-foreground/70 transition group-hover:text-rose-800">{kw}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 右下：题款 + 朱砂小印 */}
      <div className="absolute bottom-8 right-8 z-10 hidden flex-col items-end gap-2 md:flex">
        <div className="font-serif text-sm tracking-widest text-foreground/80">
          夏日山居图 · 南宋
        </div>
        <div
          className="flex h-8 w-8 items-center justify-center border border-rose-800/70 bg-rose-700/90 font-serif text-xs text-[#faf5e8] shadow-[0_2px_6px_rgba(180,40,40,0.35)]"
          style={{ borderRadius: "2px" }}
        >
          光
        </div>
      </div>

      {/* 滚动提示 */}
      <button
        onClick={handleScrollDown}
        className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 font-serif text-xs tracking-[0.3em] text-foreground/65 transition hover:text-foreground"
      >
        <span>向下 · 探索文明地图</span>
        <ChevronDown className="h-4 w-4 animate-bounce" />
      </button>
    </section>
  );
}
