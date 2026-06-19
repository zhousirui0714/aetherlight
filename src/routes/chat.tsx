import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Send, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "对话 · 溯光" }, { name: "description", content: "向 AI 雅士请教中国传统文化。" }] }),
  component: ChatPage,
});

const HOT_QUESTIONS = [
  "什么是二十四节气?",
  "端午节的由来?",
  "苏东坡有哪些代表作?",
  "《诗经》的'风雅颂'指什么?",
  "昆曲为何被称为'百戏之祖'?",
];

function ChatPage() {
  const [input, setInput] = useState("");
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
        }
      } catch {}
    },
  });

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
    <AppShell title="问道">
      <div className="flex h-[calc(100vh-12rem)] flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto pb-4">
          {messages.length === 0 ? (
            <div className="py-8">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h2 className="font-serif text-xl">问雅士</h2>
                <p className="mt-1 text-sm text-muted-foreground">关于诗词、节气、典籍,皆可一问</p>
              </div>
              <div className="space-y-2">
                <p className="px-2 text-xs font-serif tracking-widest text-muted-foreground">热门问题</p>
                {HOT_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => submit(q)}
                    className="block w-full rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm transition hover:border-primary/40 hover:bg-secondary"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5 pt-4">
              {messages.map((m) => (
                <Message key={m.id} m={m} />
              ))}
              {status === "submitted" && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                  <span className="font-serif text-sm">研墨中...</span>
                </div>
              )}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); submit(input); }}
          className="sticky bottom-20 flex items-end gap-2 rounded-3xl border border-border bg-card/90 p-2 shadow-lg backdrop-blur"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(input); }
            }}
            placeholder="向雅士请教..."
            rows={1}
            className="flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/70"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
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
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-primary-foreground">
          <p className="whitespace-pre-wrap text-sm">{text}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <div className="seal mt-1 h-6 shrink-0">溯</div>
      <div className="flex-1">
        <p className="whitespace-pre-wrap font-serif leading-loose text-foreground">{text}</p>
      </div>
    </div>
  );
}
