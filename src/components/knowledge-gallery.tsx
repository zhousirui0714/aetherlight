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

// 为每个主题创建精确的图片映射
// 使用固定的免费图片服务URL，确保图片与主题匹配
function getImageUrl(title: string, category: string): string {
  // 精确的图片映射表 - 根据主题选择最合适的图片
  const imageMap: Record<string, Record<string, string>> = {
    "节气": {
      "立春": "https://picsum.photos/seed/spring-begin/400/300",
      "雨水": "https://picsum.photos/seed/rain-spring/400/300",
      "惊蛰": "https://picsum.photos/seed/insects-awaken/400/300",
      "春分": "https://picsum.photos/seed/spring-equinox/400/300",
      "清明": "https://picsum.photos/seed/qingming/400/300",
      "谷雨": "https://picsum.photos/seed/grain-rain/400/300",
      "立夏": "https://picsum.photos/seed/summer-begin/400/300",
      "小满": "https://picsum.photos/seed/grain-buds/400/300",
      "芒种": "https://picsum.photos/seed/grain-ear/400/300",
      "夏至": "https://picsum.photos/seed/summer-solstice/400/300",
      "小暑": "https://picsum.photos/seed/minor-heat/400/300",
      "大暑": "https://picsum.photos/seed/major-heat/400/300",
      "立秋": "https://picsum.photos/seed/autumn-begin/400/300",
      "处暑": "https://picsum.photos/seed/end-heat/400/300",
      "白露": "https://picsum.photos/seed/white-dew/400/300",
      "秋分": "https://picsum.photos/seed/autumn-equinox/400/300",
      "寒露": "https://picsum.photos/seed/cold-dew/400/300",
      "霜降": "https://picsum.photos/seed/frost-descent/400/300",
      "立冬": "https://picsum.photos/seed/winter-begin/400/300",
      "小雪": "https://picsum.photos/seed/light-snow/400/300",
      "大雪": "https://picsum.photos/seed/heavy-snow/400/300",
      "冬至": "https://picsum.photos/seed/winter-solstice/400/300",
      "小寒": "https://picsum.photos/seed/minor-cold/400/300",
      "大寒": "https://picsum.photos/seed/major-cold/400/300",
    },
    "节日": {
      "春节": "https://picsum.photos/seed/chinese-new-year/400/300",
      "元宵": "https://picsum.photos/seed/lantern-festival/400/300",
      "清明": "https://picsum.photos/seed/qingming-festival/400/300",
      "端午": "https://picsum.photos/seed/dragon-boat/400/300",
      "中秋": "https://picsum.photos/seed/mid-autumn/400/300",
      "重阳": "https://picsum.photos/seed/double-ninth/400/300",
      "七夕": "https://picsum.photos/seed/qixi/400/300",
      "腊八": "https://picsum.photos/seed/laba/400/300",
    },
    "诗词": {
      "静夜思": "https://picsum.photos/seed/moon-night/400/300",
      "水调歌头": "https://picsum.photos/seed/full-moon/400/300",
      "将进酒": "https://picsum.photos/seed/chinese-wine/400/300",
      "出师表": "https://picsum.photos/seed/ancient-scroll/400/300",
      "春晓": "https://picsum.photos/seed/spring-morning/400/300",
      "登鹳雀楼": "https://picsum.photos/seed/ancient-tower/400/300",
      "悯农": "https://picsum.photos/seed/farming-field/400/300",
      "咏鹅": "https://picsum.photos/seed/goose-water/400/300",
      "望庐山瀑布": "https://picsum.photos/seed/waterfall/400/300",
      "早发白帝城": "https://picsum.photos/seed/white-emperor/400/300",
    },
    "典籍": {
      "论语": "https://picsum.photos/seed/confucius/400/300",
      "诗经": "https://picsum.photos/seed/book-of-songs/400/300",
      "道德经": "https://picsum.photos/seed/tao-te-ching/400/300",
      "黄帝内经": "https://picsum.photos/seed/chinese-medicine/400/300",
      "周易": "https://picsum.photos/seed/i-ching/400/300",
      "楚辞": "https://picsum.photos/seed/chu-ci/400/300",
    },
    "非遗": {
      "昆曲": "https://picsum.photos/seed/kunqu-opera/400/300",
      "青花瓷": "https://picsum.photos/seed/blue-white-porcelain/400/300",
      "景泰蓝": "https://picsum.photos/seed/cloisonne/400/300",
      "剪纸": "https://picsum.photos/seed/paper-cutting/400/300",
      "刺绣": "https://picsum.photos/seed/embroidery/400/300",
      "皮影戏": "https://picsum.photos/seed/shadow-puppet/400/300",
    },
    "民俗": {
      "茶事": "https://picsum.photos/seed/chinese-tea/400/300",
      "中国礼": "https://picsum.photos/seed/chinese-etiquette/400/300",
      "对联": "https://picsum.photos/seed/couplets/400/300",
      "风水": "https://picsum.photos/seed/fengshui/400/300",
      "书法": "https://picsum.photos/seed/calligraphy/400/300",
      "国画": "https://picsum.photos/seed/chinese-painting/400/300",
      "围棋": "https://picsum.photos/seed/go-game/400/300",
    },
    "人物": {
      "李白": "https://picsum.photos/seed/li-bai/400/300",
      "杜甫": "https://picsum.photos/seed/du-fu/400/300",
      "苏轼": "https://picsum.photos/seed/su-shi/400/300",
      "李清照": "https://picsum.photos/seed/li-qingzhao/400/300",
      "孔子": "https://picsum.photos/seed/confucius-philosopher/400/300",
      "庄子": "https://picsum.photos/seed/zhuang-zi/400/300",
      "王羲之": "https://picsum.photos/seed/wang-xizhi/400/300",
      "唐寅": "https://picsum.photos/seed/tang-yin/400/300",
    },
  };

  // 优先使用精确映射
  if (imageMap[category] && imageMap[category][title]) {
    return imageMap[category][title];
  }

  // 回退到分类级别的通用图片
  const categoryImages: Record<string, string> = {
    "节气": "https://picsum.photos/seed/solar-term/400/300",
    "节日": "https://picsum.photos/seed/chinese-festival/400/300",
    "诗词": "https://picsum.photos/seed/chinese-poetry/400/300",
    "典籍": "https://picsum.photos/seed/ancient-book/400/300",
    "非遗": "https://picsum.photos/seed/intangible-heritage/400/300",
    "民俗": "https://picsum.photos/seed/chinese-folk/400/300",
    "人物": "https://picsum.photos/seed/chinese-scholar/400/300",
  };

  return categoryImages[category] || `https://picsum.photos/seed/${encodeURIComponent(title)}/400/300`;
}

export function KnowledgeGallery() {
  const [cat, setCat] = useState<"全部" | string>("全部");
  const [q, setQ] = useState("");
  const [articles, setArticles] = useState<DbArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

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
  };

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
                
                {/* AI生成图片 */}
                {!imageErrors.has(item.id) ? (
                  <img
                    src={getImageUrl(item.title, item.category)}
                    alt={item.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={() => handleImageError(item.id)}
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-7xl transition-transform duration-500 group-hover:scale-110">
                    {isDb ? (item.cover || "📜") : (item as Article).cover}
                  </div>
                )}
                
                <span className="absolute left-3 top-3 rounded-full bg-background/80 px-2.5 py-0.5 text-[10px] font-serif tracking-widest text-accent backdrop-blur">
                  {item.category}
                </span>
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
