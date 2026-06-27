import { useEffect, useState } from "react";
import { Heart, Share2, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchDailyPush } from "@/lib/daily-push.functions";
import { toast } from "sonner";

type DailyPush = { date: string; title: string; body: string; source_note: string | null; image_prompt?: string };

function fmtDate(d: Date) { return d.toISOString().slice(0, 10); }
function chineseDate(d: Date) {
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}

export function DailyCard() {
  const [date, setDate] = useState<Date>(new Date());
  const [data, setData] = useState<DailyPush | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favored, setFavored] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const load = async (d: Date) => {
    setLoading(true); setError(null); setFavored(false); setImageUrl(null); setImageError(false);
    try {
      const res = await fetchDailyPush({ data: { date: fmtDate(d) } });
      setData(res);

      // 使用 search-image API 获取真实图片
      setImageLoading(true);
      try {
        const query = encodeURIComponent(`${res.title} 中国传统文化`);
        const imgResponse = await fetch(`/api/search-image?q=${query}`);
        const imgData = await imgResponse.json();
        if (imgData.url) {
          setImageUrl(imgData.url);
        }
      } catch (imgErr) {
        console.error("获取图片失败:", imgErr);
      } finally {
        setImageLoading(false);
      }

      // 检查收藏状态
      const { data: session } = await supabase.auth.getSession();
      if (session.session?.user) {
        const { data: fav } = await supabase
          .from("favorites").select("id")
          .eq("user_id", session.session.user.id)
          .eq("item_type", "daily").eq("item_id", res.date).maybeSingle();
        setFavored(!!fav);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "撷取失败");
    } finally { setLoading(false); }
  };

  const handleImageError = () => {
    setImageError(true);
    // 尝试使用备用图片搜索
    if (data) {
      const backupQuery = encodeURIComponent(`传统文化 ${data.date}`);
      fetch(`/api/search-image?q=${backupQuery}`)
        .then(r => r.json())
        .then(imgData => {
          if (imgData.url) setImageUrl(imgData.url);
        })
        .catch(() => {});
    }
  };

  useEffect(() => { load(date); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [date]);

  const shift = (delta: number) => {
    const nd = new Date(date);
    nd.setDate(nd.getDate() + delta);
    if (nd > new Date()) return;
    setDate(nd);
  };

  const toggleFavorite = async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) { toast("请先登录"); return; }
    if (!data) return;
    if (favored) {
      await supabase.from("favorites").delete()
        .eq("user_id", session.session.user.id)
        .eq("item_type", "daily").eq("item_id", data.date);
      setFavored(false);
    } else {
      await supabase.from("favorites").insert({
        user_id: session.session.user.id, item_type: "daily", item_id: data.date,
        title: data.title, snippet: data.body.slice(0, 120),
      });
      setFavored(true); toast("已收入卷轴");
    }
  };

  const share = async () => {
    if (!data) return;
    const text = `${data.title}\n\n${data.body}\n\n— 溯光 · 每日文化`;
    try {
      if (navigator.share) await navigator.share({ title: data.title, text });
      else { await navigator.clipboard.writeText(text); toast("已复制到剪贴板"); }
    } catch {}
  };

  return (
    <section className="relative">
      {/* date switcher */}
      <div className="mb-5 flex items-center justify-center gap-6 text-sm text-muted-foreground">
        <button onClick={() => shift(-1)} className="flex items-center gap-1 rounded-full px-3 py-1.5 hover:bg-secondary">
          <ChevronLeft className="h-4 w-4" /> 昨日
        </button>
        <div className="text-center">
          <div className="font-serif text-xs tracking-[0.4em] text-accent">每 日 撷 光</div>
          <div className="mt-1 font-serif tracking-widest text-foreground">{chineseDate(date)}</div>
        </div>
        <button
          onClick={() => shift(1)}
          disabled={fmtDate(date) === fmtDate(new Date())}
          className="flex items-center gap-1 rounded-full px-3 py-1.5 hover:bg-secondary disabled:opacity-30"
        >
          明日 <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <article className="relative mx-auto max-w-[960px] overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_30px_80px_-40px_rgba(0,0,0,0.35)]">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-30"
          style={{ background: "radial-gradient(closest-side, var(--color-cinnabar), transparent 70%)" }} />
        <div aria-hidden className="pointer-events-none absolute -left-24 -bottom-20 h-72 w-72 rounded-full opacity-20"
          style={{ background: "radial-gradient(closest-side, var(--color-bronze), transparent 70%)" }} />

        {loading && (
          <div className="flex min-h-[420px] flex-col items-center justify-center gap-5 p-12">
            <div className="relative h-20 w-20">
              <span className="absolute inset-0 rounded-full bg-foreground/20 ink-bloom" />
              <span className="absolute inset-2 rounded-full bg-foreground/30 ink-bloom" style={{ animationDelay: "0.4s" }} />
              <span className="absolute inset-5 rounded-full bg-foreground/40 ink-bloom" style={{ animationDelay: "0.8s" }} />
            </div>
            <p className="font-serif text-sm text-muted-foreground tracking-[0.4em]">撷 取 时 光 中</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 p-12 text-center">
            <p className="font-serif text-lg text-foreground">墨色未干，稍候再试</p>
            <p className="text-xs text-muted-foreground">{error}</p>
            <button onClick={() => load(date)} className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground hover:opacity-90">
              <RotateCw className="h-4 w-4" /> 重新撷取
            </button>
          </div>
        )}

        {!loading && !error && data && (
          <div className="relative grid gap-10 p-10 md:grid-cols-[1fr_320px] md:p-14">
            <div className="min-w-0">
              <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px w-8 bg-border" />
                <span className="font-serif tracking-[0.3em] text-accent">今 日 文 化</span>
              </div>
              <h1 className="font-serif text-4xl font-semibold leading-snug text-foreground brush-in md:text-5xl">
                {data.title}
              </h1>
              <p className="mt-7 whitespace-pre-line text-[15px] leading-[2] text-foreground/85">
                {data.body}
              </p>
              {data.source_note && (
                <p className="mt-6 text-xs italic text-muted-foreground">— {data.source_note}</p>
              )}
              <div className="mt-8 flex items-center gap-2 border-t border-border/60 pt-5">
                <button
                  onClick={toggleFavorite}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm transition ${
                    favored ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <Heart className={`h-4 w-4 ${favored ? "fill-current" : ""}`} />
                  {favored ? "已藏" : "收藏"}
                </button>
                <button onClick={share} className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm text-muted-foreground transition hover:bg-secondary">
                  <Share2 className="h-4 w-4" /> 分享
                </button>
              </div>
            </div>

            {/* illustration column */}
            <div className="hidden md:flex">
              {imageLoading ? (
                <div className="flex w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border/70 bg-gradient-to-br from-background/40 via-secondary/50 to-background/40">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                    <span className="text-xs text-muted-foreground">生成图片中...</span>
                  </div>
                </div>
              ) : imageUrl ? (
                <div className="relative flex w-full items-center justify-center overflow-hidden rounded-2xl border border-border/70 shadow-lg">
                  <img
                    src={imageUrl}
                    alt={data.title}
                    className="h-[320px] w-full object-cover"
                    loading="lazy"
                    onError={handleImageError}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
                </div>
              ) : (
                <div className="relative flex w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border/70 bg-gradient-to-br from-background/40 via-secondary/50 to-background/40">
                  <div className="absolute inset-0 opacity-30" style={{
                    background:
                      "radial-gradient(circle at 30% 30%, var(--color-bronze) 0%, transparent 40%), radial-gradient(circle at 70% 70%, var(--color-cinnabar) 0%, transparent 45%)",
                  }} />
                  <div className="relative text-center">
                    <div className="font-serif text-[140px] leading-none text-foreground/85 select-none">
                      {data.title.slice(0, 1)}
                    </div>
                    <div className="mt-2 font-serif text-xs tracking-[0.5em] text-muted-foreground">
                      AETHERLIGHT
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </article>
    </section>
  );
}
