import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MessageSquare, LogOut, ChevronRight } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "我的 · 溯光" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const [email, setEmail] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string>("");
  const [favCount, setFavCount] = useState(0);
  const [qaCount, setQaCount] = useState(0);
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
      const [{ count: f }, { count: q }] = await Promise.all([
        supabase.from("favorites").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("qa_history").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      setFavCount(f ?? 0);
      setQaCount(q ?? 0);
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
        <div className="mt-6 grid grid-cols-2 gap-3 text-center">
          <Stat icon={<Heart className="h-4 w-4" />} label="收藏" value={favCount} />
          <Stat icon={<MessageSquare className="h-4 w-4" />} label="问答" value={qaCount} />
        </div>
      </div>

      <ul className="mt-6 divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
        <Row label="主题" value={theme === "dark" ? "暗" : "明"} onClick={toggle} />
        <Row label="兴趣偏好" value="查看" onClick={() => navigate({ to: "/onboarding" })} />
        <Row label="关于溯光" value="v0.1" />
      </ul>

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

function Row({ label, value, onClick }: { label: string; value: string; onClick?: () => void }) {
  return (
    <li>
      <button onClick={onClick} className="flex w-full items-center justify-between px-5 py-3.5 text-left transition hover:bg-secondary">
        <span className="text-sm">{label}</span>
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          {value} <ChevronRight className="h-4 w-4" />
        </span>
      </button>
    </li>
  );
}
