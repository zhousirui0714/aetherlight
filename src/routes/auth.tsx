import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "登录 · 溯光" }] }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { nickname: nickname || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast("注册成功", { description: "欢迎来到溯光" });
        navigate({ to: "/onboarding" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast("欢迎归来");
        navigate({ to: "/" });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "出错了");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setLoading(true);
    try {
      const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (r.error) throw new Error(r.error.message ?? "Google 登录失败");
      if (r.redirected) return;
      navigate({ to: "/" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Google 登录失败");
      setLoading(false);
    }
  };

  return (
    <AppShell showSearch={false} title={mode === "login" ? "归来" : "结缘"}>
      <div className="mx-auto mt-6 max-w-sm">
        <div className="mb-8 text-center">
          <div className="seal mx-auto mb-4 px-4 py-1 text-base">溯光</div>
          <h1 className="font-serif text-2xl">{mode === "login" ? "墨色相逢" : "结一段文缘"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login" ? "登录以收藏与请教雅士" : "注册即可开启文化之旅"}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <Field label="昵称" value={nickname} onChange={setNickname} placeholder="您的雅号" />
          )}
          <Field label="邮箱" type="email" value={email} onChange={setEmail} placeholder="you@example.com" required />
          <Field label="密码" type="password" value={password} onChange={setPassword} placeholder="至少 6 位" required />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary py-2.5 text-sm font-serif tracking-widest text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "请稍候..." : mode === "login" ? "登 录" : "注 册"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> 或 <span className="h-px flex-1 bg-border" />
        </div>

        <button
          onClick={google}
          disabled={loading}
          className="w-full rounded-full border border-border bg-card py-2.5 text-sm transition hover:bg-secondary"
        >
          使用 Google 登录
        </button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? "尚未结缘?" : "已有账号?"}{" "}
          <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-primary underline-offset-4 hover:underline">
            {mode === "login" ? "立即注册" : "登录"}
          </button>
        </p>
        <p className="mt-2 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">返回首页</Link>
        </p>
      </div>
    </AppShell>
  );
}

function Field({
  label, value, onChange, type = "text", placeholder, required,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-serif tracking-widest text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-input bg-card px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}
