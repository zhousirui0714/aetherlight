import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { SAGES, findSage } from "@/lib/sages";
import { SageAvatar } from "./dialogue.index";
import { clearDialogue, listAllDialogues, type DialogueSummary } from "@/lib/dialogue-storage";
import { Trash2, ArrowRight, MessageSquare, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dialogue/history")({
  head: () => ({
    meta: [
      { title: "历史对话 · 与古人对话 · 溯光" },
      { name: "description", content: "回看你与各位古人的过往对话，可继续对谈或清空记录。" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const navigate = useNavigate();
  const [summaries, setSummaries] = useState<DialogueSummary[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const list = await listAllDialogues(SAGES.map((s) => s.id));
    setSummaries(list);
    setLoading(false);
    if (!selected && list.length > 0) setSelected(list[0].sageId);
    if (selected && !list.find((s) => s.sageId === selected)) {
      setSelected(list[0]?.sageId ?? null);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (sageId: string) => {
    await clearDialogue(sageId);
    setConfirmDelete(null);
    toast("已清空对话");
    await refresh();
  };

  return (
    <AppShell>
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">首页</Link>
        <span className="mx-2 text-border">/</span>
        <Link to="/dialogue" className="hover:text-foreground">与古人对话</Link>
        <span className="mx-2 text-border">/</span>
        <span className="text-foreground/80">历史记录</span>
      </nav>

      <div className="mb-8 text-center">
        <div className="font-serif text-xs tracking-[0.4em] text-accent">DIALOGUE HISTORY</div>
        <h1 className="mt-3 font-serif text-4xl text-foreground">历 史 对 话</h1>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 font-serif text-sm text-muted-foreground">加载中...</p>
        </div>
      ) : summaries.length === 0 ? (
        <EmptyState onGo={() => navigate({ to: "/dialogue" })} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          {/* sage list */}
          <aside className="rounded-3xl border border-border bg-card p-3">
            <ul className="space-y-1">
              {summaries.map((s) => {
                const sage = findSage(s.sageId);
                if (!sage) return null;
                const active = selected === s.sageId;
                return (
                  <li key={s.sageId}>
                    <button
                      onClick={() => setSelected(s.sageId)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${
                        active ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-secondary"
                      }`}
                    >
                      <SageAvatar sage={sage} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="font-serif text-sm">{sage.name}</p>
                        <p className="text-[11px] text-muted-foreground">{s.count} 条对话</p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* details */}
          <section className="rounded-3xl border border-border bg-card p-8">
            {selected && (() => {
              const sage = findSage(selected);
              const summary = summaries.find((s) => s.sageId === selected);
              if (!sage || !summary) return null;
              return (
                <>
                  <div className="flex items-start gap-4">
                    <SageAvatar sage={sage} size={72} />
                    <div className="min-w-0 flex-1">
                      <h2 className="font-serif text-2xl text-foreground">{sage.name}</h2>
                      <p className="text-xs tracking-widest text-muted-foreground">{sage.dynasty}</p>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {sage.styles.map((t) => (
                          <span key={t} className="rounded-full border border-border bg-background/40 px-2.5 py-0.5 text-[11px] font-serif text-accent">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="my-6 h-px bg-border" />

                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    共 <span className="font-serif text-foreground">{summary.count}</span> 条对话
                  </div>

                  <div className="mt-4 rounded-2xl border border-border bg-background/40 p-5">
                    <p className="text-xs font-serif tracking-widest text-muted-foreground">最 后 一 句</p>
                    <p className="mt-2 font-serif leading-loose text-foreground/85">
                      {summary.lastText || "（暂无内容）"}
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Link
                      to="/dialogue/$id"
                      params={{ id: sage.id }}
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-serif text-sm tracking-widest text-primary-foreground transition hover:opacity-90"
                    >
                      继续对话 <ArrowRight className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => setConfirmDelete(sage.id)}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm text-muted-foreground transition hover:border-destructive/40 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" /> 删除记录
                    </button>
                  </div>
                </>
              );
            })()}
          </section>
        </div>
      )}

      {confirmDelete && (() => {
        const sage = findSage(confirmDelete);
        if (!sage) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4 backdrop-blur" onClick={() => setConfirmDelete(null)}>
            <div className="w-full max-w-md rounded-3xl border border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h3 className="font-serif text-lg">清空确认</h3>
                <button onClick={() => setConfirmDelete(null)} className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-6">
                <p className="font-serif leading-loose text-foreground">
                  确定清空与 <span className="text-primary">{sage.name}</span> 的全部对话吗？
                </p>
                <p className="mt-2 text-sm text-muted-foreground">删除后将无法恢复。</p>
              </div>
              <div className="flex gap-2 border-t border-border bg-background/40 p-4">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-full border border-border bg-card py-2.5 text-sm hover:bg-secondary">
                  取消
                </button>
                <button onClick={() => handleDelete(sage.id)} className="flex-1 rounded-full bg-destructive py-2.5 text-sm text-destructive-foreground hover:opacity-90">
                  确认清空
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </AppShell>
  );
}

function EmptyState({ onGo }: { onGo: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-dashed border-border bg-card/40 py-16 text-center">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-border bg-background/40 font-serif text-3xl text-muted-foreground">
        书
      </div>
      <p className="font-serif text-lg text-foreground">尚未与任何古人对话</p>
      <p className="mt-2 text-sm text-muted-foreground">去角色市场结识一位雅士罢</p>
      <button
        onClick={onGo}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-serif text-sm tracking-widest text-primary-foreground hover:opacity-90"
      >
        去逛角色市场 <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
