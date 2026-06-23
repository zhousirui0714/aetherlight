import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { findSage, SAGES, type Sage } from "@/lib/sages";
import { SageAvatar } from "./dialogue.index";
import { Send, Share2, Users, X, Copy, Download, RotateCw, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import {
  loadDialogue, saveDialogue,
} from "@/lib/dialogue-storage";
import { trackEvent } from "@/lib/journey-storage";

export const Route = createFileRoute("/dialogue/$id")({
  loader: ({ params }) => {
    const sage = findSage(params.id);
    if (!sage) throw notFound();
    return { sage };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `与 ${loaderData.sage.name} 对话 · 溯光` },
          { name: "description", content: `${loaderData.sage.intro}` },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <AppShell>
      <div className="py-24 text-center text-muted-foreground">未识此人</div>
    </AppShell>
  ),
  component: SageDialogue,
});

function SageDialogue() {
  const { sage } = Route.useLoaderData();
  // remount on sage change → useChat reinitializes with seeded messages
  return <SageRoom key={sage.id} sage={sage} />;
}

function SageRoom({ sage }: { sage: Sage }) {
  const [input, setInput] = useState("");
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const transport = useRef(new DefaultChatTransport({
    api: "/api/dialogue",
    body: { sageId: sage.id },
  }));

  const { messages, sendMessage, setMessages, status, error, regenerate } = useChat({
    id: `sage-${sage.id}`,
    transport: transport.current,
  });

  // hydrate from cloud/localStorage on client
  useEffect(() => {
    const hydrate = async () => {
      const seeded = await loadDialogue(sage.id);
      if (seeded.length > 0) setMessages(seeded);
    };
    hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sage.id]);

  // persist on each update
  useEffect(() => {
    if (messages.length > 0) saveDialogue(sage.id, messages);
  }, [messages, sage.id]);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const loading = status === "submitted" || status === "streaming";

  const submit = (text: string) => {
    if (!text.trim() || loading) return;
    sendMessage({ text });
    setInput("");
    
    // 首次对话时记录历程
    if (messages.filter(m => m.role === "user").length === 0) {
      trackEvent({
        type: "dialogue_chat",
        title: `与${sage.name}对话`,
        description: sage.intro || "开启一段跨越时空的对话",
        category: sage.dynasty || "对话",
      });
    }
  };

  return (
    <AppShell>
      {/* breadcrumb */}
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">首页</Link>
        <span className="mx-2 text-border">/</span>
        <Link to="/dialogue" className="hover:text-foreground">与名家对话</Link>
        <span className="mx-2 text-border">/</span>
        <span className="text-foreground/80">{sage.name}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-border bg-card p-6">
            <div className="flex flex-col items-center text-center">
              <SageAvatar sage={sage} size={120} />
              <h2 className="mt-4 font-serif text-2xl text-foreground">{sage.name}</h2>
              <p className="mt-1 text-xs tracking-widest text-muted-foreground">{sage.dynasty}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-1">
                {sage.styles.map((t) => (
                  <span key={t} className="rounded-full border border-border bg-background/40 px-2.5 py-0.5 text-[11px] font-serif text-accent">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="my-5 h-px bg-border" />

            <div>
              <h4 className="mb-2 font-serif text-xs tracking-[0.3em] text-muted-foreground">小 传</h4>
              <p className="text-sm leading-loose text-foreground/80">{sage.intro}</p>
            </div>

            <div className="mt-5">
              <h4 className="mb-2 font-serif text-xs tracking-[0.3em] text-muted-foreground">代 表 作</h4>
              <ul className="space-y-1.5 text-sm font-serif text-foreground/85">
                {sage.works.map((w) => (
                  <li key={w} className="flex items-start gap-2">
                    <span className="mt-2 h-1 w-1 rounded-full bg-primary" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => setShowSwitcher((v) => !v)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background/40 py-2.5 font-serif text-sm tracking-widest text-foreground/80 transition hover:border-primary/40 hover:text-primary"
            >
              <Users className="h-4 w-4" /> 切换名家
              <ChevronDown className={`h-4 w-4 transition-transform ${showSwitcher ? "rotate-180" : ""}`} />
            </button>

            {showSwitcher && (
              <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl border border-border bg-background/40 p-3">
                {SAGES.map((s) => (
                  <Link
                    key={s.id}
                    to="/dialogue/$id"
                    params={{ id: s.id }}
                    onClick={() => setShowSwitcher(false)}
                    className={`flex flex-col items-center gap-1 rounded-xl p-2 text-center text-sm transition hover:bg-secondary ${
                      s.id === sage.id ? "border border-primary/40 bg-primary/5 text-primary" : "text-foreground/80"
                    }`}
                  >
                    <span className="font-serif text-lg">{s.avatar}</span>
                    <span className="font-serif text-xs">{s.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* chat area */}
        <section className="flex h-[calc(100vh-220px)] min-h-[600px] flex-col overflow-hidden rounded-3xl border border-border bg-card">
          {/* status bar */}
          <div className="flex items-center justify-between border-b border-border bg-background/40 px-6 py-3">
            <div className="flex items-center gap-3">
              <SageAvatar sage={sage} size={36} />
              <div>
                <p className="font-serif text-sm text-foreground">正在与 {sage.name} 对话</p>
                <p className="text-[11px] text-muted-foreground">{sage.dynasty}</p>
              </div>
            </div>
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-primary"
            >
              <Share2 className="h-3.5 w-3.5" /> 分享对话
            </button>
          </div>

          {/* messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6">
            {messages.length === 0 ? (
              <GreetingState sage={sage} />
            ) : (
              <div className="space-y-6">
                {messages.map((m) => <SageMessage key={m.id} m={m} sage={sage} />)}
                {status === "submitted" && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <SageAvatar sage={sage} size={32} />
                    <span className="font-serif text-sm italic">{sage.name} 正在提笔…</span>
                  </div>
                )}
                {error && (
                  <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3">
                    <div className="relative grayscale opacity-60">
                      <SageAvatar sage={sage} size={36} />
                    </div>
                    <div className="flex-1 text-sm text-foreground/80">
                      {sage.name} 暂不在书房，请稍后再访。
                    </div>
                    <button
                      onClick={() => regenerate()}
                      className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:opacity-90"
                    >
                      <RotateCw className="h-3 w-3" /> 重试
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* composer */}
          <form
            onSubmit={(e) => { e.preventDefault(); submit(input); }}
            className="flex items-end gap-2 border-t border-border bg-background/30 p-4"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(input); }
              }}
              placeholder={`向 ${sage.name} 请教…`}
              rows={1}
              className="max-h-32 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/70"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-10 items-center gap-2 rounded-full bg-primary px-5 font-serif text-sm tracking-widest text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
            >
              <Send className="h-4 w-4" /> 寄语
            </button>
          </form>
        </section>
      </div>

      {showShare && <ShareModal sage={sage} messages={messages} onClose={() => setShowShare(false)} />}
    </AppShell>
  );
}

function GreetingState({ sage }: { sage: Sage }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <SageAvatar sage={sage} size={96} />
      <h3 className="mt-6 font-serif text-xl text-foreground">{sage.name} 已在书房候你</h3>
      <div className="mt-6 max-w-lg rounded-3xl border-l-2 border-[var(--color-bronze)] bg-background/40 px-6 py-5 text-left">
        <p className="font-serif italic leading-loose text-foreground/85">
          「{sage.greeting}」
        </p>
        <p className="mt-2 text-xs text-muted-foreground">—— {sage.name}</p>
      </div>
      <p className="mt-6 text-xs text-muted-foreground">在下方输入框中作答，便可开启对谈</p>
    </div>
  );
}

function extractText(m: UIMessage) {
  return m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

/** parse out 「...」quotation blocks for stylized rendering */
function renderAssistant(text: string) {
  // split on lines starting with 「 ... 」 (allow trailing source)
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const t = line.trim();
    if (!t) return <br key={i} />;
    if (/^「.+」/.test(t)) {
      return (
        <blockquote
          key={i}
          className="my-2 border-l-2 border-[var(--color-bronze)] bg-[color-mix(in_oklab,var(--color-bronze)_6%,transparent)] py-2 pl-4 pr-2"
        >
          <p className="font-serif italic leading-loose text-foreground/90">{t}</p>
        </blockquote>
      );
    }
    if (/^——/.test(t)) {
      return <p key={i} className="mt-1 text-xs italic text-muted-foreground">{t}</p>;
    }
    return <p key={i} className="font-serif leading-[2] text-foreground">{t}</p>;
  });
}

function SageMessage({ m, sage }: { m: UIMessage; sage: Sage }) {
  const text = extractText(m);
  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-2xl rounded-br-md bg-foreground px-5 py-3 text-background shadow-sm">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <SageAvatar sage={sage} size={36} />
      <div className="flex-1 rounded-2xl rounded-tl-md border border-border bg-background/40 p-5">
        {renderAssistant(text)}
      </div>
    </div>
  );
}

function ShareModal({
  sage, messages, onClose,
}: { sage: Sage; messages: UIMessage[]; onClose: () => void }) {
  const snippets = messages.slice(-4); // last 4 messages

  const buildText = () =>
    `【与 ${sage.name} 对话 · 溯光】\n\n` +
    snippets.map((m) => `${m.role === "user" ? "我" : sage.name}：${extractText(m)}`).join("\n\n") +
    `\n\n—— suguang.app`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast("链接已复制");
    } catch { toast.error("复制失败"); }
  };

  const downloadImage = async () => {
    // simple text-to-image via canvas
    const lines = buildText().split("\n");
    const W = 900, padding = 60, lineH = 30;
    const H = padding * 2 + lines.length * lineH + 80;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // bg
    ctx.fillStyle = "#F5F0E8"; ctx.fillRect(0, 0, W, H);
    // border
    ctx.strokeStyle = "#C43A30"; ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, W - 40, H - 40);
    // header
    ctx.fillStyle = "#C43A30";
    ctx.font = "bold 28px 'Noto Serif SC', serif";
    ctx.fillText(`与 ${sage.name} 对话 · 溯光`, padding, padding + 10);
    // body
    ctx.fillStyle = "#2C2C2C";
    ctx.font = "18px 'Noto Serif SC', serif";
    lines.forEach((line, i) => {
      ctx.fillText(line, padding, padding + 60 + i * lineH);
    });
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `溯光-${sage.name}-对话.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast("长图已下载");
    }, "image/png");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4 backdrop-blur" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="font-serif text-lg">分享与 {sage.name} 的对话</h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-6">
          <div className="relative rounded-2xl border-2 border-primary/60 bg-background/60 p-6">
            <div className="mb-4 flex items-center gap-3">
              <SageAvatar sage={sage} size={48} />
              <div>
                <h4 className="font-serif text-lg">{sage.name}</h4>
                <p className="text-xs text-muted-foreground">{sage.dynasty}</p>
              </div>
            </div>
            {snippets.length === 0 ? (
              <p className="text-sm text-muted-foreground">尚无对话内容可供分享</p>
            ) : (
              <div className="space-y-3 text-sm">
                {snippets.map((m) => (
                  <p key={m.id} className="leading-relaxed">
                    <span className="font-serif text-primary">{m.role === "user" ? "我" : sage.name}：</span>
                    <span className="text-foreground/85">{extractText(m).slice(0, 140)}{extractText(m).length > 140 ? "…" : ""}</span>
                  </p>
                ))}
              </div>
            )}
            <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
              <span className="seal text-[10px]">溯光</span>
              <span className="font-serif tracking-widest">SUGUANG · 活化中国传统文化</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 border-t border-border bg-background/40 p-4">
          <button
            onClick={copyLink}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-card py-2.5 text-sm hover:bg-secondary"
          >
            <Copy className="h-4 w-4" /> 复制链接
          </button>
          <button
            onClick={downloadImage}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm text-primary-foreground hover:opacity-90"
          >
            <Download className="h-4 w-4" /> 下载长图
          </button>
        </div>
      </div>
    </div>
  );
}
