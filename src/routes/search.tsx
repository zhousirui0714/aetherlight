import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { Search, User, BookOpen, MessageSquare, Palette, Lightbulb, ArrowRight, Sparkles, ScrollText } from "lucide-react";
import { searchAll, type SearchResult } from "@/components/global-search";

type SearchSearch = { q?: string };

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "探索中华文明 · 溯光" },
      { name: "description", content: "在溯光中搜索诗词、人物、典籍、节日、神话等中华文化主题。" },
    ],
  }),
  validateSearch: (input: Record<string, unknown>): SearchSearch => ({
    q: typeof input.q === "string" ? input.q : "",
  }),
  component: SearchPage,
});

const TYPE_LABELS: Record<SearchResult["type"], string> = {
  knowledge: "概念",
  person: "人物",
  book: "典籍",
  poetry: "诗词",
  article: "文章",
  post: "帖子",
  creation: "创作",
};

function TypeIcon({ type, className = "h-4 w-4" }: { type: SearchResult["type"]; className?: string }) {
  switch (type) {
    case "person": return <User className={className} />;
    case "article": return <BookOpen className={className} />;
    case "post": return <MessageSquare className={className} />;
    case "creation": return <Palette className={className} />;
    case "knowledge": return <Lightbulb className={className} />;
    case "poetry": return <ScrollText className={className} />;
    case "book": return <BookOpen className={className} />;
  }
}

function SearchPage() {
  const { q: initialQ } = Route.useSearch();
  const navigate = useNavigate();
  const [input, setInput] = useState(initialQ || "");
  const [query, setQuery] = useState(initialQ || "");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // 同步 URL ?q= → input/query
  useEffect(() => {
    if (initialQ !== undefined) {
      setInput(initialQ);
      setQuery(initialQ);
    }
  }, [initialQ]);

  // 执行搜索
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    let cancelled = false;
    searchAll(query).then((found) => {
      if (!cancelled) {
        setResults(found);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<SearchResult["type"], SearchResult[]>();
    results.forEach((r) => {
      if (!map.has(r.type)) map.set(r.type, []);
      map.get(r.type)!.push(r);
    });
    return Array.from(map.entries());
  }, [results]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = input.trim();
    navigate({ to: "/search", search: { q: v || undefined }, replace: true });
  };

  const handleResultClick = (r: SearchResult) => {
    switch (r.type) {
      case "person":
        navigate({ to: "/chat", search: { sage: r.id } });
        break;
      case "article":
        navigate({ to: "/article/$id", params: { id: r.id } });
        break;
      case "post":
        navigate({ to: "/community/$id", params: { id: r.id } });
        break;
      case "creation":
        navigate({ to: "/create" });
        break;
      default:
        navigate({ to: "/chat", search: { q: r.title } });
    }
  };

  return (
    <AppShell>
      <section className="mx-auto max-w-4xl px-6 pt-16 pb-12">
        {/* Hero 标题 */}
        <div className="mb-8 text-center">
          <div className="font-serif text-xs tracking-[0.4em] text-accent">EXPLORE CHINESE CIVILIZATION</div>
          <h1 className="mt-3 font-serif text-4xl text-foreground md:text-5xl">探索中华文明</h1>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            搜索关键词，发现诗词、人物、典籍、节日、神话与非遗。
          </p>
        </div>

        {/* 搜索框 */}
        <form onSubmit={handleSubmit} className="relative mx-auto max-w-2xl">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="李白 / 端午节 / 山海经 / 唐诗..."
            className="w-full rounded-full border-2 border-primary/20 bg-card px-14 py-4 font-serif text-lg text-foreground outline-none transition focus:border-primary focus:shadow-lg"
            autoFocus
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1.5 rounded-full bg-primary px-5 py-2 font-serif text-sm tracking-[0.2em] text-primary-foreground transition hover:opacity-90"
          >
            搜索
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* 关键词建议 */}
        {!query && (
          <div className="mt-8 text-center">
            <p className="mb-3 text-xs text-muted-foreground">热门搜索：</p>
            <div className="flex flex-wrap justify-center gap-2">
              {["李白", "孔子", "诗经", "端午节", "敦煌", "山海经", "宋词", "中医"].map((kw) => (
                <button
                  key={kw}
                  onClick={() => {
                    setInput(kw);
                    navigate({ to: "/search", search: { q: kw }, replace: true });
                  }}
                  className="rounded-full border border-border bg-card px-4 py-1.5 font-serif text-sm text-foreground/80 transition hover:border-primary hover:text-primary"
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 搜索结果 */}
      {query && (
        <section className="mx-auto max-w-4xl px-6 pb-24">
          {loading && (
            <div className="py-12 text-center text-sm text-muted-foreground">正在搜索…</div>
          )}

          {!loading && results.length === 0 && (
            <div className="py-16 text-center">
              <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <p className="mt-4 font-serif text-lg text-muted-foreground">未找到与 "{query}" 相关的内容</p>
              <p className="mt-2 text-sm text-muted-foreground">试试其他关键词，或浏览下方分类</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-10">
              <div className="text-sm text-muted-foreground">
                找到 <span className="font-serif text-base text-primary">{results.length}</span> 条结果
              </div>
              {grouped.map(([type, items]) => (
                <div key={type}>
                  <div className="mb-3 flex items-center gap-2">
                    <TypeIcon type={type} className="h-4 w-4 text-primary" />
                    <h3 className="font-serif text-sm tracking-[0.3em] text-foreground">
                      {TYPE_LABELS[type]}
                    </h3>
                    <span className="text-xs text-muted-foreground">({items.length})</span>
                  </div>
                  <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
                    {items.map((r) => (
                      <li key={`${type}-${r.id}`}>
                        <button
                          onClick={() => handleResultClick(r)}
                          className="group flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-secondary"
                        >
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <TypeIcon type={type} className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-serif text-base text-foreground group-hover:text-primary">
                              {r.title}
                            </div>
                            {r.subtitle && (
                              <div className="mt-0.5 text-xs text-accent">{r.subtitle}</div>
                            )}
                            {r.description && (
                              <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                {r.description}
                              </div>
                            )}
                          </div>
                          <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </AppShell>
  );
}
