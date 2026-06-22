import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "登录注册 · 溯光" },
      { name: "description", content: "登录或注册溯光，开启您的中华文化之旅。" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [authType, setAuthType] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  // 倒计时逻辑
  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((c) => (c > 0 ? c - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  // 发送验证码
  const sendCode = async () => {
    if (!phone && !email) {
      toast.error("请先填写手机号或邮箱");
      return;
    }

    setLoading(true);
    try {
      if (authType === "phone") {
        // 手机验证码登录/注册
        const { error } = await supabase.auth.signInWithOtp({
          phone: phone.startsWith("+86") ? phone : `+86${phone}`,
          options: {
            channel: "sms",
          },
        });
        if (error) throw error;
      } else {
        // 邮箱验证码登录/注册
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
      }
      setCodeSent(true);
      setCountdown(60);
      toast("验证码已发送，请查收");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "发送失败");
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        // 注册流程：邮箱+密码注册
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { nickname: nickname || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast("注册成功，请查收验证邮件");
        navigate({ to: "/" });
      } else {
        // 登录流程
        if (codeSent) {
          // 使用验证码登录
          if (!code) {
            toast.error("请输入验证码");
            return;
          }

          const { error } = await supabase.auth.verifyOtp({
            phone: authType === "phone" ? (phone.startsWith("+86") ? phone : `+86${phone}`) : undefined,
            email: authType === "email" ? email : undefined,
            token: code,
            type: authType === "phone" ? "sms" : "email",
          });
          if (error) throw error;
        } else {
          // 使用密码登录
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
        }
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
    <div className="flex min-h-screen flex-col paper-texture">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="grid w-full max-w-[960px] overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_30px_80px_-40px_rgba(0,0,0,0.35)] md:grid-cols-2">
          {/* brand side */}
          <div className="relative hidden flex-col justify-between overflow-hidden p-12 md:flex" style={{
            background:
              "linear-gradient(135deg, color-mix(in oklab, var(--color-cinnabar) 12%, var(--color-card)) 0%, color-mix(in oklab, var(--color-bronze) 10%, var(--color-card)) 100%)",
          }}>
            <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-40" style={{
              background: "radial-gradient(closest-side, var(--color-cinnabar), transparent 70%)"
            }} />
            <div aria-hidden className="absolute -bottom-20 -left-16 h-80 w-80 rounded-full opacity-30" style={{
              background: "radial-gradient(closest-side, var(--color-bronze), transparent 70%)"
            }} />
            <div className="relative">
              <div className="seal text-base px-3 py-1">溯光</div>
              <h2 className="mt-10 font-serif text-4xl leading-snug text-foreground">
                寻溯<br />千年智慧之光
              </h2>
              <p className="mt-4 text-sm leading-loose text-foreground/70">
                以 AI 之力活化典籍诗书，<br />
                让传统文化在当下流转重生。
              </p>
            </div>
            <div className="relative font-serif text-xs tracking-[0.5em] text-foreground/50">
              墨 · 韵 · 光
            </div>
          </div>

          {/* form side */}
          <div className="p-10 md:p-12">
            <div className="mb-8 flex gap-1 rounded-full border border-border bg-background/40 p-1">
              {(["login", "signup"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setCodeSent(false);
                    setCode("");
                  }}
                  className={`flex-1 rounded-full py-2 font-serif text-sm tracking-widest transition ${
                    mode === m ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"
                  }`}
                >
                  {m === "login" ? "登 录" : "注 册"}
                </button>
              ))}
            </div>

            <h1 className="font-serif text-2xl text-foreground">
              {mode === "login" ? "墨色相逢" : "结一段文缘"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "login" ? "登录以收藏与请教雅士" : "注册即可开启文化之旅"}
            </p>

            <form onSubmit={submit} className="mt-6 space-y-3">
              {mode === "signup" && (
                <Field label="昵称" value={nickname} onChange={setNickname} placeholder="您的雅号" />
              )}

              {/* 登录方式切换 */}
              {mode === "login" && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthType("email");
                      setCodeSent(false);
                      setCode("");
                    }}
                    className={`flex-1 rounded-full py-2 text-xs font-serif tracking-widest transition ${
                      authType === "email" && !codeSent
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    密码登录
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthType("phone");
                      setCodeSent(false);
                      setCode("");
                    }}
                    className={`flex-1 rounded-full py-2 text-xs font-serif tracking-widest transition ${
                      authType === "phone" || codeSent
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    验证码登录
                  </button>
                </div>
              )}

              {/* 账号输入 */}
              {authType === "phone" ? (
                <Field
                  label="手机号"
                  type="tel"
                  value={phone}
                  onChange={setPhone}
                  placeholder="138****8888"
                  required
                />
              ) : (
                <Field
                  label="邮箱"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  required
                />
              )}

              {/* 验证码 */}
              {(mode === "login" && (codeSent || authType === "phone")) && (
                <Field
                  label="验证码"
                  value={code}
                  onChange={setCode}
                  placeholder="6 位验证码"
                  rightSlot={
                    <button
                      type="button"
                      onClick={sendCode}
                      disabled={loading || countdown > 0}
                      className={`rounded-full px-3 py-1 text-xs transition ${
                        countdown > 0
                          ? "bg-secondary text-muted-foreground"
                          : loading
                          ? "bg-secondary text-muted-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {countdown > 0 ? `${countdown}s` : "获取验证码"}
                    </button>
                  }
                />
              )}

              {/* 密码 */}
              {mode === "signup" || (!codeSent && authType === "email") ? (
                <Field
                  label="密码"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="至少 6 位"
                  required
                />
              ) : null}

              {mode === "login" && !codeSent && (
                <div className="flex justify-end">
                  <button type="button" className="text-xs text-muted-foreground hover:text-primary">忘记密码？</button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-primary py-3 font-serif text-sm tracking-[0.3em] text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "请稍候…" : mode === "login" ? "登 录" : "注 册"}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> 其他方式 <span className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={google}
                disabled={loading}
                className="rounded-full border border-border bg-background/40 py-2.5 text-sm transition hover:bg-secondary"
              >
                Google 登录
              </button>
              <button
                disabled
                className="rounded-full border border-border bg-background/40 py-2.5 text-sm text-muted-foreground"
                title="即将开放"
              >
                微信扫码
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              注册即表示同意 <a className="hover:text-primary">服务条款</a> 与 <a className="hover:text-primary">隐私政策</a>
            </p>
            <p className="mt-2 text-center">
              <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← 返回首页</Link>
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", placeholder, required, rightSlot,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean; rightSlot?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-serif tracking-widest text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 rounded-2xl border border-input bg-background/60 px-4 py-2.5 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        <input
          type={type}
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
        />
        {rightSlot}
      </div>
    </label>
  );
}
