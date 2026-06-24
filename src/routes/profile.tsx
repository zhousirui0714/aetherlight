import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MessageSquare, LogOut, ChevronRight, BookOpen, Clock, Palette, Trophy, Sparkles, Moon, Sun, Flame, Award, FileText } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { listCreations } from "@/lib/creation-storage";
import { getJourney } from "@/lib/journey-storage";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "我的 · 溯光" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const [email, setEmail] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string>("");
  const [favCount, setFavCount] = useState(0);
  const [qaCount, setQaCount] = useState(0);
  const [creationCount, setCreationCount] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) return;
      setEmail(user.email ?? null);
      const { data: profile } = await supabase.from("profiles").select("nickname").eq("id", user.id).maybeSingle();
      setNickname(profile?.nickname ?? user.email?.split("@")[0] ?? "雅士");
      
      const [
        { count: f }, 
        { count: q },
        creations,
        journey
      ] = await Promise.all([
        supabase.from("favorites").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("qa_history").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        listCreations(),
        getJourney(),
      ]);
      setFavCount(f ?? 0);
      setQaCount(q ?? 0);
      setCreationCount(creations.length);
      setStreak(journey.streak);
      setBadgeCount(journey.badges.length);
      
      const { data: scores } = await supabase
        .from("quiz_scores")
        .select("score")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (scores && scores.length > 0) {
        setQuizScore(scores[0].score);
      }
    })();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  if (!email) {
    return (
      <AppShell showSearch={false} title="我的">
        <div className="mt-12 flex flex-col items-center gap-4 text-center">
          <div className="seal text-base">溯光</div>
          <h2 className="font-serif text-xl">尚未结缘</h2>
          <p className="text-sm text-muted-foreground">登录后即可收藏文章、留存问答</p>
          <Link to="/auth" className="rounded-full bg-primary px-6 py-2 text-sm text-primary-foreground hover:opacity-90">
            登录 / 注册
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell showSearch={false} title="我的">
      <div className="rounded-3xl border border-border bg-card p-6 scroll-in">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 font-serif text-2xl text-primary">
            {nickname.charAt(0)}
          </div>
          <div>
            <h2 className="font-serif text-xl">{nickname}</h2>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button onClick={() => navigate({ to: "/favorites" })} className="rounded-2xl bg-background/50 py-3 transition hover:bg-secondary/50">
            <div className="mx-auto mb-1 flex items-center justify-center gap-1 text-muted-foreground"><Heart className="h-4 w-4" /><span className="text-xs">收藏</span></div>
            <div className="font-serif text-2xl">{favCount}</div>
          </button>
          <button onClick={() => navigate({ to: "/create" })} className="rounded-2xl bg-background/50 py-3 transition hover:bg-secondary/50">
            <div className="mx-auto mb-1 flex items-center justify-center gap-1 text-muted-foreground"><Palette className="h-4 w-4" /><span className="text-xs">创作</span></div>
            <div className="font-serif text-2xl">{creationCount}</div>
          </button>
          <button onClick={() => navigate({ to: "/chat" })} className="rounded-2xl bg-background/50 py-3 transition hover:bg-secondary/50">
            <div className="mx-auto mb-1 flex items-center justify-center gap-1 text-muted-foreground"><MessageSquare className="h-4 w-4" /><span className="text-xs">问答</span></div>
            <div className="font-serif text-2xl">{qaCount}</div>
          </button>
          <button onClick={() => navigate({ to: "/community?tab=quiz" })} className="rounded-2xl bg-background/50 py-3 transition hover:bg-secondary/50">
            <div className="mx-auto mb-1 flex items-center justify-center gap-1 text-muted-foreground"><Trophy className="h-4 w-4" /><span className="text-xs">答题</span></div>
            <div className="font-serif text-2xl">{quizScore}</div>
          </button>
        </div>
      </div>

      {/* 文化历程卡片 */}
      <button
        onClick={() => navigate({ to: "/journey" })}
        className="mt-6 w-full rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 p-5 text-left transition hover:border-primary/40"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-base text-foreground">我的文化历程</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">查看你的文化探索足迹</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-1 text-orange-500">
                <Flame className="h-4 w-4" />
                <span className="font-serif text-lg">{streak}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">连续天数</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-yellow-500">
                <Award className="h-4 w-4" />
                <span className="font-serif text-lg">{badgeCount}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">徽章</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </button>

      <div className="mt-6 rounded-3xl border border-border bg-card">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="font-serif text-sm text-foreground">文化足迹</h3>
        </div>
        <ul className="divide-y divide-border">
          <Row 
            label="我的收藏" 
            value={`${favCount} 项`} 
            onClick={() => navigate({ to: "/favorites" })} 
            icon={<Heart className="h-4 w-4" />} 
          />
          <Row 
            label="创作历史" 
            value={`${creationCount} 件作品`} 
            onClick={() => navigate({ to: "/create" })} 
            icon={<Palette className="h-4 w-4" />} 
          />
          <Row 
            label="对话历史" 
            value="查看" 
            onClick={() => navigate({ to: "/dialogue/history" })} 
            icon={<Sparkles className="h-4 w-4" />} 
          />
          <Row 
            label="历史问答" 
            value={`${qaCount} 次`} 
            onClick={() => navigate({ to: "/chat" })} 
            icon={<Clock className="h-4 w-4" />} 
          />
          <Row 
            label="答题记录" 
            value={`最高 ${quizScore} 分`} 
            onClick={() => navigate({ to: "/tongyou/community" })} 
            icon={<Trophy className="h-4 w-4" />} 
          />
          <Row 
            label="我的批注" 
            value="查看" 
            onClick={() => navigate({ to: "/annotations" })} 
            icon={<FileText className="h-4 w-4" />} 
          />
        </ul>
      </div>

      <div className="mt-6 rounded-3xl border border-border bg-card">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="font-serif text-sm text-foreground">设置</h3>
        </div>
        <ul className="divide-y divide-border">
          <Row 
            label="主题" 
            value={theme === "dark" ? "暗色" : "亮色"} 
            onClick={toggle} 
            icon={theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />} 
          />
          <Row 
            label="兴趣偏好" 
            value="修改" 
            onClick={() => navigate({ to: "/onboarding" })} 
            icon={<BookOpen className="h-4 w-4" />} 
          />
          <Row label="关于溯光" value="v0.1" />
        </ul>
      </div>

      <button
        onClick={signOut}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card py-2.5 text-sm text-muted-foreground hover:text-destructive"
      >
        <LogOut className="h-4 w-4" /> 退出登录
      </button>
    </AppShell>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-background/50 py-3">
      <div className="mx-auto mb-1 flex items-center justify-center gap-1 text-muted-foreground">{icon}<span className="text-xs">{label}</span></div>
      <div className="font-serif text-2xl">{value}</div>
    </div>
  );
}

function Row({ label, value, onClick, icon }: { label: string; value: string; onClick?: () => void; icon?: React.ReactNode }) {
  return (
    <li>
      <button onClick={onClick} className="flex w-full items-center justify-between px-5 py-3.5 text-left transition hover:bg-secondary">
        <span className="flex items-center gap-2 text-sm">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          {label}
        </span>
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          {value} <ChevronRight className="h-4 w-4" />
        </span>
      </button>
    </li>
  );
}
