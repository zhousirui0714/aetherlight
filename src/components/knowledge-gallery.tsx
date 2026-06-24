import { useMemo, useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, Search, Loader2 } from "lucide-react";
import { ARTICLES, CATEGORIES, type Article } from "@/lib/knowledge-data";
import { supabase } from "@/integrations/supabase/client";

type DbArticle = {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  body: string;
  favorites: number;
  cover: string | null;
  image_prompt?: string;
  created_at: string;
};

// 根据主题生成搜索关键词
function getSearchQuery(title: string, category: string): string {
  const queries: Record<string, Record<string, string>> = {
    "节气": {
      "立春": "spring beginning nature",
      "雨水": "rain spring weather",
      "惊蛰": "insects awaken spring",
      "春分": "spring equinox sunrise",
      "清明": "qingming festival tomb sweeping",
      "谷雨": "grain rain agriculture",
      "立夏": "summer beginning nature",
      "小满": "grain buds wheat",
      "芒种": "grain in ear harvest",
      "夏至": "summer solstice sunlight",
      "小暑": "minor heat summer",
      "大暑": "major heat summer",
      "立秋": "autumn beginning fall",
      "处暑": "end of heat autumn",
      "白露": "white dew autumn",
      "秋分": "autumn equinox",
      "寒露": "cold dew autumn",
      "霜降": "frost descent autumn",
      "立冬": "winter beginning snow",
      "小雪": "light snow winter",
      "大雪": "heavy snow winter",
      "冬至": "winter solstice",
      "小寒": "minor cold winter",
      "大寒": "major cold winter",
    },
    "节日": {
      "春节": "Chinese New Year red lanterns celebration",
      "元宵": "Lantern Festival lanterns",
      "清明": "Qingming Festival tomb sweeping",
      "端午": "Dragon Boat Festival rice dumpling zongzi",
      "中秋": "Mid-Autumn Festival moon mooncake",
      "重阳": "Double Ninth Festival chrysanthemum",
      "七夕": "Qixi Festival Chinese Valentine",
      "腊八": "Laba Festival congee",
    },
    "诗词": {
      "静夜思": "moon night sky moonlight poetry",
      "水调歌头": "full moon night Chinese poetry",
      "将进酒": "Chinese wine ancient poetry",
      "出师表": "ancient Chinese scroll calligraphy",
      "春晓": "spring morning flowers birds",
      "登鹳雀楼": "ancient Chinese tower landscape",
      "悯农": "farming agriculture field rice",
      "咏鹅": "white goose water pond",
      "望庐山瀑布": "waterfall mountain landscape",
      "早发白帝城": "river landscape ancient China",
    },
    "典籍": {
      "论语": "Confucius ancient Chinese book",
      "诗经": "Book of Songs ancient Chinese poetry",
      "道德经": "Tao Te Ching ancient philosophy",
      "黄帝内经": "Chinese medicine ancient book",
      "周易": "I Ching ancient divination",
      "楚辞": "Chu Ci ancient poetry",
    },
    "非遗": {
      "昆曲": "Kunqu opera Chinese traditional",
      "青花瓷": "blue and white porcelain China",
      "景泰蓝": "cloisonne enamel art",
      "剪纸": "Chinese paper cutting art",
      "刺绣": "Chinese embroidery silk",
      "皮影戏": "Chinese shadow puppetry",
    },
    "民俗": {
      "茶事": "Chinese tea ceremony teapot",
      "中国礼": "Chinese etiquette ceremony",
      "对联": "Chinese couplets calligraphy",
      "风水": "feng shui traditional Chinese",
      "书法": "Chinese calligraphy brush",
      "国画": "Chinese painting landscape",
      "围棋": "Go game Weiqi board",
    },
    "人物": {
      "李白": "ancient Chinese poet Li Bai",
      "杜甫": "ancient Chinese poet Du Fu",
      "苏轼": "ancient Chinese scholar Su Shi",
      "李清照": "ancient Chinese poetess",
      "孔子": "Confucius Chinese philosopher",
      "庄子": "Zhuangzi Chinese philosophy",
      "王羲之": "Chinese calligrapher",
      "唐寅": "Tang Yin ancient painter",
    },
  };

  if (queries[category] && queries[category][title]) {
    return queries[category][title];
  }

  const categoryDefaults: Record<string, string> = {
    "节气": "Chinese solar term",
    "节日": "Chinese traditional festival",
    "诗词": "Chinese poetry",
    "典籍": "ancient Chinese book",
    "非遗": "Chinese intangible cultural heritage",
    "民俗": "Chinese folk custom",
    "人物": "ancient Chinese scholar",
  };

  return categoryDefaults[category] || `Chinese culture ${title}`;
}

