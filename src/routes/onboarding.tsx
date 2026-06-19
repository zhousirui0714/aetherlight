import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TAGS = ["节气", "节日", "诗词", "典籍", "非遗", "民俗", "人物", "书法", "茶道", "园林", "戏曲", "国画"];

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "选取兴趣 · 溯光" }] }),
  component: Onboarding,
});

function Onboarding() {
  const [picked, setPicked] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const toggle = (t: string) =>
    setPicked((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  const finish = async () => {
    setSaving(true);
    try {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id;
      if (uid) {
        await supabase.from("profiles").update({ interests: picked, onboarded: true }).eq("id", uid);
      }
      toast("已为您备好卷轴");
      navigate({ to: "/" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell showSearch={false} title="兴趣">
      <div className="mx-auto mt-4 max-w-md text-center">
        <h2 className="font-serif text-2xl">您对哪些文化最感兴趣?</h2>
        <p className="mt-1 text-sm text-muted-foreground">选取后,首页将为您优先呈现相关内容</p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {TAGS.map((t) => (
            <button
              key={t}
              onClick={() => toggle(t)}
              className={`rounded-full border px-4 py-2 text-sm font-serif transition ${
                picked.includes(t)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          onClick={finish}
          disabled={saving}
          className="mt-10 w-full rounded-full bg-primary py-2.5 font-serif tracking-widest text-primary-foreground disabled:opacity-50"
        >
          {saving ? "撷取中..." : "开启文化之旅"}
        </button>
        <button onClick={() => navigate({ to: "/" })} className="mt-3 text-sm text-muted-foreground hover:text-foreground">
          稍后再说
        </button>
      </div>
    </AppShell>
  );
}
