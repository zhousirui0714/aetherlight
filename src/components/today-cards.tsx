import { useState, useEffect } from "react";
import { Calendar, BookOpen, User, Scroll, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TodayItem {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  imageUrl?: string;
}

const categoryIcons: Record<string, typeof Calendar> = {
  "节气": Calendar,
  "诗词": BookOpen,
  "人物": User,
  "典故": Scroll,
  "非遗": Award,
};

const categoryColors: Record<string, string> = {
  "节气": "bg-emerald-500",
  "诗词": "bg-amber-500",
  "人物": "bg-blue-500",
  "典故": "bg-purple-500",
  "非遗": "bg-rose-500",
};

export function TodayCards() {
  const [todayItems, setTodayItems] = useState<TodayItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodayItems();
  }, []);

  const fetchTodayItems = async () => {
    try {
      setLoading(true);
      
      // 从知识库获取各类内容
      const categories = ["节气", "诗词", "人物", "典故", "非遗"];
      const items: TodayItem[] = [];

      for (const category of categories) {
        const { data } = await supabase
          .from("knowledge_articles")
          .select("id, title, excerpt, category, image_prompt")
          .eq("category", category)
          .order("created_at", { ascending: false })
          .limit(1);

        if (data && data.length > 0) {
          const item = data[0];
          items.push({
            id: item.id,
            title: item.title,
            excerpt: item.excerpt,
            category: item.category,
          });
        }
      }

      setTodayItems(items);
    } catch (error) {
      console.error("Failed to fetch today items:", error);
      // 回退到静态数据
      setTodayItems(getStaticTodayItems());
    } finally {
      setLoading(false);
    }
  };

  const getStaticTodayItems = (): TodayItem[] => {
    return [
      {
        id: "solar-term",
        title: "今日节气",
        excerpt: "今日是芒种，麦类等有芒作物成熟，夏播作物忙着播种。",
        category: "节气",
      },
      {
        id: "poetry",
        title: "今日诗词",
        excerpt: "床前明月光，疑是地上霜。举头望明月，低头思故乡。",
        category: "诗词",
      },
      {
        id: "figure",
        title: "今日人物",
        excerpt: "李白，唐代伟大的浪漫主义诗人，被誉为诗仙。",
        category: "人物",
      },
      {
        id: "story",
        title: "今日典故",
        excerpt: "卧薪尝胆：形容人刻苦自励，立志报仇雪耻。",
        category: "典故",
      },
      {
        id: "heritage",
        title: "今日非遗",
        excerpt: "昆曲，中国传统戏曲中最古老的剧种之一。",
        category: "非遗",
      },
    ];
  };

  if (loading) {
    return (
      <section className="mt-12">
        <div className="flex items-center justify-center gap-2 py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="font-serif text-sm text-muted-foreground">撷取中…</span>
        </div>
      </section>
    );
  }

  const displayItems = todayItems.length > 0 ? todayItems : getStaticTodayItems();

  return (
    <section className="mt-12">
      <div className="mb-8 text-center">
        <div className="font-serif text-xs tracking-[0.4em] text-accent">TODAY'S HIGHLIGHTS</div>
        <h2 className="mt-2 font-serif text-3xl text-foreground">今 日 撷 英</h2>
        <p className="mt-2 text-sm text-muted-foreground">每日精选 · 文化瑰宝</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {displayItems.map((item) => {
          const Icon = categoryIcons[item.category] || BookOpen;
          const bgColor = categoryColors[item.category] || "bg-gray-500";
          
          return (
            <a
              key={item.id}
              href={`/gallery?category=${encodeURIComponent(item.category)}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
            >
              <div className="relative h-24 overflow-hidden bg-gradient-to-br from-secondary via-background to-secondary">
                <div
                  className="absolute inset-0 opacity-40"
                  style={{
                    background: `radial-gradient(circle at 30% 40%, var(--color-bronze) 0%, transparent 45%), radial-gradient(circle at 75% 70%, var(--color-cinnabar) 0%, transparent 40%)`,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bgColor}/20`}>
                    <Icon className={`h-6 w-6 ${bgColor.replace("bg-", "text-")}`} />
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-serif text-base font-semibold text-foreground line-clamp-1 group-hover:text-primary transition">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                  {item.excerpt}
                </p>
                <span className={`mt-3 inline-block rounded-full ${bgColor}/10 px-2.5 py-1 text-[10px] font-serif tracking-widest text-foreground/70`}>
                  {item.category}
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
