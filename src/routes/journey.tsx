import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { getJourney, getMilestones, getJourneyStats, type UserJourney, type JourneyMilestone } from "@/lib/journey-storage";
import { BookOpen, MessageSquare, Trophy, Palette, Heart, Flame, Star, Calendar, Clock, ChevronRight, Sparkles, Award } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/journey")({
  head: () => ({ meta: [{ title: "我的历程 · 溯光" }] }),
  component: JourneyPage,
});

function JourneyPage() {
  const [journey, setJourney] = useState<UserJourney | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [recentBadges, setRecentBadges] = useState<string[]>([]);

  useEffect(() => {
    loadJourney();
  }, []);

  const loadJourney = async () => {
    setLoading(true);
    try {
      const data = await getJourney();
      setJourney(data);
      
      // 显示新获得的徽章提示
      const newBadges = data.badges.slice(0, 3);
      if (newBadges.length > 0) {
        setRecentBadges(newBadges);
      }
    } finally {
      setLoading(false);
    }
  };

  const stats = journey ? getJourneyStats(journey.events) : null;
  const milestones = getMilestones();
  const categories = [
    { id: "all", label: "全部", icon: <Sparkles className="h-4 w-4" /> },
    { id: "article_view", label: "阅读", icon: <BookOpen className="h-4 w-4" /> },
    { id: "dialogue_chat", label: "对话", icon: <MessageSquare className="h-4 w-4" /> },
    { id: "quiz_complete", label: "答题", icon: <Trophy className="h-4 w-4" /> },
    { id: "creation_make", label: "创作", icon: <Palette className="h-4 w-4" /> },
  ];

  const filteredEvents = journey?.events.filter(e => 
    selectedCategory === "all" || e.type === selectedCategory
  ) || [];

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    if (days < 7) return `${days} 天前`;
    return new Date(timestamp).toLocaleDateString("zh-CN");
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "article_view": return <BookOpen className="h-4 w-4" />;
      case "dialogue_chat": return <MessageSquare className="h-4 w-4" />;
      case "quiz_complete": return <Trophy className="h-4 w-4" />;
      case "creation_make": return <Palette className="h-4 w-4" />;
      case "favorite_add": return <Heart className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "article_view": return "bg-primary/10 text-primary";
      case "dialogue_chat": return "bg-accent/10 text-accent";
      case "quiz_complete": return "bg-yellow-100 text-yellow-600";
      case "creation_make": return "bg-purple-100 text-purple-600";
      case "favorite_add": return "bg-red-100 text-red-500";
      default: return "bg-secondary/20 text-secondary-foreground";
    }
  };

  const unlockedMilestones = milestones.filter(m => journey?.badges.includes(m.id));
  const lockedMilestones = milestones.filter(m => !journey?.badges.includes(m.id));

  if (loading) {
    return (
      <AppShell showSearch={false} title="我的历程">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Sparkles className="h-8 w-8 mx-auto mb-3 animate-pulse text-primary" />
            <p className="font-serif text-muted-foreground">加载中...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell showSearch={false} title="我的历程">
      {/* 新手提示 */}
      {!journey?.events.length && (
        <div className="mb-6 rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-serif text-lg text-foreground">开启你的文化之旅</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                从阅读诗词、与名家对话、创作作品开始，逐步积累你的文化历程。每一步都有意义。
              </p>
              <div className="mt-4 flex gap-3">
                <Link to="/knowledge" className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90">
                  开始探索
                </Link>
                <Link to="/dialogue" className="rounded-full border border-border bg-background px-4 py-2 text-sm hover:bg-secondary/50">
                  与名家对话
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 概览统计 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<BookOpen className="h-5 w-5" />}
          label="阅读篇数"
          value={stats?.articlesRead || 0}
          color="text-primary"
          bgColor="bg-primary/10"
        />
        <StatCard
          icon={<MessageSquare className="h-5 w-5" />}
          label="对话次数"
          value={stats?.dialoguesHad || 0}
          color="text-accent"
          bgColor="bg-accent/10"
        />
        <StatCard
          icon={<Trophy className="h-5 w-5" />}
          label="答题次数"
          value={stats?.quizzesDone || 0}
          color="text-yellow-500"
          bgColor="bg-yellow-100"
        />
        <StatCard
          icon={<Palette className="h-5 w-5" />}
          label="创作作品"
          value={stats?.creationsMade || 0}
          color="text-purple-500"
          bgColor="bg-purple-100"
        />
      </div>

      {/* 连续访问 & 总天数 */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">连续访问</p>
              <p className="font-serif text-2xl">{journey?.streak || 0} <span className="text-sm text-muted-foreground">天</span></p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">累计天数</p>
              <p className="font-serif text-2xl">{journey?.totalDays || 0} <span className="text-sm text-muted-foreground">天</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* 徽章墙 */}
      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-xl text-foreground">成就徽章</h2>
          <span className="text-xs text-muted-foreground">
            {unlockedMilestones.length} / {milestones.length}
          </span>
        </div>
        
        {/* 已解锁徽章 */}
        {unlockedMilestones.length > 0 && (
          <div className="mb-4">
            <p className="mb-3 text-xs text-muted-foreground">已解锁</p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {unlockedMilestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="group relative flex flex-col items-center rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-4 text-center"
                >
                  <div className="text-3xl">{milestone.icon}</div>
                  <p className="mt-2 font-serif text-sm text-foreground">{milestone.name}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{milestone.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 未解锁徽章 */}
        {lockedMilestones.length > 0 && (
          <div>
            <p className="mb-3 text-xs text-muted-foreground">即将解锁</p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {lockedMilestones.slice(0, 8).map((milestone) => {
                const currentCount = journey?.events.filter(e => e.type === milestone.type).length || 0;
                const progress = Math.min(100, (currentCount / milestone.requirement) * 100);
                
                return (
                  <div
                    key={milestone.id}
                    className="group relative flex flex-col items-center rounded-2xl border border-border bg-card/50 p-4 text-center opacity-60"
                  >
                    <div className="text-3xl grayscale">{milestone.icon}</div>
                    <p className="mt-2 font-serif text-sm text-muted-foreground">{milestone.name}</p>
                    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-border">
                      <div 
                        className="h-full bg-primary/50 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">{currentCount}/{milestone.requirement}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 最近活动 */}
      <div className="mt-8">
        <h2 className="mb-4 font-serif text-xl text-foreground">最近活动</h2>
        
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition ${
                selectedCategory === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {filteredEvents.length === 0 ? (
          <div className="py-12 text-center">
            <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="font-serif text-muted-foreground">暂无活动记录</p>
            <p className="mt-1 text-sm text-muted-foreground/70">开始你的文化探索之旅吧</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.slice(0, 20).map((event, index) => (
              <div
                key={event.id}
                className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${getEventColor(event.type)}`}>
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-serif text-sm text-foreground truncate">{event.title}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatTime(event.timestamp)}
                    </span>
                  </div>
                  {event.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{event.description}</p>
                  )}
                  <span className="mt-2 inline-block rounded-full bg-secondary/50 px-2 py-0.5 text-[10px] text-muted-foreground">
                    {event.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 推荐行动 */}
      {journey && journey.events.length > 0 && (
        <div className="mt-8 rounded-3xl border border-border bg-gradient-to-br from-secondary/20 to-background p-6">
          <h3 className="mb-4 font-serif text-lg text-foreground">继续探索</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              to="/knowledge"
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/30"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-serif text-sm text-foreground">探索更多知识</p>
                <p className="text-xs text-muted-foreground">阅读诗词典籍</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link
              to="/dialogue"
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition hover:border-accent/30"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <MessageSquare className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1">
                <p className="font-serif text-sm text-foreground">与名家对话</p>
                <p className="text-xs text-muted-foreground">李白、杜甫等你来聊</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function StatCard({ icon, label, value, color, bgColor }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${bgColor}`}>
        <span className={color}>{icon}</span>
      </div>
      <p className="font-serif text-2xl text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
