import { useMemo, useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, Search, Loader2, Database } from "lucide-react";
import { ARTICLES, type Article } from "@/lib/knowledge-data";
import {
  CATEGORY_KEYS,
  CATEGORY_CN,
  CATEGORY_SUB_CATEGORIES,
  CATEGORY_ALIAS_CN,
  type CategoryKey,
} from "@/lib/knowledge-types";
import { supabase } from "@/integrations/supabase/client";
import { ArticleIllustration } from "./article-illustration";

type DbArticle = {
  id: string;
  title: string;
  category: string;
  sub_category?: string;
  tags?: string[];
  excerpt: string;
  body?: string;
  body_extended?: string;
  favorites: number;
  cover: string | null;
  cover_url?: string | null;
  image_prompt?: string;
  sort_weight?: number;
  view_count?: number;
  full_text?: string | null;
  created_at: string;
};

// 顶级分类: 全部 + 10 v3 分类
const ALL_TOP_CATEGORIES: ("全部" | CategoryKey)[] = ["全部", ...CATEGORY_KEYS];

/**
 * 旧/混用 category → 10 顶级 key
 */
function normalizeCategory(c: string): CategoryKey | null {
  if (!c) return null;
  if (CATEGORY_KEYS.includes(c as CategoryKey)) return c as CategoryKey;
  if (CATEGORY_ALIAS_CN[c]) return CATEGORY_ALIAS_CN[c];
  return null;
}

export function KnowledgeGallery() {
  const [cat, setCat] = useState<"全部" | CategoryKey>("全部");
  const [subCat, setSubCat] = useState<string>("");  // 当前选中的子类
  const [q, setQ] = useState("");
  const [articles, setArticles] = useState<DbArticle[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch articles from Supabase
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const { data, fetchError } = await supabase
          .from("knowledge_articles")
          .select("id, title, category, sub_category, tags, excerpt, favorites, cover, cover_url, sort_weight, view_count, created_at")
          .order("sort_weight", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;
        setArticles(data || []);
      } catch (err) {
        console.error("Failed to fetch articles from Supabase:", err);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  // 当顶级分类变化时, 重置子类
  useEffect(() => {
    setSubCat("");
  }, [cat]);

  const displayArticles = useMemo(() => {
    const k = q.trim().toLowerCase();

    if (articles.length > 0) {
      let list: DbArticle[] = [...articles];
      if (cat !== "全部") {
        list = list.filter((a) => normalizeCategory(a.category) === cat);
      }
      if (subCat) {
        list = list.filter((a) => a.sub_category === subCat);
      }
      if (k) {
        list = list.filter(
          (a) => a.title.toLowerCase().includes(k) || a.excerpt.toLowerCase().includes(k)
        );
      }
      return { list, fromDb: true };
    }

    // fallback: 静态
    let list: Article[] = ARTICLES;
    if (cat !== "全部") {
      const targetKey = cat as CategoryKey;
      list = list.filter((a) => {
        const k = CATEGORY_ALIAS_CN[a.category as string] || (a.category as CategoryKey);
        return k === targetKey;
      });
    }
    if (k) {
      list = list.filter(
        (a) => a.title.toLowerCase().includes(k) || a.excerpt.toLowerCase().includes(k)
      );
    }
    return { list, fromDb: false };
  }, [cat, subCat, q, articles]);

  const isDb = displayArticles.fromDb;
  const items = displayArticles.list;
  const total = isDb ? articles.length : ARTICLES.length;

  // 当前顶级分类的子类
  const currentSubs = cat === "全部" ? [] : CATEGORY_SUB_CATEGORIES[cat];

  // 计算每个顶级分类的条数 (仅 DB 模式)
  const categoryCounts = useMemo(() => {
    if (!isDb) return {} as Record<string, number>;
    const map: Record<string, number> = { 全部: articles.length };
    for (const a of articles) {
      const k = normalizeCategory(a.category);
      if (k) map[k] = (map[k] || 0) + 1;
    }
    return map;
  }, [articles, isDb]);

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

        {/* 顶级分类 (10 顶级 + 全部) */}
        <div className="flex flex-wrap items-center justify-center gap-1">
          {ALL_TOP_CATEGORIES.map((c) => {
            const active = cat === c;
            const count = isDb ? categoryCounts[c] || 0 : 0;
            return (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`group relative px-3 py-2 font-serif text-xs tracking-widest transition ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{c === "全部" ? "全部" : CATEGORY_CN[c as CategoryKey]}</span>
                {isDb && count > 0 && (
                  <span className="ml-1 text-[10px] text-muted-foreground/60">
                    {count}
                  </span>
                )}
                {active && (
                  <span className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* 2 级子类 (仅当非"全部"时显示) */}
        {currentSubs.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
            <button
              onClick={() => setSubCat("")}
              className={`rounded-full border px-3 py-1 transition ${
                !subCat
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50"
              }`}
            >
              全部
            </button>
            {currentSubs.map((sn) => {
              const active = subCat === sn;
              return (
                <button
                  key={sn}
                  onClick={() => setSubCat(sn)}
                  className={`rounded-full border px-3 py-1 transition ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {sn}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 font-serif text-sm text-muted-foreground">撷取中...</p>
        </div>
      )}

      {/* empty state */}
      {!loading && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border py-20 text-center">
          <p className="font-serif text-lg text-foreground">未撷得相关篇章</p>
          <p className="mt-2 text-sm text-muted-foreground">换一个关键词或分类试试</p>
        </div>
      )}

      {/* articles grid */}
      {!loading && items.length > 0 && (
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
                      category={normalizeCategory(item.category) || item.category}
                      title={item.title}
                      emoji={emoji}
                      coverUrl={isDb ? (item as DbArticle).cover_url : undefined}
                    />
                  );
                })()}
              </div>

              {/* content */}
              <div className="flex flex-1 flex-col gap-2 p-5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-block w-fit rounded-full border border-accent/30 bg-accent/5 px-2 py-0.5 font-serif text-[10px] tracking-widest text-accent">
                    {(() => {
                      const k = normalizeCategory(item.category);
                      return k ? CATEGORY_CN[k] : item.category;
                    })()}
                  </span>
                  {(isDb && (item as DbArticle).sub_category) && (
                    <span className="inline-block w-fit rounded-full bg-muted px-2 py-0.5 font-serif text-[10px] tracking-widest text-muted-foreground">
                      {(item as DbArticle).sub_category}
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-lg font-semibold leading-snug text-foreground line-clamp-2 group-hover:text-primary">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
                  {item.excerpt}
                </p>
                <div className="mt-auto flex items-center gap-1.5 pt-2 text-xs text-muted-foreground">
                  <Heart className="h-3.5 w-3.5" /> {item.favorites?.toLocaleString() || 0} 收藏
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
