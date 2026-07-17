import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { BOOKS, findBook, type BookEntry } from "@/lib/books";
import { BookOpen, Send, RotateCw, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/book/$id")({
  loader: ({ params }) => {
    const book = findBook(params.id);
    if (!book) throw notFound();
    return { book };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} · 典籍对话 · 溯光` },
          { name: "description", content: loaderData.brief },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <AppShell>
      <div className="py-24 text-center text-muted-foreground">未找到此典籍</div>
    </AppShell>
  ),
  component: BookDialogue,
});

function BookDialogue() {
  const { book } = Route.useLoaderData();
  return <BookRoom key={book.id} book={book} />;
}

function BookRoom({ book }: { book: BookEntry }) {
  const [input, setInput] = useState("");

  const transport = useRef(
    new DefaultChatTransport({
      api: "/api/book-chat",
      body: { bookId: book.id },
    })
  );

  const { messages, sendMessage, setMessages, status, error, regenerate } = useChat({
    id: `book-${book.id}`,
    transport: transport.current,
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
    <AppShell>
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">首页</Link>
        <span className="mx-2 text-border">/</span>
        <Link to="/book" className="hover:text-foreground">典籍对话</Link>
        <span className="mx-2 text-border">/</span>
        <span className="text-foreground/80">{book.title}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-border bg-card p-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                <BookOpen className="h-10 w-10 text-primary" />
              </div>
              <h2 className="mt-4 font-serif text-2xl text-foreground">{book.title}</h2>
              <p className="mt-1 text-xs tracking-widest text-muted-foreground">
                {book.author} · {book.dynasty}
              </p>
              <span className="mt-2 rounded-full border border-border bg-background/40 px-3 py-0.5 text-[11px] font-serif text-accent">
                {book.category}
              </span>
            </div>
            <div className="my-5 h-px bg-border" />
            <div>
              <h4 className="mb-2 font-serif text-xs tracking-[0.3em] text-muted-foreground">简 介</h4>
              <p className="text-sm leading-loose text-foreground/80">{book.brief}</p>
              <p className="mt-3 text-xs text-muted-foreground">共 {book.chapterCount} 章</p>
            </div>
          </div>
        </aside>

        {/* chat area */}
        <section className="flex h-[calc(100vh-220px)] min-h-[600px] flex-col overflow-hidden rounded-3xl border border-border bg-card">
          {/* status bar */}
          <div className="flex items-center justify-between border-b border-border bg-background/40 px-6 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-serif text-sm text-foreground">正在与《{book.title}》对话</p>
                <p className="text-[11px] text-muted-foreground">{book.author} · {book.dynasty}</p>
              </div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => {
                  if (!confirm(`确定清除与《${book.title}》的对话记录吗？`)) return;
                  setMessages([]);
                  toast("对话记录已清除");
                }}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition hover:border-destructive/40 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" /> 清除记录
              </button>
            )}
          </div>

          {/* messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                  <BookOpen className="h-10 w-10 text-primary" />
                </div>
                <h3 className="mt-6 font-serif text-xl text-foreground">向《{book.title}》请教</h3>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">{book.brief}</p>
                <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
                  {[
                    `《${book.title}》的核心思想是什么？`,
                    `介绍一下${book.author}的生平`,
                    `《${book.title}》对后世有什么影响？`,
                    `《${book.title}》中提到的关键概念有哪些？`,
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => submit(q)}
                      className="group rounded-2xl border border-border bg-background/40 px-5 py-4 text-left text-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-secondary"
                    >
                      <span className="font-serif text-sm text-foreground group-hover:text-primary">{q}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((m) => (
                  <BookMessage key={m.id} m={m} book={book} />
                ))}
                {status === "submitted" && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                    <span className="font-serif text-sm italic">研读中…</span>
                  </div>
                )}
                {error && (
                  <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3">
                    <BookOpen className="h-5 w-5 text-destructive/50" />
                    <div className="flex-1 text-sm text-foreground/80">
                      研读暂缓，请稍后再试。
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
              placeholder={`向《${book.title}》请教…`}
              rows={1}
              className="max-h-32 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/70"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-10 items-center gap-2 rounded-full bg-primary px-5 font-serif text-sm tracking-widest text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {loading ? "研读中" : "请教"}
            </button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}

function extractText(m: UIMessage) {
  return m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

function BookMessage({ m, book }: { m: UIMessage; book: BookEntry }) {
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

  const lines = text.split("\n");
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <BookOpen className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 rounded-2xl rounded-tl-md border border-border bg-background/40 p-5">
        {lines.map((line, i) => {
          const t = line.trim();
          if (!t) return <br key={i} />;
          if (/^「.+」/.test(t)) {
            return (
              <blockquote
                key={i}
                className="my-2 border-l-2 border-primary/30 bg-primary/[0.04] py-2 pl-4 pr-2"
              >
                <p className="font-serif italic leading-loose text-foreground/90">{t}</p>
              </blockquote>
            );
          }
          if (/^——/.test(t)) {
            return <p key={i} className="mt-1 text-xs italic text-muted-foreground">{t}</p>;
          }
          return <p key={i} className="font-serif leading-[2] text-foreground">{t}</p>;
        })}
      </div>
    </div>
  );
}
