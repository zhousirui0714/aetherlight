import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { SAGES, DYNASTY_GROUPS, type Sage } from "@/lib/sages";
import { Clock, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/dialogue/")({
  head: () => ({
    meta: [
      { title: "与名家对话 · 角色市场 · 溯光" },
      { name: "description", content: "择一位名家，共话春秋。李白、苏轼、孔子、庄子、王羲之等任你结识。" },
    ],
  }),
  component: DialogueMarket,
});

function DialogueMarket() {
  const [group, setGroup] = useState<(typeof DYNASTY_GROUPS)[number]>("全部");

  const list: Sage[] = useMemo(
    () => (group === "全部" ? SAGES : SAGES.filter((s) => s.group === group)),
    [group],
  );

  return (
    <AppShell>
      {/* breadcrumb */}
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">首页</Link>
        <span className="mx-2 text-border">/</span>
        <span className="text-foreground/80">与名家对话</span>
      </nav>

      <div className="mb-10 flex flex-col items-center text-center">
        <div className="font-serif text-xs tracking-[0.4em] text-accent">DIALOGUE WITH THE SAGES</div>
        <h1 className="mt-3 font-serif text-4xl text-foreground">与 名 家 对 话</h1>
        <p className="mt-3 text-sm text-muted-foreground">择一位名家，共话春秋</p>

        <Link
          to="/dialogue/history"
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-primary"
        >
          <Clock className="h-4 w-4" /> 查看历史对话
        </Link>
      </div>

      {/* dynasty filter */}
      <div className="mb-10 flex flex-wrap items-center justify-center gap-1">
        {DYNASTY_GROUPS.map((g) => {
          const active = group === g;
          return (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={`relative px-4 py-2 font-serif text-sm tracking-widest transition ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {g}
              {active && <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>

      {/* grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((s, i) => (
          <Link
            key={s.id}
            to="/dialogue/$id"
            params={{ id: s.id }}
            style={{ animationDelay: `${i * 40}ms` }}
            className="scroll-in group flex flex-col items-center gap-3 rounded-3xl border border-border bg-card p-6 text-center transition hover:-translate-y-1 hover:border-[var(--color-bronze)] hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.25)]"
          >
            <SageAvatar sage={s} size={96} />
            <div className="mt-2">
              <h3 className="font-serif text-2xl text-foreground group-hover:text-primary">{s.name}</h3>
              <p className="mt-1 text-xs tracking-widest text-muted-foreground">{s.dynasty}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-1">
              {s.styles.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border bg-background/50 px-2.5 py-0.5 text-[11px] font-serif text-accent"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="font-serif italic text-sm leading-loose text-foreground/75 line-clamp-2 px-1">
              「{s.representative}」
            </p>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-serif tracking-widest text-muted-foreground group-hover:text-primary">
              入书房 <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}

export function SageAvatar({ sage, size = 64 }: { sage: Sage; size?: number }) {
  return (
    <div
      className="relative flex shrink-0 items-center justify-center rounded-full font-serif text-foreground/85"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.45,
        background: `radial-gradient(circle at 30% 30%, color-mix(in oklab, ${sage.accent} 18%, var(--color-card)) 0%, var(--color-card) 70%)`,
        border: "2px solid var(--color-border)",
        boxShadow: `0 0 0 4px color-mix(in oklab, ${sage.accent} 8%, transparent)`,
      }}
      aria-label={sage.name}
    >
      <span className="relative">{sage.avatar}</span>
    </div>
  );
}
