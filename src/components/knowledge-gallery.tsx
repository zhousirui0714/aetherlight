import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, Search } from "lucide-react";
import { ARTICLES, CATEGORIES, type Article } from "@/lib/knowledge-data";

export function KnowledgeGallery() {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("全部");
  const [q, setQ] = useState("");

  const items = useMemo(() => {
    let list: Article[] = ARTICLES;
    if (cat !== "全部") list = list.filter((a) => a.category === cat);
    if (q.trim()) {
      const k = q.trim().toLowerCase();
      list = list.filter(
        (a) => a.title.toLowerCase().includes(k) || a.excerpt.toLowerCase().includes(k),
      );
    }
    return list;
  }, [cat, q]);

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <h3 className="font-serif text-lg tracking-[0.3em] text-foreground/80">知识长廊</h3>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="mb-3 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索典籍、诗词、人物..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
        />
      </div>

      <div className="-mx-4 mb-4 overflow-x-auto px-4">
        <div className="flex gap-2 pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-serif tracking-wider transition ${
                cat === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
          <p className="font-serif">未撷得相关篇章</p>
          <p className="mt-1 text-xs">换一个关键词试试</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
          {items.map((a, i) => (
            <Link
              key={a.id}
              to="/article/$id"
              params={{ id: a.id }}
              style={{ animationDelay: `${i * 50}ms` }}
              className="scroll-in group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex h-28 items-center justify-center bg-gradient-to-br from-secondary to-background text-5xl">
                {a.cover}
              </div>
              <div className="flex flex-1 flex-col gap-1.5 p-3">
                <span className="text-[10px] font-serif tracking-widest text-accent">{a.category}</span>
                <h4 className="font-serif text-base font-semibold leading-snug text-foreground line-clamp-2">{a.title}</h4>
                <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">{a.excerpt}</p>
                <div className="mt-auto flex items-center gap-1 pt-1 text-[11px] text-muted-foreground">
                  <Heart className="h-3 w-3" /> {a.favorites.toLocaleString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
