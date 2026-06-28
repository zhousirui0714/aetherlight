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

// 朱砂方印: 每个分类一个单字印文
const SEAL: Record<CategoryKey, string> = {
  figures: "人", poems: "诗", classics: "典", festivals: "节",
  mythology: "神", intangible: "遗", artifacts: "器",
  lifestyle: "物", philosophy: "哲", technology: "技",
};

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

/**
 * 知识长廊单卡 — 卷轴题字风
 * 整张卡被 Link 包裹, 卡片内无任何操作按钮
 */
function GalleryCard({
  item,
  index,
}: {
  item: DbArticle | Article;
  index: number;
  isDb: boolean;
}) {
  const subCategory = (item as DbArticle).sub_category ?? (item as Article).subCategory;
  const catKey = normalizeCategory(item.category);
  const catLabel = catKey ? CATEGORY_CN[catKey] : item.category;
  const seal = catKey ? SEAL[catKey] : "文";

  return (
    <Link
      to="/article/$id"
      params={{ id: item.id }}
      style={{ animationDelay: `${index * 40}ms` }}
      className="scroll-in group flex flex-col overflow-hidden rounded-sm border border-cinnabar/20 bg-[#faf6ec] transition hover:-translate-y-1 hover:border-cinnabar/45 hover:shadow-[0_12px_30px_-15px_rgba(196,58,48,0.18)] min-h-[300px]"
    >
      {/* 顶部卷轴轴头 — 两端朱砂小圆 + 极细横线 */}
      <div className="px-5 pt-3 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-cinnabar/70 shrink-0" />
        <div className="h-px flex-1 bg-cinnabar/25" />
        <div className="h-2 w-2 rounded-full bg-cinnabar/70 shrink-0" />
      </div>

      {/* 朱砂方印 + 分类 + 子类 */}
      <div className="px-6 pt-4 flex items-center gap-2.5">
        <div className="inline-flex h-7 w-7 items-center justify-center border-2 border-cinnabar bg-cinnabar/5 font-serif text-sm font-bold text-cinnabar">
          {seal}
        </div>
        <span className="font-serif text-xs tracking-[0.3em] text-foreground/65">
          {catLabel}
        </span>
        {subCategory && (
          <>
            <span className="text-foreground/25">·</span>
            <span className="font-serif text-[11px] tracking-wider text-foreground/45">
              {subCategory}
            </span>
          </>
        )}
      </div>

      {/* 标题 + 摘要 (题字风, 大量留白) */}
      <div className="flex-1 px-6 py-5">
        <h3 className="font-serif text-xl font-light leading-loose text-foreground/90 tracking-[0.2em] line-clamp-2 group-hover:text-cinnabar transition">
          {item.title}
        </h3>
        <p className="mt-3 font-serif text-sm leading-relaxed text-foreground/60 line-clamp-2">
          {item.excerpt}
        </p>
      </div>

      {/* 底部: 极细朱砂线 + 落款 + 收藏 */}
      <div className="mt-auto border-t border-cinnabar/15 px-6 py-3 flex items-center justify-between gap-2">
        <span className="font-serif text-[10px] tracking-[0.3em] text-foreground/40">
          —— 溯光 辑录
        </span>
        <span className="font-serif text-[10px] tracking-wider text-foreground/50 flex items-center gap-1">
          <Heart className="h-3 w-3" /> {(item.favorites || 0).toLocaleString()}
        </span>
      </div>

      {/* 底部卷轴轴头 */}
      <div className="px-5 pb-3 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-cinnabar/70 shrink-0" />
        <div className="h-px flex-1 bg-cinnabar/25" />
        <div className="h-2 w-2 rounded-full bg-cinnabar/70 shrink-0" />
      </div>
    </Link>
  );
}

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
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());

  // Fetch articles from Supabase — 分页拉全表 (突破 PostgREST 单次 1000 限制)
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const PAGE = 1000;
        const all: DbArticle[] = [];
        let from = 0;
        // 循环 range 直到拉空 (上限 5 页 = 5000 条, 防失控)
        for (let page = 0; page < 5; page++) {
          const { data, error } = await supabase
            .from("knowledge_articles")
            .select("id, title, category, sub_category, tags, excerpt, favorites, cover, cover_url, sort_weight, view_count, created_at")
            .order("sort_weight", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false })
            .range(from, from + PAGE - 1);
          if (error) throw error;
          if (!data || data.length === 0) break;
          all.push(...(data as DbArticle[]));
          if (data.length < PAGE) break; // 最后一页
          from += PAGE;
        }
        setArticles(all);
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

  // 加载收藏 ID 集合（用于角标显示）
  useEffect(() => {
    const fetchFavorites = async () => {
      const list = await loadAllFavorites();
      setFavoritedIds(new Set(list.map(f => f.item_id)));
    };
    fetchFavorites();
    // 监听跨 tab 的收藏变化
    const onStorage = (e: StorageEvent) => {
      if (e.key === "suguang:favorites") fetchFavorites();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

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
      // 热门排序模式：时间衰减 + 收藏 + 兴趣加权
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
    <section className="mt-8">
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
            <GalleryCard key={item.id} item={item as DbArticle | Article} index={i} />
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