export function KnowledgeGallery() {
  const [cat, setCat] = useState<"全部" | string>("全部");
  const [q, setQ] = useState("");
  const [articles, setArticles] = useState<DbArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [imageLoading, setImageLoading] = useState<Set<string>>(new Set());

  // Fetch articles from Supabase
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from("knowledge_articles")
          .select("id, title, category, excerpt, favorites, cover, image_prompt, created_at")
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;
        
        if (data && data.length > 0) {
          setArticles(data);
        } else {
          // 数据库为空时使用静态数据
          console.log("Supabase data is empty, using static fallback");
          setArticles([]);
        }
      } catch (err) {
        console.error("Failed to fetch articles from Supabase:", err);
        // Supabase 失败时不报错，使用静态数据回退
        setArticles([]);
        setError(null); // 清除错误状态，以便使用静态数据
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  const handleImageError = (articleId: string) => {
    setImageErrors(prev => new Set([...prev, articleId]));
    setImageLoading(prev => new Set([...prev].filter(id => id !== articleId)));
  };

  // 动态获取图片URL
  const fetchImageUrl = async (articleId: string, title: string, category: string) => {
    if (imageUrls[articleId] || imageErrors.has(articleId)) return;

    setImageLoading(prev => new Set([...prev, articleId]));

    try {
      // 传递中文标题，让 API 端做精确映射
      const response = await fetch(`/api/search-image?q=${encodeURIComponent(title)}`);
      const data = await response.json();

      if (data.url && data.url.trim() !== "") {
        setImageUrls(prev => ({ ...prev, [articleId]: data.url }));
      } else {
        // API 返回空 URL，标记为错误以显示 emoji fallback
        setImageErrors(prev => new Set([...prev, articleId]));
      }
    } catch (error) {
      console.error(`Failed to fetch image for ${title}:`, error);
      // 请求失败也标记为错误
      setImageErrors(prev => new Set([...prev, articleId]));
    } finally {
      setImageLoading(prev => new Set([...prev].filter(id => id !== articleId)));
    }
  };

  // 在文章加载完成后批量获取图片
  useEffect(() => {
    if (!loading && items.length > 0) {
      items.forEach(item => {
        if (!imageUrls[item.id] && !imageErrors.has(item.id) && !imageLoading.has(item.id)) {
          fetchImageUrl(item.id, item.title, item.category);
        }
      });
    }
  }, [loading, items, imageUrls, imageErrors, imageLoading]);

  // Use Supabase data if available, otherwise fallback to static data
  const displayArticles = useMemo(() => {
    if (articles.length > 0) {
      let list: DbArticle[] = [...articles];
      if (cat !== "全部") list = list.filter((a) => a.category === cat);
      if (q.trim()) {
        const k = q.trim().toLowerCase();
        list = list.filter(
          (a) => a.title.toLowerCase().includes(k) || a.excerpt.toLowerCase().includes(k)
        );
      }
      return { list, fromDb: true };
    }

    // Fallback to static data
    let list: Article[] = ARTICLES;
    if (cat !== "全部") list = list.filter((a) => a.category === cat);
    if (q.trim()) {
      const k = q.trim().toLowerCase();
      list = list.filter(
        (a) => a.title.toLowerCase().includes(k) || a.excerpt.toLowerCase().includes(k)
      );
    }
    return { list, fromDb: false };
  }, [cat, q, articles]);

  const isDb = displayArticles.fromDb;
  const items = displayArticles.list;

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
              <div className="relative h-[180px] w-full overflow-hidden bg-gradient-to-br from-secondary via-background to-secondary">
                <div
                  className="absolute inset-0 opacity-40"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 40%, var(--color-bronze) 0%, transparent 45%), radial-gradient(circle at 75% 70%, var(--color-cinnabar) 0%, transparent 40%)",
                  }}
                />
                
                {/* 动态获取图片 */}
                {!imageErrors.has(item.id) ? (
                  <>
                    {imageUrls[item.id] ? (
                      <img
                        src={imageUrls[item.id]}
                        alt={item.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={() => handleImageError(item.id)}
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-7xl transition-transform duration-500 group-hover:scale-110">
                        {imageLoading.has(item.id) ? (
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        ) : (
                          isDb ? (item.cover || "📜") : (item as Article).cover
                        )}
                      </div>
                    )}

                    <span className="absolute left-3 top-3 rounded-full bg-background/80 px-2.5 py-0.5 text-[10px] font-serif tracking-widest text-accent backdrop-blur">
                      {item.category}
                    </span>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-7xl">
                    {isDb ? (item.cover || "📜") : (item as Article).cover}
                  </div>
                )}
              </div>

              {/* content */}
              <div className="flex flex-1 flex-col gap-2 p-5">
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
      {!loading && articles.length > 0 && (
        <p className="mt-8 text-center text-xs text-muted-foreground/50">
          共 {items.length} 篇篇章 {isDb ? "· 数据来源：溯光知识库" : ""}
        </p>
      )}
    </section>
  );
}
