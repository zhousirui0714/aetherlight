import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Flame, BookOpen, Sparkles, Award, Compass, Activity, Loader2 } from "lucide-react";
import { getJourney, getJourneyStats, type JourneyEvent, type UserJourney } from "@/lib/journey-storage";
import { listCreations } from "@/lib/creation-storage";
import { loadAllFavorites, type FavoriteItem } from "@/lib/favorites-storage";
import { getMyAnnotations, type Annotation } from "@/lib/annotation-storage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/wuge/growth")({
  head: () => ({ meta: [{ title: "我的成长 · 吾阁" }] }),
  component: GrowthPage,
});

const KNOWLEDGE_CATS = ["人物", "诗词", "典籍", "节日", "非遗", "建筑", "哲学", "历史"] as const;
const CAT_COLORS: Record<string, string> = {
  人物: "#C43A30", 诗词: "#8B5A2B", 典籍: "#5A4A3A", 节日: "#D97A4A",
  非遗: "#7A8B5A", 建筑: "#4A6B7A", 哲学: "#6B5A8B", 历史: "#8B7A5A",
};

function GrowthPage() {
  const [loading, setLoading] = useState(true);
  const [journey, setJourney] = useState<UserJourney | null>(null);
  const [stats, setStats] = useState({ articlesRead: 0, dialoguesHad: 0, quizzesDone: 0, creationsMade: 0 });
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [notes, setNotes] = useState<Annotation[]>([]);
  const [creations, setCreations] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const [j, favs, anns, creas] = await Promise.all([
        getJourney(),
        loadAllFavorites().catch(() => [] as FavoriteItem[]),
        getMyAnnotations().catch(() => [] as Annotation[]),
        listCreations(),
      ]);
      setJourney(j);
      setStats(getJourneyStats(j.events));
      setFavorites(favs);
      setNotes(anns);
      setCreations(creas.length);
      setLoading(false);
    })();
  }, []);

  const catDistribution = useMemo(() => {
    if (!journey) return [];
    const map: Record<string, number> = {};
    KNOWLEDGE_CATS.forEach((c) => (map[c] = 0));
    journey.events.forEach((e) => {
      const c = e.category;
      if (c in map) map[c] += 1;
    });
    const max = Math.max(1, ...Object.values(map));
    return KNOWLEDGE_CATS.map((c) => ({ name: c, count: map[c], ratio: map[c] / max }));
  }, [journey]);

  const heatmap = useMemo(() => buildHeatmap(journey?.events ?? []), [journey]);

  const badges = useMemo(() => buildBadges({
    streak: journey?.streak ?? 0,
    totalDays: journey?.totalDays ?? 0,
    articles: stats.articlesRead,
    dialogues: stats.dialoguesHad,
    quizzes: stats.quizzesDone,
    creations: creations,
    favorites: favorites.length,
    notes: notes.length,
  }), [journey, stats, favorites, notes, creations]);

  if (loading || !journey) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-cinnabar" />
        <p className="mt-3 font-serif text-sm text-foreground/50">绘制成长图…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div>
        <div className="font-serif text-xs tracking-[0.4em] text-cinnabar/70">MY GROWTH</div>
        <h2 className="mt-2 font-serif text-3xl tracking-[0.2em] text-foreground">我的成长</h2>
        <p className="mt-2 font-serif text-sm text-foreground/55">
          文化探索的足迹,皆化为可观的成长曲线
        </p>
      </div>

      {/* 顶部 4 大数据 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <BigStat icon={<Flame className="h-4 w-4 text-orange-500" />}       label="连续打卡" value={journey.streak}   unit="日" highlight />
        <BigStat icon={<Activity className="h-4 w-4" />}                    label="累计天数" value={journey.totalDays} unit="日" />
        <BigStat icon={<BookOpen className="h-4 w-4" />}                    label="已阅文章" value={stats.articlesRead} unit="篇" />
        <BigStat icon={<Sparkles className="h-4 w-4" />}                   label="已创作品" value={creations}        unit="件" />
      </div>

      {/* 分类学习进度 */}
      <Section title="分 类 进 度" icon={<Compass className="h-3.5 w-3.5" strokeWidth={1.8} />}>
        <div className="grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2">
          {catDistribution.map((c) => (
            <div key={c.name}>
              <div className="mb-1 flex items-baseline justify-between text-xs">
                <span className="font-serif tracking-wider text-foreground/80">{c.name}</span>
                <span className="font-serif text-foreground/45">{c.count} 件</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-cinnabar/10">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.max(2, c.ratio * 100)}%`,
                    backgroundColor: CAT_COLORS[c.name] || "#C43A30",
                    opacity: 0.4 + 0.6 * c.ratio,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 学习热力图 (84 天 / 12 周) */}
      <Section title="学 习 热 力" icon={<Activity className="h-3.5 w-3.5" strokeWidth={1.8} />}>
        <Heatmap data={heatmap} />
      </Section>

      {/* 文化徽章 */}
      <Section title="文 化 徽 章" icon={<Award className="h-3.5 w-3.5" strokeWidth={1.8} />}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {badges.map((b) => (
            <div
              key={b.name}
              className={cn(
                "rounded-sm border p-4 text-center transition",
                b.unlocked
                  ? "border-cinnabar/40 bg-gradient-to-br from-cinnabar/10 to-cinnabar/5"
                  : "border-cinnabar/15 bg-[#faf6ec]/40 dark:bg-[#3a3024]/40 opacity-50",
              )}
            >
              <div className={cn(
                "mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full",
                b.unlocked ? "bg-cinnabar text-[#faf5e8]" : "bg-cinnabar/15 text-foreground/40",
              )}>
                <b.Icon className="h-5 w-5" strokeWidth={1.6} />
              </div>
              <div className="font-serif text-sm tracking-wider text-foreground">{b.name}</div>
              <div className="mt-1 font-serif text-[10px] tracking-wider text-foreground/50">{b.desc}</div>
              {b.unlocked ? (
                <div className="mt-2 font-serif text-[10px] tracking-[0.2em] text-cinnabar">已 解 锁</div>
              ) : (
                <div className="mt-2 font-serif text-[10px] tracking-wider text-foreground/40">{b.requirement}</div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* 知识图谱: 分类雷达 */}
      <Section title="知 识 图 谱" icon={<Compass className="h-3.5 w-3.5" strokeWidth={1.8} />}>
        <KnowledgeRadar distribution={catDistribution} />
      </Section>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-sm border border-cinnabar/15 bg-[#faf6ec]/80 p-5 shadow-[0_2px_20px_rgba(139,69,19,0.05)] dark:bg-[#3a3024]/60">
      <h3 className="mb-4 flex items-center gap-2 font-serif text-sm tracking-[0.3em] text-foreground/75">
        <span className="text-cinnabar">{icon}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function BigStat({ icon, label, value, unit, highlight }: { icon: React.ReactNode; label: string; value: number; unit?: string; highlight?: boolean }) {
  return (
    <div className={cn(
      "rounded-sm border p-4 transition",
      highlight
        ? "border-cinnabar/30 bg-gradient-to-br from-cinnabar/10 to-cinnabar/5"
        : "border-cinnabar/15 bg-[#faf6ec]/60 dark:bg-[#3a3024]/40",
    )}>
      <div className="flex items-center gap-1.5 text-foreground/55">
        {icon}<span className="font-serif text-[10px] tracking-[0.2em]">{label}</span>
      </div>
      <div className="mt-1 font-serif text-3xl text-foreground">
        {value}
        {unit && <span className="ml-1 text-xs text-foreground/55">{unit}</span>}
      </div>
    </div>
  );
}

// ============ Heatmap ============
type HeatCell = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };

function buildHeatmap(events: JourneyEvent[]): HeatCell[] {
  const days = 84; // 12 周
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const map = new Map<string, number>();
  events.forEach((e) => {
    const d = new Date(e.timestamp);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + 1);
  });
  const cells: HeatCell[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const count = map.get(key) ?? 0;
    const level: HeatCell["level"] = count === 0 ? 0 : count <= 2 ? 1 : count <= 4 ? 2 : count <= 7 ? 3 : 4;
    cells.push({ date: key, count, level });
  }
  return cells;
}

function Heatmap({ data }: { data: HeatCell[] }) {
  // 7 列 × 12 周
  const weeks: HeatCell[][] = [];
  for (let i = 0; i < data.length; i += 7) weeks.push(data.slice(i, i + 7));
  const totalActive = data.filter((d) => d.count > 0).length;
  return (
    <div>
      <div className="overflow-x-auto">
        <div className="inline-block">
          <div className="grid grid-rows-7 gap-1" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}>
            {Array.from({ length: 7 }).map((_, dayIdx) => (
              <div key={dayIdx} className="flex flex-col gap-1">
                {weeks.map((w, wIdx) => {
                  const cell = w[dayIdx];
                  if (!cell) return <div key={wIdx} className="h-3 w-3" />;
                  const bg =
                    cell.level === 0 ? "bg-cinnabar/8" :
                    cell.level === 1 ? "bg-cinnabar/25" :
                    cell.level === 2 ? "bg-cinnabar/45" :
                    cell.level === 3 ? "bg-cinnabar/65" :
                                        "bg-cinnabar/85";
                  return (
                    <div
                      key={wIdx}
                      className={cn("h-3 w-3 rounded-sm", bg)}
                      title={`${cell.date} · ${cell.count} 次`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-serif tracking-wider text-foreground/40">
            <span>少</span>
            {[0, 1, 2, 3, 4].map((lv) => (
              <div
                key={lv}
                className={cn(
                  "h-3 w-3 rounded-sm",
                  lv === 0 ? "bg-cinnabar/8" :
                  lv === 1 ? "bg-cinnabar/25" :
                  lv === 2 ? "bg-cinnabar/45" :
                  lv === 3 ? "bg-cinnabar/65" :
                              "bg-cinnabar/85",
                )}
              />
            ))}
            <span>多</span>
            <span className="ml-4">最近 12 周 · {totalActive} 日有迹</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Badges ============
function buildBadges(m: { streak: number; totalDays: number; articles: number; dialogues: number; quizzes: number; creations: number; favorites: number; notes: number }) {
  return [
    { name: "初识文心", desc: "迈出第一步",     Icon: BookOpen,   unlocked: m.favorites >= 1 || m.articles >= 1, requirement: "收藏 1 件或阅读 1 篇" },
    { name: "博览群书", desc: "藏书渐丰",       Icon: BookOpen,   unlocked: m.favorites >= 10, requirement: "藏书 10 卷" },
    { name: "学富五车", desc: "藏书大家",       Icon: BookOpen,   unlocked: m.favorites >= 50, requirement: "藏书 50 卷" },
    { name: "问道者",   desc: "向先贤请教",     Icon: Sparkles,   unlocked: m.dialogues >= 1, requirement: "问答 1 次" },
    { name: "温故知新", desc: "七天不辍",       Icon: Flame,      unlocked: m.streak >= 7, requirement: "连续打卡 7 日" },
    { name: "笃行不怠", desc: "月之恒也",       Icon: Flame,      unlocked: m.streak >= 30, requirement: "连续打卡 30 日" },
    { name: "知行合一", desc: "答中求知",       Icon: Award,      unlocked: m.quizzes >= 1, requirement: "答题 1 次" },
    { name: "笔耕不辍", desc: "著文以记",       Icon: Sparkles,   unlocked: m.creations >= 1, requirement: "创作 1 件" },
  ];
}

// ============ Knowledge Radar ============
function KnowledgeRadar({ distribution }: { distribution: { name: string; count: number; ratio: number }[] }) {
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const R = 130;
  const N = distribution.length;
  const angleFor = (i: number) => (Math.PI * 2 * i) / N - Math.PI / 2;
  const point = (i: number, r: number) => {
    const a = angleFor(i);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  };
  const gridLevels = [0.25, 0.5, 0.75, 1];
  const polygon = (r: number) => distribution.map((_, i) => point(i, r)).map((p) => p.join(",")).join(" ");

  const dataPath = distribution
    .map((d, i) => {
      const [x, y] = point(i, Math.max(0.05, d.ratio) * R);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ") + " Z";

  return (
    <div className="flex flex-col items-center gap-3 md:flex-row md:items-start md:gap-8">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-72 w-72 shrink-0">
        {/* 网格 */}
        {gridLevels.map((lv) => (
          <polygon
            key={lv}
            points={polygon(R * lv)}
            fill="none"
            stroke="rgba(196,58,48,0.12)"
            strokeWidth="1"
          />
        ))}
        {/* 轴 */}
        {distribution.map((d, i) => {
          const [x, y] = point(i, R);
          return <line key={d.name} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(196,58,48,0.12)" strokeWidth="1" />;
        })}
        {/* 数据多边形 */}
        <path d={dataPath} fill="rgba(196,58,48,0.15)" stroke="#C43A30" strokeWidth="1.5" />
        {/* 节点 */}
        {distribution.map((d, i) => {
          const [x, y] = point(i, Math.max(0.05, d.ratio) * R);
          return <circle key={d.name} cx={x} cy={y} r="3" fill={CAT_COLORS[d.name] || "#C43A30"} />;
        })}
        {/* 标签 */}
        {distribution.map((d, i) => {
          const [x, y] = point(i, R + 18);
          return (
            <text
              key={d.name}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="font-serif"
              fontSize="11"
              fill="currentColor"
              opacity="0.7"
            >
              {d.name}
            </text>
          );
        })}
      </svg>
      <div className="flex-1 space-y-2">
        <p className="font-serif text-xs leading-loose text-foreground/65">
          基于你的阅读足迹绘制。每一方向代表一个文化分类,
          触达越远,表示你在该领域探索越深。
        </p>
        <ul className="space-y-1">
          {distribution
            .slice()
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
            .map((d) => (
              <li key={d.name} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CAT_COLORS[d.name] || "#C43A30" }} />
                <span className="font-serif text-foreground/75">{d.name}</span>
                <span className="ml-auto font-serif text-foreground/45">{d.count} 件</span>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
