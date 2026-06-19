import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Send, Sparkles, ThumbsUp, Heart, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "问答助手 · 溯光" },
      { name: "description", content: "向 AI 雅士请教中国传统文化，每答皆有出处。" },
    ],
  }),
  component: ChatPage,
});

const HOT_QUESTIONS = [
  "什么是二十四节气？",
  "端午节的由来？",
  "为什么中秋要赏月？",
  "苏东坡有哪些代表作？",
  "《诗经》的'风雅颂'指什么？",
  "昆曲为何被称为'百戏之祖'？",
];

type HistoryItem = { id: string; question: string; created_at: string };

function ChatPage() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const transport = useRef(new DefaultChatTransport({ api: "/api/chat" }));
  const { messages, sendMessage, status } = useChat({
    transport: transport.current,
    onFinish: async ({ message }) => {
      try {
        const { data } = await supabase.auth.getSession();
        const uid = data.session?.user?.id;
        if (!uid) return;
        const lastUser = [...messages].reverse().find((m) => m.role === "user");
        const q = lastUser ? extractText(lastUser) : "";
        const a = extractText(message);
        if (q && a) {
          await supabase.from("qa_history").insert({ user_id: uid, question: q, answer: a });
          loadHistory();
        }
      } catch {}
    },
  });

  const loadHistory = async () => {
    try {
      const { data } = await supabase
        .from("qa_history")
        .select("id, question, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setHistory(data as HistoryItem[]);
    } catch {}
  };

  useEffect(() => { loadHistory(); }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const loading = status === "submitted" || status === "streaming";

  const submit = (text: string) => {
    if (!text.trim() || loading) return;
    sendMessage({ text });
    setInput("");
  };

  return (
    <AppShell>
      <div className="mb-8 text-center">
        <div className="font-serif text-xs tracking-[0.4em] text-accent">ASK THE SAGE</div>
        <h1 className="mt-3 font-serif text-4xl text-foreground">问 道 雅 士</h1>
        <p className="mt-2 text-sm text-muted-foreground">关于诗词、节气、典籍、人物 —— 一问即得</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* main chat */}
        <section className="flex h-[calc(100vh-260px)] min-h-[560px] flex-col overflow-hidden rounded-3xl border border-border bg-card">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h2 className="font-serif text-2xl text-foreground">向雅士请教</h2>
                <p className="mt-2 text-sm text-muted-foreground">不妨从下面这些问题开始</p>
                <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
                  {HOT_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => submit(q)}
                      className="group rounded-2xl border border-border bg-background/40 px-5 py-4 text-left text-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-secondary"
                    >
                      <span className="font-serif text-base text-foreground group-hover:text-primary">{q}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((m) => <Message key={m.id} m={m} />)}
                {status === "submitted" && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                    <span className="font-serif text-sm">研墨中…</span>
                  </div>
                )}
              </div>
            )}
          </div>

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
              placeholder="向雅士请教…"
              rows={1}
              className="max-h-32 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/70"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-10 items-center gap-2 rounded-full bg-primary px-5 font-serif text-sm tracking-widest text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
            >
              <Send className="h-4 w-4" /> 发送
            </button>
          </form>
        </section>

        {/* history sidebar */}
        <aside className="rounded-3xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-accent" />
            <h3 className="font-serif text-base tracking-[0.25em] text-foreground/80">历 史 问 答</h3>
          </div>
          {history.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              登录后可查看您与雅士的过往对谈
            </p>
          ) : (
            <ul className="space-y-2">
              {history.map((h) => (
                <li key={h.id}>
                  <button
                    onClick={() => submit(h.question)}
                    className="block w-full rounded-xl border border-transparent px-3 py-2.5 text-left text-sm text-foreground/80 transition hover:border-border hover:bg-secondary"
                  >
                    <p className="line-clamp-2 font-serif">{h.question}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {new Date(h.created_at).toLocaleDateString("zh-CN")}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </AppShell>
  );
}

function extractText(m: UIMessage) {
  return m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

function Message({ m }: { m: UIMessage }) {
  const text = extractText(m);
  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-2xl rounded-br-md bg-primary px-5 py-3 text-primary-foreground shadow-sm">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
        </div>
      </div>
    );
  }
  // separate body and source
  const sourceMatch = text.match(/(——[\s\S]+)$/);
  const body = sourceMatch ? text.slice(0, sourceMatch.index).trimEnd() : text;
  const source = sourceMatch ? sourceMatch[1].trim() : null;
  return (
    <div className="flex gap-3">
      <div className="seal mt-1 h-7 shrink-0 px-2.5">溯</div>
      <div className="flex-1 rounded-2xl rounded-tl-md border border-border bg-background/40 p-5">
        <p className="whitespace-pre-wrap font-serif leading-[2] text-foreground">{body}</p>
        {source && (
          <p className="mt-3 text-xs italic text-muted-foreground">{source}</p>
        )}
        <div className="mt-4 flex items-center gap-1 border-t border-border/60 pt-3 text-muted-foreground">
          <button className="flex items-center gap-1 rounded-full px-3 py-1 text-xs hover:bg-secondary hover:text-foreground">
            <ThumbsUp className="h-3.5 w-3.5" /> 赞
          </button>
          <button className="flex items-center gap-1 rounded-full px-3 py-1 text-xs hover:bg-secondary hover:text-foreground">
            <Heart className="h-3.5 w-3.5" /> 收藏
          </button>
        </div>
      </div>
    </div>
  );
}
