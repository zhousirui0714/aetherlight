import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { getJourney, getJourneyStats, getMilestones, type JourneyEvent } from "@/lib/journey-storage";
import { loadAllFavorites, type FavoriteItem } from "@/lib/favorites-storage";
import { listCreations, type CreationItem } from "@/lib/creation-storage";
import {
  BookOpen,
  Heart,
  Palette,
  Flame,
  Trophy,
  Sparkles,
  Calendar,
  ChevronRight,
  MessageSquare,
  Image as ImageIcon,
  Music,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "学习仪表盘 · 溯光" }] }),
  component: DashboardPage,
});

interface ChallengeProgress {
  totalDays?: number;
  checkIns?: string[]; // YYYY-MM-DD
}

function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    articlesRead: 0,
    dialoguesHad: 0,
    quizzesDone: 0,
    creationsMade: 0,
    postsCreated: 0,
    favoritesAdded: 0,
  });
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [creations, setCreations] = useState<CreationItem[]>([]);
  const [events, setEvents] = useState<JourneyEvent[]>([]);
  const [streak, setStreak] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  const [challengeDays, setChallengeDays] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [journey, favs, cres] = await Promise.all([
          getJourney(),
          loadAllFavorites(),
          listCreations(),
        ]);
        setStats(getJourneyStats(journey.events));
        setEvents(journey.events.slice(0, 12));
        setStreak(journey.streak);
        setTotalDays(journey.totalDays);
        setEarnedBadges(journey.badges);
        setFavorites(favs);
        setCreations(cres);

        // 打卡数据
        try {
          const raw = localStorage.getItem("sukou_challenge_progress");
          if (raw) {
            const p = JSON.parse(raw) as ChallengeProgress;
            setChallengeDays(p.totalDays ?? p.checkIns?.length ?? 0);
          }
        } catch {}
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const milestones = getMilestones();
  const unlockedMilestones = milestones.filter((m) => earnedBadges.includes(m.id));
  const lockedMilestones = milestones.filter((m) => !earnedBadges.includes(m.id));

  return (
    <AppShell showSearch title="学习仪表盘">
      <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
        {/* 标题 */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="font-serif text-3xl text-foreground sm:text-4xl">学习仪表盘</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              你在文明长河中走过的足迹
            </p>
          </div>
          {!loading && (
            <div className="hidden sm:block text-right">
              <div className="text-xs text-muted-foreground">累计访问</div>
              <div className="font-serif text-2xl text-primary">{totalDays} 天</div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            <Sparkles className="mr-2 h-4 w-4 animate-pulse" /> 加载中…
          </div>
        ) : (
          <>
            {/* 核心 4 数据 */}
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              <StatCard
                icon={<BookOpen className="h-5 w-5" strokeWidth={1.6} />}
                value={stats.articlesRead}
                label="阅 读"
                color="text-foreground"
              />
              <StatCard
                icon={<Heart className="h-5 w-5" strokeWidth={1.6} />}
                value={favorites.length}
                label="收 藏"
                color="text-cinnabar"
              />
              <StatCard
                icon={<Palette className="h-5 w-5" strokeWidth={1.6} />}
                value={stats.creationsMade}
                label="创 作"
                color="text-foreground"
              />
              <StatCard
                icon={<MessageSquare className="h-5 w-5" strokeWidth={1.6} />}
                value={stats.dialoguesHad}
                label="问 答"
                color="text-foreground"
              />
            </div>

            {/* 连续打卡 + 累计 */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-cinnabar/10 text-cinnabar">
                  <Flame className="h-7 w-7" strokeWidth={1.6} />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">连续打卡</div>
                  <div className="font-serif text-3xl text-foreground">
                    {streak}
                    <span className="ml-1 text-base text-muted-foreground">天</span>
                  </div>
                </div>
                {streak >= 7 && (
                  <span className="rounded-full bg-cinnabar/15 px-2.5 py-0.5 font-serif text-[10px] tracking-wider text-cinnabar">
                    七日之约
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-foreground">
                  <Calendar className="h-7 w-7" strokeWidth={1.6} />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">诗词打卡</div>
                  <div className="font-serif text-3xl text-foreground">
                    {challengeDays}
                    <span className="ml-1 text-base text-muted-foreground">天</span>
                  </div>
                </div>
                <Link
                  to="/tongyou/challenge"
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground/70 transition hover:border-primary/30 hover:text-foreground"
                >
                  去打卡 →
                </Link>
              </div>
            </div>

            {/* 徽章 */}
            <section className="mb-8">
              <SectionTitle icon={<Trophy className="h-4 w-4" strokeWidth={1.6} />}>
                徽 章
              </SectionTitle>
              {unlockedMilestones.length === 0 && lockedMilestones.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card/50 px-4 py-10 text-center text-sm text-muted-foreground">
                  暂无徽章数据
                </div>
              ) : (
                <div className="space-y-3">
                  {unlockedMilestones.length > 0 && (
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                      {unlockedMilestones.map((m) => (
                        <div
                          key={m.id}
                          className="rounded-xl border border-cinnabar/30 bg-cinnabar/5 px-3 py-3 text-center"
                        >
                          <div className="text-2xl mb-1">{m.icon}</div>
                          <div className="font-serif text-sm text-foreground">{m.name}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                            {m.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {lockedMilestones.length > 0 && (
                    <details className="rounded-xl border border-dashed border-border bg-card/30">
                      <summary className="cursor-pointer px-4 py-2.5 text-xs text-muted-foreground transition hover:text-foreground">
                        尚未解锁 ({lockedMilestones.length}) · 点击查看
                      </summary>
                      <div className="grid grid-cols-2 gap-2.5 px-3 pb-3 sm:grid-cols-3 md:grid-cols-4">
                        {lockedMilestones.map((m) => (
                          <div
                            key={m.id}
                            className="rounded-xl border border-dashed border-border bg-background/30 px-3 py-3 text-center opacity-50"
                          >
                            <div className="text-2xl mb-1 grayscale">{m.icon}</div>
                            <div className="font-serif text-sm text-foreground/60">{m.name}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                              {m.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </section>

            {/* 收藏 + 创作 速览 */}
            <div className="mb-8 grid gap-4 md:grid-cols-2">
              {/* 收藏 */}
              <section className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 font-serif text-base text-foreground">
                    <Heart className="h-4 w-4 text-cinnabar" strokeWidth={1.6} />
                    我的收藏
                  </h2>
                  <Link
                    to="/favorites"
                    className="text-xs text-muted-foreground transition hover:text-primary"
                  >
                    全部 →
                  </Link>
                </div>
                {favorites.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    还没有收藏，去
                    <Link to="/gallery" className="mx-1 text-primary hover:underline">
                      知识长廊
                    </Link>
                    找喜欢的吧
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {favorites.slice(0, 4).map((f) => (
                      <li key={f.id}>
                        <Link
                          to="/article/$id"
                          params={{ id: f.item_id }}
                          className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 transition hover:bg-secondary"
                        >
                          <span className="truncate font-serif text-sm text-foreground/85">
                            {f.title}
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* 创作 */}
              <section className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 font-serif text-base text-foreground">
                    <Palette className="h-4 w-4" strokeWidth={1.6} />
                    我的创作
                  </h2>
                  <Link
                    to="/create"
                    className="text-xs text-muted-foreground transition hover:text-primary"
                  >
                    去创作 →
                  </Link>
                </div>
                {creations.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    还没有作品，
                    <Link to="/create" className="ml-1 text-primary hover:underline">
                      立即创作 →
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {creations.slice(0, 6).map((c) => (
                      <div
                        key={c.id}
                        className="relative aspect-square overflow-hidden rounded-lg border border-border bg-secondary"
                      >
                        {c.type === "image" && c.url ? (
                          <img
                            src={c.url}
                            alt={c.prompt}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            {c.type === "music" ? (
                              <Music className="h-5 w-5" />
                            ) : (
                              <ImageIcon className="h-5 w-5" />
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* 最近活动 */}
            <section>
              <SectionTitle icon={<Sparkles className="h-4 w-4" strokeWidth={1.6} />}>
                最近足迹
              </SectionTitle>
              {events.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card/50 px-4 py-10 text-center text-sm text-muted-foreground">
                  还没有活动记录
                </div>
              ) : (
                <ol className="relative ml-3 border-l border-dashed border-border">
                  {events.map((e) => (
                    <li key={e.id} className="mb-4 ml-6">
                      <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-background bg-cinnabar" />
                      <div className="rounded-lg bg-card/60 p-3">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="font-serif text-sm text-foreground">{e.title}</span>
                          <time className="shrink-0 text-[11px] text-muted-foreground">
                            {timeAgo(e.timestamp)}
                          </time>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {e.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {/* 登录引导（如果是未登录状态） */}
            {favorites.length === 0 && creations.length === 0 && events.length === 0 && (
              <div className="mt-10 rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center">
                <p className="font-serif text-base text-foreground/80">尚未开始</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  浏览文章、收藏、创作都将在这里汇聚
                </p>
                <Link
                  to="/gallery"
                  className="mt-4 inline-flex items-center gap-1 rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground transition hover:opacity-90"
                >
                  开始探索 <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className={`mb-2 ${color}`}>{icon}</div>
      <div className="font-serif text-2xl text-foreground">{value}</div>
      <div className="text-[11px] text-muted-foreground tracking-wider">{label}</div>
    </div>
  );
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 font-serif text-sm tracking-wider text-foreground/80">
      {icon}
      {children}
    </h2>
  );
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} 天前`;
  return new Date(ts).toLocaleDateString("zh-CN");
}
