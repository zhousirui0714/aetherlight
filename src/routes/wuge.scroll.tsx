import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listCreations } from "@/lib/creation-storage";
import { getJourney, getJourneyStats, type JourneyEvent, type UserJourney } from "@/lib/journey-storage";
import { loadAllFavorites, type FavoriteItem } from "@/lib/favorites-storage";
import { getMyAnnotations, type Annotation } from "@/lib/annotation-storage";
import {
  CalendarDays, Flame, Clock, BookMarked, BookOpen, Sparkles, ArrowRight, LogOut, Loader2, Compass,
} from "lucide-react";

export const Route = createFileRoute("/wuge/scroll")({
  head: () => ({ meta: [{ title: "我的书卷 · 吾阁" }] }),
  component: ScrollPage,
});

function ScrollPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [joinedAt, setJoinedAt] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  const [explored, setExplored] = useState({ articles: 0, dialogues: 0, quizzes: 0, creations: 0, favorites: 0, notes: 0 });
  const [readingMinutes, setReadingMinutes] = useState(0);
  const [recentEvents, setRecentEvents] = useState<JourneyEvent[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) return;
      setEmail(user.email ?? null);
      setJoinedAt(user.created_at ?? null);

      // 头像 + 昵称
      const { data: profile } = await supabase
        .from("profiles")
        .select("nickname, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      setNickname(profile?.nickname ?? user.email?.split("@")[0] ?? "雅士");
      setAvatarUrl(profile?.avatar_url ?? null);

      // 并行拉所有数据
      const [journey, favorites, notes, creations] = await Promise.all([
        getJourney(),
        loadAllFavorites().catch(() => [] as FavoriteItem[]),
        getMyAnnotations().catch(() => [] as Annotation[]),
        listCreations(),
      ]);

      setStreak(journey.streak);
      setTotalDays(journey.totalDays);
      const stats = getJourneyStats(journey.events);
      setExplored({
        articles: stats.articlesRead,
        dialogues: stats.dialoguesHad,
        quizzes: stats.quizzesDone,
        creations: stats.creationsMade,
        favorites: favorites.length,
        notes: notes.length,
      });
      setRecentEvents(journey.events.slice(0, 6));

      // 累计学习时长估算: 每篇文章 3 分钟,每次对话 5 分钟,每次答题 2 分钟
      const minutes = stats.articlesRead * 3 + stats.dialoguesHad * 5 + stats.quizzesDone * 2 + creations.length * 4;
      setReadingMinutes(minutes);

      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-cinnabar" />
        <p className="mt-3 font-serif text-sm text-foreground/50">正在展开书卷…</p>
      </div>
    );
  }

  if (!email) {
    return <LoggedOut onLogin={() => navigate({ to: "/auth" })} />;
  }

  const joined = joinedAt ? new Date(joinedAt) : null;
  const daysSince = joined
    ? Math.max(0, Math.floor((Date.now() - joined.getTime()) / 86400000))
    : 0;
  const initials = (nickname || "雅").charAt(0);

  return (
    <div className="space-y-6">
      {/* 顶部卷轴横幅: 头像 + 昵称 + 关键数据 */}
      <section className="relative overflow-hidden rounded-sm border border-cinnabar/15 bg-gradient-to-br from-[#faf6ec] via-[#f5ecd6] to-[#f4ecdc] p-6 shadow-[0_2px_20px_rgba(139,69,19,0.06)] md:p-8 dark:from-[#3a3024] dark:via-[#2f2820] dark:to-[#2a241c]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.05]" aria-hidden>
          <svg viewBox="0 0 800 300" preserveAspectRatio="none" width="100%" height="100%">
            <path d="M 0 220 Q 200 180 400 200 T 800 190 L 800 300 L 0 300 Z" fill="#1a1a1a" />
          </svg>
        </div>
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-5">
            {avatarUrl ? (
              <img src={avatarUrl} alt={nickname} className="h-20 w-20 rounded-full border-2 border-cinnabar/30 object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-cinnabar/30 bg-cinnabar/10 font-serif text-3xl text-cinnabar">
                {initials}
              </div>
            )}
            <div>
              <div className="font-serif text-xs tracking-[0.4em] text-cinnabar/70">雅 士</div>
              <h2 className="mt-1 font-serif text-2xl tracking-wider text-foreground md:text-3xl">{nickname}</h2>
              <p className="mt-0.5 text-xs text-foreground/50">{email}</p>
            </div>
          </div>

          <div className="md:ml-auto grid grid-cols-3 gap-3 md:gap-4">
            <Stat
              icon={<CalendarDays className="h-4 w-4" />}
              label="加入天数"
              value={daysSince}
              suffix="日"
            />
            <Stat
              icon={<Flame className="h-4 w-4 text-orange-500" />}
              label="连续学习"
              value={streak}
              suffix="日"
              highlight
            />
            <Stat
              icon={<Clock className="h-4 w-4" />}
              label="累计时长"
              value={readingMinutes >= 60 ? Math.round(readingMinutes / 6) / 10 : readingMinutes}
              suffix={readingMinutes >= 60 ? "小时" : "分钟"}
            />
          </div>
        </div>
      </section>

      {/* 已探索知识: 6 宫格 */}
      <section>
        <h3 className="mb-3 flex items-center gap-2 font-serif text-sm tracking-[0.3em] text-foreground/70">
          <Compass className="h-3.5 w-3.5 text-cinnabar" strokeWidth={1.8} />
          已 探 索 知 识
        </h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <ExploredCard to="/wuge/growth"  icon={<BookOpen className="h-4 w-4" />}    label="阅 读"      value={explored.articles} unit="篇" />
          <ExploredCard to="/wuge/growth"  icon={<Sparkles className="h-4 w-4" />}   label="对 话"      value={explored.dialogues} unit="次" />
          <ExploredCard to="/wuge/growth"  icon={<Compass className="h-4 w-4" />}    label="答 题"      value={explored.quizzes} unit="次" />
          <ExploredCard to="/wuge/library" icon={<BookMarked className="h-4 w-4" />}  label="藏 书"      value={explored.favorites} unit="卷" />
          <ExploredCard to="/wuge/notes"   icon={<Sparkles className="h-4 w-4" />}   label="笔 记"      value={explored.notes} unit="则" />
          <ExploredCard to="/wuge/growth"  icon={<Sparkles className="h-4 w-4" />}   label="创 作"      value={explored.creations} unit="件" />
        </div>
      </section>

      {/* 学习概览: 最近足迹 */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-serif text-sm tracking-[0.3em] text-foreground/70">
            <Clock className="h-3.5 w-3.5 text-cinnabar" strokeWidth={1.8} />
            近 日 足 迹
          </h3>
          <Link
            to="/wuge/growth"
            className="font-serif text-xs tracking-[0.3em] text-cinnabar/70 hover:text-cinnabar"
          >
            查 看 全 貌 →
          </Link>
        </div>
        <div className="relative rounded-sm border border-cinnabar/15 bg-[#faf6ec]/80 p-5 md:p-6 dark:bg-[#3a3024]/60">
          {recentEvents.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <BookOpen className="h-8 w-8 text-foreground/20" strokeWidth={1.5} />
              <p className="font-serif text-sm text-foreground/50">尚无足迹,前往首页开始探索</p>
              <Link
                to="/"
                className="mt-2 inline-flex items-center gap-1 rounded-full border border-cinnabar/30 px-4 py-1.5 font-serif text-xs tracking-[0.3em] text-cinnabar hover:bg-cinnabar/5"
              >
                去 探 索 <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            <ol className="space-y-3">
              {recentEvents.map((e) => (
                <li key={e.id} className="flex items-start gap-3">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cinnabar/60" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-serif text-sm text-foreground/90">{e.title}</span>
                      <span className="font-serif text-[10px] tracking-[0.2em] text-foreground/40">
                        {e.category}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-foreground/55">{e.description}</p>
                  </div>
                  <span className="shrink-0 font-serif text-[10px] tracking-wider text-foreground/40">
                    {formatTime(e.timestamp)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* 退出登录 */}
      <button
        onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); }}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card py-2.5 text-sm text-muted-foreground hover:text-destructive"
      >
        <LogOut className="h-4 w-4" /> 退出登录
      </button>
    </div>
  );
}

function Stat({ icon, label, value, suffix, highlight }: { icon: React.ReactNode; label: string; value: number; suffix?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-sm border px-3 py-2.5 text-center md:px-4 md:py-3 ${
      highlight ? "border-cinnabar/30 bg-cinnabar/5" : "border-cinnabar/15 bg-[#faf6ec]/60 dark:bg-[#3a3024]/40"
    }`}>
      <div className="mx-auto mb-1 flex items-center justify-center gap-1 text-foreground/55">{icon}<span className="text-[10px] tracking-[0.2em]">{label}</span></div>
      <div className="font-serif text-xl text-foreground md:text-2xl">
        {value}
        {suffix && <span className="ml-0.5 text-xs text-foreground/55">{suffix}</span>}
      </div>
    </div>
  );
}

function ExploredCard({ to, icon, label, value, unit }: { to: any; icon: React.ReactNode; label: string; value: number; unit: string }) {
  return (
    <Link
      to={to}
      className="group rounded-sm border border-cinnabar/15 bg-[#faf6ec]/60 p-4 text-center transition hover:border-cinnabar/40 hover:bg-cinnabar/5 dark:bg-[#3a3024]/40"
    >
      <div className="mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-cinnabar/10 text-cinnabar transition group-hover:scale-110">
        {icon}
      </div>
      <div className="font-serif text-2xl text-foreground">
        {value}<span className="ml-0.5 text-[10px] text-foreground/50">{unit}</span>
      </div>
      <div className="mt-0.5 font-serif text-[10px] tracking-[0.3em] text-foreground/55">{label}</div>
    </Link>
  );
}

function LoggedOut({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <div className="seal text-base">溯光</div>
      <h2 className="font-serif text-xl">尚未结缘</h2>
      <p className="text-sm text-muted-foreground">登录后即可拥有你的「吾阁」</p>
      <button
        onClick={onLogin}
        className="rounded-full bg-cinnabar px-6 py-2 text-sm text-[#faf5e8] hover:opacity-90"
      >
        登录 / 注册
      </button>
    </div>
  );
}

function formatTime(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m} 分钟前`;
  if (h < 24) return `${h} 小时前`;
  if (d < 30) return `${d} 天前`;
  return new Date(ts).toLocaleDateString("zh-CN");
}
