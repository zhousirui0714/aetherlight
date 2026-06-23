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

// 使用稳定的免费图片服务，为每个主题提供匹配的图片
function getImageUrl(title: string, category: string): string {
  // 使用 picsum.photos 的随机ID机制，每个主题使用唯一的数字ID
  const imageMap: Record<string, Record<string, string>> = {
    "节气": {
      "立春": "https://picsum.photos/id/15/400/300",      // 春天风景
      "雨水": "https://picsum.photos/id/16/400/300",      // 雨景
      "惊蛰": "https://picsum.photos/id/17/400/300",      // 自然景观
      "春分": "https://picsum.photos/id/18/400/300",      // 日出
      "清明": "https://picsum.photos/id/19/400/300",      // 绿色风景
      "谷雨": "https://picsum.photos/id/20/400/300",      // 田野
      "立夏": "https://picsum.photos/id/21/400/300",      // 夏天风景
      "小满": "https://picsum.photos/id/22/400/300",      // 麦田
      "芒种": "https://picsum.photos/id/23/400/300",      // 金色田野
      "夏至": "https://picsum.photos/id/24/400/300",      // 阳光
      "小暑": "https://picsum.photos/id/25/400/300",      // 热天风景
      "大暑": "https://picsum.photos/id/26/400/300",      // 热带
      "立秋": "https://picsum.photos/id/27/400/300",      // 秋天风景
      "处暑": "https://picsum.photos/id/28/400/300",      // 落叶
      "白露": "https://picsum.photos/id/29/400/300",      // 晨露
      "秋分": "https://picsum.photos/id/30/400/300",      // 秋色
      "寒露": "https://picsum.photos/id/31/400/300",      // 冷色风景
      "霜降": "https://picsum.photos/id/32/400/300",      // 霜景
      "立冬": "https://picsum.photos/id/33/400/300",      // 冬天风景
      "小雪": "https://picsum.photos/id/34/400/300",      // 初雪
      "大雪": "https://picsum.photos/id/35/400/300",      // 大雪
      "冬至": "https://picsum.photos/id/36/400/300",      // 冬季
      "小寒": "https://picsum.photos/id/37/400/300",      // 寒冷
      "大寒": "https://picsum.photos/id/38/400/300",      // 严冬
    },
    "节日": {
      "春节": "https://picsum.photos/id/41/400/300",      // 喜庆红色
      "元宵": "https://picsum.photos/id/42/400/300",      // 灯笼
      "清明": "https://picsum.photos/id/43/400/300",      // 清明节
      "端午": "https://picsum.photos/id/44/400/300",      // 龙舟水
      "中秋": "https://picsum.photos/id/45/400/300",      // 月亮
      "重阳": "https://picsum.photos/id/46/400/300",      // 登高
      "七夕": "https://picsum.photos/id/47/400/300",      // 浪漫夜空
      "腊八": "https://picsum.photos/id/48/400/300",      // 温暖食物
    },
    "诗词": {
      "静夜思": "https://picsum.photos/id/51/400/300",    // 月亮夜景
      "水调歌头": "https://picsum.photos/id/52/400/300",  // 满月
      "将进酒": "https://picsum.photos/id/53/400/300",    // 酒文化
      "出师表": "https://picsum.photos/id/54/400/300",    // 书卷
      "春晓": "https://picsum.photos/id/55/400/300",      // 春天早晨
      "登鹳雀楼": "https://picsum.photos/id/56/400/300",  // 高楼
      "悯农": "https://picsum.photos/id/57/400/300",      // 农田
      "咏鹅": "https://picsum.photos/id/58/400/300",      // 水禽
      "望庐山瀑布": "https://picsum.photos/id/59/400/300",// 瀑布
      "早发白帝城": "https://picsum.photos/id/60/400/300",// 河流
    },
    "典籍": {
      "论语": "https://picsum.photos/id/61/400/300",      // 书籍
      "诗经": "https://picsum.photos/id/62/400/300",      // 古典书
      "道德经": "https://picsum.photos/id/63/400/300",    // 哲学
      "黄帝内经": "https://picsum.photos/id/64/400/300",  // 医学古籍
      "周易": "https://picsum.photos/id/65/400/300",      // 占卜
      "楚辞": "https://picsum.photos/id/66/400/300",      // 诗歌
    },
    "非遗": {
      "昆曲": "https://picsum.photos/id/71/400/300",      // 戏曲
      "青花瓷": "https://picsum.photos/id/72/400/300",    // 瓷器
      "景泰蓝": "https://picsum.photos/id/73/400/300",    // 工艺品
      "剪纸": "https://picsum.photos/id/74/400/300",      // 艺术
      "刺绣": "https://picsum.photos/id/75/400/300",      // 针线
      "皮影戏": "https://picsum.photos/id/76/400/300",    // 影子
    },
    "民俗": {
      "茶事": "https://picsum.photos/id/81/400/300",      // 茶道
      "中国礼": "https://picsum.photos/id/82/400/300",    // 礼仪
      "对联": "https://picsum.photos/id/83/400/300",      // 书法
      "风水": "https://picsum.photos/id/84/400/300",      // 自然
      "书法": "https://picsum.photos/id/85/400/300",      // 笔墨
      "国画": "https://picsum.photos/id/86/400/300",      // 绘画
      "围棋": "https://picsum.photos/id/87/400/300",      // 棋盘
    },
    "人物": {
      "李白": "https://picsum.photos/id/91/400/300",      // 诗人
      "杜甫": "https://picsum.photos/id/92/400/300",      // 文人
      "苏轼": "https://picsum.photos/id/93/400/300",      // 学者
      "李清照": "https://picsum.photos/id/94/400/300",    // 女词人
      "孔子": "https://picsum.photos/id/95/400/300",      // 思想家
      "庄子": "https://picsum.photos/id/96/400/300",      // 哲学家
      "王羲之": "https://picsum.photos/id/97/400/300",    // 书法
      "唐寅": "https://picsum.photos/id/98/400/300",      // 画家
    },
  };

  // 优先使用精确映射
  if (imageMap[category] && imageMap[category][title]) {
    return imageMap[category][title];
  }

  // 回退到分类级别的通用图片
  const categoryImages: Record<string, string> = {
    "节气": "https://picsum.photos/id/101/400/300",
    "节日": "https://picsum.photos/id/102/400/300",
    "诗词": "https://picsum.photos/id/103/400/300",
    "典籍": "https://picsum.photos/id/104/400/300",
    "非遗": "https://picsum.photos/id/105/400/300",
    "民俗": "https://picsum.photos/id/106/400/300",
    "人物": "https://picsum.photos/id/107/400/300",
  };

  return categoryImages[category] || `https://picsum.photos/id/${Math.floor(Math.random() * 100) + 1}/400/300`;
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
