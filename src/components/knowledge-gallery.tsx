import { useMemo, useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, Search, Loader2, Database } from "lucide-react";
import { ARTICLES, type Article } from "@/lib/knowledge-data";
import { supabase } from "@/integrations/supabase/client";
import { ArticleIllustration } from "./article-illustration";

type DbArticle = {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  body?: string;
  favorites: number;
  cover: string | null;
  image_prompt?: string;
  created_at: string;
};

// 15 大分类（与 DB / 后端契约一致）
const ALL_CATEGORIES = [
  "全部",
  "节气", "节日", "诗词", "典籍", "非遗", "民俗",
  "人物", "建筑", "神话", "艺术", "哲学", "医学",
  "科技", "饮食", "服饰",
] as const;

// 旧 Article 分类 → 新分类映射
const CATEGORY_ALIAS: Record<string, string> = {
  "诗词文学": "诗词",
  "历史人物": "人物",
  "节日节气": "节气",
  "传统艺术": "艺术",
  "传统技艺": "非遗",
  "民俗文化": "民俗",
  "经典典籍": "典籍",
  "建筑古迹": "建筑",
  "神话传说": "神话",
};

function normalizeCategory(c: string): string {
  return CATEGORY_ALIAS[c] || c;
}

export function KnowledgeGallery() {
  const [cat, setCat] = useState<string>("全部");
  const [q, setQ] = useState("");
  const [articles, setArticles] = useState<DbArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch articles from Supabase
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, fetchError } = await supabase
          .from("knowledge_articles")
          .select("id, title, category, excerpt, favorites, cover, image_prompt, created_at")
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;

        if (data && data.length > 0) {
          setArticles(data);
        } else {
          console.log("Supabase data is empty, using static fallback");
          setArticles([]);
        }
      } catch (err) {
        console.error("Failed to fetch articles from Supabase:", err);
        setArticles([]);
        setError(null);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  // Use Supabase data if available, otherwise fallback to static data
  const displayArticles = useMemo(() => {
    const k = q.trim().toLowerCase();

    if (articles.length > 0) {
      let list: DbArticle[] = [...articles];
      if (cat !== "全部") list = list.filter((a) => normalizeCategory(a.category) === cat);
      if (k) {
        list = list.filter(
          (a) => a.title.toLowerCase().includes(k) || a.excerpt.toLowerCase().includes(k)
        );
      }
      return { list, fromDb: true };
    }

    let list: Article[] = ARTICLES;
    if (cat !== "全部") list = list.filter((a) => normalizeCategory(a.category as string) === cat);
    if (k) {
      list = list.filter(
        (a) => a.title.toLowerCase().includes(k) || a.excerpt.toLowerCase().includes(k)
      );
    }
    return { list, fromDb: false };
  }, [cat, q, articles]);

  const isDb = displayArticles.fromDb;
  const items = displayArticles.list;
  const total = isDb ? articles.length : ARTICLES.length;

  return (
    <section className="mt-24">
      <div className="mb-8 text-center">
        <div className="font-serif text-xs tracking-[0.4em] text-accent">THEME GALLERY</div>
        <h2 className="mt-2 font-serif text-3xl text-foreground">主题知识长廊</h2>
        <p className="mt-2 text-sm text-muted-foreground">节气流转，诗书相传 · 撷取文明长河中的一缕光</p>
      </div>

      <div className="mb-6 flex flex-col items-center gap-5">
        {/* search */}
        <div className="flex w-full max-w-xl items-center gap-2 rounded-full border border-border bg-card px-5 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索你感兴趣的知识..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          />
          {q && (
            <button onClick={() => setQ("")} className="text-muted-foreground hover:text-foreground">
              ×
            </button>
          )}
        </div>

        {/* categories */}
        <div className="flex flex-wrap items-center justify-center gap-1">
          {ALL_CATEGORIES.map((c) => {
            const active = cat === c;
            return (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`relative px-3 py-2 font-serif text-xs tracking-widest transition ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
                {active && (
                  <span className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 font-serif text-sm text-muted-foreground">撷取中...</p>
        </div>
      )}

      {/* error state */}
      {error && !loading && (
        <div className="rounded-2xl border border-border bg-card py-12 text-center">
          <p className="font-serif text-lg text-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground hover:opacity-90"
          >
            刷新页面
          </button>
        </div>
      )}

      {/* empty state */}
      {!loading && !error && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border py-20 text-center">
          <p className="font-serif text-lg text-foreground">未撷得相关篇章</p>
          <p className="mt-2 text-sm text-muted-foreground">换一个关键词或分类试试</p>
        </div>
      )}

      {/* articles grid */}
      {!loading && !error && items.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <Link
              key={item.id}
              to="/article/$id"
              params={{ id: item.id }}
              style={{ animationDelay: `${i * 40}ms` }}
              className="scroll-in group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.25)]"
            >
              {/* cover */}
              <div className="relative h-[180px] w-full overflow-hidden">
                {(() => {
                  const emoji = isDb ? (item.cover || "📜") : (item as Article).cover;
                  return (
                    <ArticleIllustration
                      category={normalizeCategory(item.category)}
                      title={item.title}
                      emoji={emoji}
                    />
                  );
                })()}
              </div>

              {/* content */}
              <div className="flex flex-1 flex-col gap-2 p-5">
                <span className="inline-block w-fit rounded-full border border-accent/30 bg-accent/5 px-2 py-0.5 font-serif text-[10px] tracking-widest text-accent">
                  {normalizeCategory(item.category)}
                </span>
                <h3 className="font-serif text-lg font-semibold leading-snug text-foreground line-clamp-2 group-hover:text-primary">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
                  {item.excerpt}
                </p>
                <div className="mt-auto flex items-center gap-1.5 pt-2 text-xs text-muted-foreground">
                  <Heart className="h-3.5 w-3.5" /> {item.favorites.toLocaleString()} 收藏
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* source indicator */}
      {!loading && (
        <p className="mt-8 text-center text-xs text-muted-foreground/50 flex items-center justify-center gap-1.5">
          {isDb && <Database className="h-3 w-3" />}
          共 {items.length} 篇篇章（库内 {total} 篇）{isDb ? "· 数据来源：溯光知识库" : "· 静态数据"}
        </p>
      )}
    </section>
  );
}
