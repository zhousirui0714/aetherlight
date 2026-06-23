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

// 生成真实图片URL - 使用免费图片服务获取实拍图片
function getImageUrl(title: string, category: string): string {
  // 根据主题生成搜索关键词
  const searchTerms: Record<string, (title: string) => string> = {
    "节气": (t) => {
      const terms: Record<string, string> = {
        "立春": "spring beginning nature",
        "雨水": "rain spring weather",
        "惊蛰": "insects awaken spring",
        "春分": "spring equinox sunrise",
        "清明": "qingming festival tomb sweeping",
        "谷雨": "grain rain agriculture",
        "立夏": "summer beginning",
        "小满": "grain buds",
        "芒种": "grain in ear",
        "夏至": "summer solstice",
        "小暑": "minor heat",
        "大暑": "major heat",
        "立秋": "autumn beginning",
        "处暑": "end of heat",
        "白露": "white dew",
        "秋分": "autumn equinox",
        "寒露": "cold dew",
        "霜降": "frost descent",
        "立冬": "winter beginning",
        "小雪": "light snow",
        "大雪": "heavy snow",
        "冬至": "winter solstice",
        "小寒": "minor cold",
        "大寒": "major cold",
      };
      return terms[t] || `solar term ${t}`;
    },
    "节日": (t) => {
      const terms: Record<string, string> = {
        "春节": "chinese new year celebration red lanterns",
        "元宵": "lantern festival lanterns",
        "清明": "qingming festival",
        "端午": "dragon boat festival zongzi rice dumpling",
        "中秋": "mid-autumn festival mooncake moon",
        "重阳": "double ninth festival chrysanthemum",
        "七夕": "qixi festival chinese valentine",
        "腊八": "laba festival porridge",
      };
      return terms[t] || `chinese festival ${t}`;
    },
    "诗词": (t) => {
      const terms: Record<string, string> = {
        "静夜思": "moon night sky moonlight",
        "水调歌头": "full moon night",
        "将进酒": "ancient chinese wine",
        "出师表": "ancient chinese scroll",
        "春晓": "spring morning flowers birds",
        "登鹳雀楼": "ancient tower scenery",
        "悯农": "farming agriculture field",
        "咏鹅": "white goose water",
      };
      return terms[t] || `chinese poetry scene ${t}`;
    },
    "典籍": (t) => {
      const terms: Record<string, string> = {
        "论语": "confucius ancient book",
        "诗经": "book of songs ancient chinese",
        "道德经": "tao te ching ancient book",
        "黄帝内经": "chinese medicine ancient book",
        "周易": "i ching ancient chinese",
        "楚辞": "chu ci ancient poetry",
      };
      return terms[t] || `ancient chinese book ${t}`;
    },
    "非遗": (t) => {
      const terms: Record<string, string> = {
        "昆曲": "kunqu opera chinese traditional",
        "青花瓷": "blue and white porcelain china",
        "景泰蓝": "cloisonne enamel art",
        "剪纸": "paper cutting chinese art",
        "刺绣": "embroidery chinese",
        "皮影戏": "shadow puppetry chinese",
      };
      return terms[t] || `chinese intangible heritage ${t}`;
    },
    "民俗": (t) => {
      const terms: Record<string, string> = {
        "茶事": "chinese tea ceremony",
        "中国礼": "chinese etiquette ceremony",
        "对联": "chinese couplets calligraphy",
        "风水": "feng shui traditional chinese",
        "书法": "chinese calligraphy",
        "国画": "chinese painting",
        "围棋": "go game weiqi",
      };
      return terms[t] || `chinese folk custom ${t}`;
    },
    "人物": (t) => {
      const terms: Record<string, string> = {
        "李白": "ancient chinese poet li bai",
        "杜甫": "ancient chinese poet du fu",
        "苏轼": "ancient chinese scholar su shi",
        "李清照": "ancient chinese poetess",
        "孔子": "confucius ancient chinese philosopher",
        "庄子": "chuang tzu philosopher",
        "王羲之": "chinese calligrapher",
        "唐寅": "tang yin ancient painter",
      };
      return terms[t] || `ancient chinese scholar ${t}`;
    },
  };

  const getSearchTerm = searchTerms[category] || ((t) => `chinese culture ${t}`);
  const searchTerm = getSearchTerm(title);
  
  // 使用 Unsplash 免费图片搜索服务获取真实实拍图片
  // 支持关键词搜索，返回与主题相关的真实照片
  const encodedTerm = encodeURIComponent(searchTerm);
  return `https://source.unsplash.com/random/400x300/?${encodedTerm}`;
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
        setArticles(data || []);
      } catch (err) {
        console.error("Failed to fetch articles:", err);
        setError("加载失败，请刷新重试");
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
