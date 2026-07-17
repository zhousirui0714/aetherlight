import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { BOOKS, type BookEntry } from "@/lib/books";
import { BookOpen, Search, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/book/")({
  head: () => ({
    meta: [
      { title: "典籍对话 · 溯光" },
      { name: "description", content: "与千年典籍对话，向 AI 学者请教经史子集。" },
    ],
  }),
  component: BookMarket,
});

const CATEGORIES = ["全部", "经部", "史部", "子部", "集部", "笔记", "其他"];

function BookMarket() {
  const [cat, setCat] = useState("全部");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    let items = BOOKS;
    if (cat !== "全部") items = items.filter((b) => b.category === cat);
    if (q.trim()) {
      const k = q.trim().toLowerCase();
      items = items.filter(
        (b) =>
          b.title.includes(k) ||
          b.author.includes(k) ||
          b.brief.includes(k)
      );
    }
    return items;
  }, [cat, q]);

  return (
    <AppShell>
      <div className="mb-10 text-center">
        <div className="font-serif text-xs tracking-[0.4em] text-accent">DIALOGUE WITH THE CLASSICS</div>
        <h1 className="mt-3 font-serif text-4xl text-foreground">典 籍 对 话</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          与千年典籍对话，向 AI 学者请教经史子集
        </p>
      </div>

      <div className="mb-8 flex flex-col items-center gap-5">
        <div className="flex w-full max-w-xl items-center gap-2 rounded-full border border-border bg-card px-5 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索典籍..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          />
          {q && (
            <button onClick={() => setQ("")} className="text-muted-foreground hover:text-foreground">
              ×
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1">
          {CATEGORIES.map((c) => {
            const active = cat === c;
            return (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`relative px-4 py-2 font-serif text-sm tracking-widest transition ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
                {active && <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>

      {list.length === 0 && (
        <div className="py-20 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="mt-4 font-serif text-lg text-muted-foreground">未找到相关典籍</p>
        </div>
      )}
    </AppShell>
  );
}

function BookCard({ book }: { book: BookEntry }) {
  const categoryColors: Record<string, string> = {
    "经部": "text-rose-600 border-rose-200 bg-rose-50",
    "史部": "text-blue-600 border-blue-200 bg-blue-50",
    "子部": "text-emerald-600 border-emerald-200 bg-emerald-50",
    "集部": "text-purple-600 border-purple-200 bg-purple-50",
  };
  const color = categoryColors[book.category] || "text-amber-600 border-amber-200 bg-amber-50";

  return (
    <Link
      to="/book/$id"
      params={{ id: book.id }}
      className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-1 hover:shadow-md hover:border-primary/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${color}`}>
          {book.category}
        </span>
      </div>
      <h3 className="mt-4 font-serif text-lg text-foreground group-hover:text-primary transition">
        {book.title}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {book.author} · {book.dynasty} · {book.chapterCount} 章
      </p>
      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground/80 leading-relaxed">
        {book.brief}
      </p>
      {book.excerpt && (
        <p className="mt-3 line-clamp-2 text-[11px] text-foreground/60 italic leading-relaxed border-t border-border/50 pt-3">
          {book.excerpt}
        </p>
      )}
      <div className="mt-auto pt-4 flex items-center gap-1 text-xs text-primary/70 opacity-0 transition group-hover:opacity-100">
        <span>开始对话</span>
        <ChevronRight className="h-3 w-3" />
      </div>
    </Link>
  );
}
