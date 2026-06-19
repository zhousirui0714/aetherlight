import { useEffect, useState } from "react";
import { Heart, Share2, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchDailyPush } from "@/lib/daily-push.functions";
import { toast } from "sonner";

type DailyPush = { date: string; title: string; body: string; source_note: string | null };

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function chineseDate(d: Date) {
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export function DailyCard() {
  const [date, setDate] = useState<Date>(new Date());
  const [data, setData] = useState<DailyPush | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favored, setFavored] = useState(false);

  const load = async (d: Date) => {
    setLoading(true);
    setError(null);
    setFavored(false);
    try {
      const res = await fetchDailyPush({ data: { date: fmtDate(d) } });
      setData(res);
      // check favorite
      const { data: session } = await supabase.auth.getSession();
      if (session.session?.user) {
        const { data: fav } = await supabase
          .from("favorites")
          .select("id")
          .eq("user_id", session.session.user.id)
          .eq("item_type", "daily")
          .eq("item_id", res.date)
          .maybeSingle();
        setFavored(!!fav);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "撷取失败");
    } finally {
      setLoading(false);
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
    if (!session.session?.user) {
      toast("请先登录", { description: "登录后即可收藏每日推送" });
      return;
    }
    if (!data) return;
    if (favored) {
      await supabase.from("favorites").delete()
        .eq("user_id", session.session.user.id)
        .eq("item_type", "daily")
        .eq("item_id", data.date);
      setFavored(false);
    } else {
      await supabase.from("favorites").insert({
        user_id: session.session.user.id,
        item_type: "daily",
        item_id: data.date,
        title: data.title,
        snippet: data.body.slice(0, 120),
      });
      setFavored(true);
      toast("已收入卷轴");
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
    <section className="scroll-in">
      <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
        <button onClick={() => shift(-1)} className="flex items-center gap-1 rounded-full px-2 py-1 hover:bg-secondary">
          <ChevronLeft className="h-4 w-4" /> 昨日
        </button>
        <span className="font-serif tracking-widest">{chineseDate(date)}</span>
        <button
          onClick={() => shift(1)}
          disabled={fmtDate(date) === fmtDate(new Date())}
          className="flex items-center gap-1 rounded-full px-2 py-1 hover:bg-secondary disabled:opacity-30"
        >
          明日 <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <article className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-[0_10px_40px_-20px_rgba(0,0,0,0.3)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-40"
          style={{ background: "radial-gradient(closest-side, var(--color-cinnabar), transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 -bottom-12 h-48 w-48 rounded-full opacity-25"
          style={{ background: "radial-gradient(closest-side, var(--color-bronze), transparent 70%)" }}
        />

        {loading && (
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 p-10">
            <div className="relative h-16 w-16">
              <span className="absolute inset-0 rounded-full bg-foreground/20 ink-bloom" />
              <span className="absolute inset-2 rounded-full bg-foreground/30 ink-bloom" style={{ animationDelay: "0.4s" }} />
            </div>
            <p className="font-serif text-sm text-muted-foreground tracking-widest">撷取时光中...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 p-10 text-center">
            <p className="font-serif text-foreground">墨色未干,稍候再试</p>
            <p className="text-xs text-muted-foreground">{error}</p>
            <button onClick={() => load(date)} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90">
              <RotateCw className="h-4 w-4" /> 重新撷取
            </button>
          </div>
        )}

        {!loading && !error && data && (
          <div className="relative p-7 sm:p-10">
            <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-px w-6 bg-border" />
              <span className="font-serif tracking-[0.3em]">每日撷光</span>
              <span className="h-px w-6 bg-border" />
            </div>
            <h2 className="font-serif text-3xl font-semibold leading-snug text-foreground brush-in">
              {data.title}
            </h2>
            <div className="my-6 flex h-32 items-center justify-center rounded-2xl border border-dashed border-border/70 bg-background/40">
              <span className="text-6xl opacity-70">墨</span>
            </div>
            <p className="whitespace-pre-line text-[15px] leading-loose text-foreground/85 font-sans">
              {data.body}
            </p>
            {data.source_note && (
              <p className="mt-6 text-xs italic text-muted-foreground">— {data.source_note}</p>
            )}
            <div className="mt-7 flex items-center justify-end gap-2 border-t border-border/60 pt-4">
              <button
                onClick={toggleFavorite}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm transition ${
                  favored ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                <Heart className={`h-4 w-4 ${favored ? "fill-current" : ""}`} />
                {favored ? "已藏" : "收藏"}
              </button>
              <button onClick={share} className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm text-muted-foreground transition hover:bg-secondary">
                <Share2 className="h-4 w-4" /> 分享
              </button>
            </div>
          </div>
        )}
      </article>
    </section>
  );
}
