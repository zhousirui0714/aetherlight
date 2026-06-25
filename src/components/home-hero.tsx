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
        if (cancelled) return;
        setData(res);
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

  return (
    <section className="relative h-[100vh] min-h-[640px] w-full overflow-hidden">
      {/* 背景图 */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
      {/* 渐变蒙版：底部更深以保证文字可读 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/80" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

      {/* 顶部：今日撷光印章 + 日期 */}
      <div className="relative z-10 flex flex-col items-center pt-20 text-white">
        <div className="inline-flex items-center gap-3 rounded-full border border-white/30 bg-black/20 px-5 py-2 backdrop-blur-md">
          <span className="seal text-xs">今</span>
          <span className="font-serif text-sm tracking-[0.3em]">每日撷光</span>
          <span className="text-xs text-white/70">
            {data ? chineseDate(new Date(data.date)) : chineseDate(new Date())}
          </span>
        </div>
      </div>

      {/* 中央内容 */}
      <div className="relative z-10 flex h-[calc(100vh-200px)] flex-col items-center justify-center px-6 text-center text-white">
        <h1 className="max-w-3xl font-serif text-4xl leading-tight text-white drop-shadow-2xl md:text-6xl lg:text-7xl">
          {data?.title || "探索中华文明"}
        </h1>
        {data?.body && (
          <p className="mt-6 max-w-2xl text-base text-white/90 drop-shadow-lg md:text-lg line-clamp-3">
            {data.body}
          </p>
        )}
        {data?.source_note && (
          <p className="mt-3 text-sm italic text-amber-200/90">— {data.source_note}</p>
        )}

        {/* 搜索框 */}
        <form
          onSubmit={handleSearch}
          className="mt-10 flex w-full max-w-2xl items-center gap-2 rounded-full border-2 border-white/40 bg-white/10 p-2 backdrop-blur-xl shadow-2xl"
        >
          <div className="flex flex-1 items-center pl-5">
            <Search className="h-5 w-5 text-white/80" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="李白 / 端午节 / 山海经..."
              className="ml-3 w-full bg-transparent text-white placeholder:text-white/60 outline-none font-serif text-lg"
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-7 py-3 font-serif text-sm tracking-[0.2em] text-white transition hover:bg-amber-700 disabled:opacity-50"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "探索中华文明"}
            {!searching && <Search className="h-4 w-4" />}
          </button>
        </form>

        {/* 推荐关键词 */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {["李白", "诗经", "敦煌", "端午", "论语", "王阳明", "京剧", "山海经"].map((kw) => (
            <button
              key={kw}
              onClick={() => setSearchInput(kw)}
              className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur-md transition hover:border-white hover:bg-white/20 hover:text-white"
            >
              {kw}
            </button>
          ))}
        </div>
      </div>

      {/* 滚动指示 */}
      <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-white/70">
        <div className="flex flex-col items-center gap-1 text-xs tracking-[0.3em] animate-bounce">
          <span>向下滚动</span>
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
    </section>
  );
}
