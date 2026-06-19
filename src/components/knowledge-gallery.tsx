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
    <section className="mt-24">
      <div className="mb-8 text-center">
        <div className="font-serif text-xs tracking-[0.4em] text-accent">THEME GALLERY</div>
        <h2 className="mt-2 font-serif text-3xl text-foreground">主题知识长廊</h2>
        <p className="mt-2 text-sm text-muted-foreground">节气流转，诗书相传 · 撷取文明长河中的一缕光</p>
      </div>

      <div className="mb-6 flex flex-col items-center gap-5">
        <div className="flex w-full max-w-xl items-center gap-2 rounded-full border border-border bg-card px-5 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索你感兴趣的知识..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          />
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
                {active && (
                  <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-20 text-center text-muted-foreground">
          <p className="font-serif text-lg">未撷得相关篇章</p>
          <p className="mt-2 text-sm">换一个关键词试试</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a, i) => (
            <Link
              key={a.id}
              to="/article/$id"
              params={{ id: a.id }}
              style={{ animationDelay: `${i * 40}ms` }}
              className="scroll-in group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.25)]"
            >
              <div className="relative h-[180px] w-full overflow-hidden bg-gradient-to-br from-secondary via-background to-secondary">
                <div className="absolute inset-0 opacity-40" style={{
                  background: "radial-gradient(circle at 30% 40%, var(--color-bronze) 0%, transparent 45%), radial-gradient(circle at 75% 70%, var(--color-cinnabar) 0%, transparent 40%)",
                }} />
                <div className="absolute inset-0 flex items-center justify-center text-7xl transition-transform duration-500 group-hover:scale-110">
                  {a.cover}
                </div>
                <span className="absolute left-3 top-3 rounded-full bg-background/80 px-2.5 py-0.5 text-[10px] font-serif tracking-widest text-accent backdrop-blur">
                  {a.category}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <h3 className="font-serif text-lg font-semibold leading-snug text-foreground line-clamp-2 group-hover:text-primary">
                  {a.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">{a.excerpt}</p>
                <div className="mt-auto flex items-center gap-1.5 pt-2 text-xs text-muted-foreground">
                  <Heart className="h-3.5 w-3.5" /> {a.favorites.toLocaleString()} 收藏
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
