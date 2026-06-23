import { useState, useEffect } from "react";
import { Calendar, BookOpen, User, Scroll, Award, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TodayItem {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  imageUrl?: string;
  imageLoading?: boolean;
  imageQuery?: string;
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

const solarTerms = [
  { name: "小寒", date: [1, 5], description: "天气渐寒，开始进入一年中最寒冷的时期。" },
  { name: "大寒", date: [1, 20], description: "一年中最冷的时节，天寒地冻。" },
  { name: "立春", date: [2, 4], description: "春季开始，万物复苏，天气回暖。" },
  { name: "雨水", date: [2, 19], description: "降雨增多，滋润万物生长。" },
  { name: "惊蛰", date: [3, 6], description: "春雷初响，蛰伏的动物开始苏醒。" },
  { name: "春分", date: [3, 21], description: "昼夜平分，春天过半，百花盛开。" },
  { name: "清明", date: [4, 5], description: "天清地明，适合踏青扫墓。" },
  { name: "谷雨", date: [4, 20], description: "雨水滋润谷物生长。" },
  { name: "立夏", date: [5, 6], description: "夏季开始，气温升高。" },
  { name: "小满", date: [5, 21], description: "麦类作物开始饱满，但尚未成熟。" },
  { name: "芒种", date: [6, 6], description: "麦类等有芒作物成熟，夏播作物忙着播种。" },
  { name: "夏至", date: [6, 21], description: "白天最长，炎热的夏天正式到来。" },
  { name: "小暑", date: [7, 7], description: "天气开始炎热，但尚未达到最热。" },
  { name: "大暑", date: [7, 23], description: "一年中最热的时期。" },
  { name: "立秋", date: [8, 8], description: "秋季开始，天气逐渐凉爽。" },
  { name: "处暑", date: [8, 23], description: "炎热的暑气即将结束。" },
  { name: "白露", date: [9, 8], description: "天气转凉，露水开始凝结成白色。" },
  { name: "秋分", date: [9, 23], description: "昼夜平分，秋天过半。" },
  { name: "寒露", date: [10, 8], description: "露水变凉，寒意渐浓。" },
  { name: "霜降", date: [10, 24], description: "开始出现霜冻，天气变冷。" },
  { name: "立冬", date: [11, 8], description: "冬季开始，万物收藏。" },
  { name: "小雪", date: [11, 22], description: "开始下雪，但雪量不大。" },
  { name: "大雪", date: [12, 7], description: "雪量增多，天气更加寒冷。" },
  { name: "冬至", date: [12, 22], description: "白天最短，寒冬正式到来。" },
];

function getCurrentSolarTerm(): { name: string; description: string } {
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  for (let i = 0; i < solarTerms.length; i++) {
    const term = solarTerms[i];
    const [termMonth, termDay] = term.date;
    
    const nextTerm = solarTerms[(i + 1) % solarTerms.length];
    const [nextMonth, nextDay] = nextTerm.date;

    if (month === termMonth) {
      if (day >= termDay) {
        if (month === nextMonth) {
          if (day < nextDay) return term;
        } else {
          return term;
        }
      }
    } else if (month > termMonth && month < nextMonth) {
      return term;
    } else if (month === 12 && termMonth === 12 && nextMonth === 1) {
      if (day >= termDay) return term;
    } else if (month === 1 && termMonth === 12 && nextMonth === 1) {
      if (day < nextDay) return solarTerms[solarTerms.length - 1];
    }
  }

  return solarTerms[0];
}

const staticItems = [
  {
    id: "poetry",
    title: "今日诗词",
    excerpt: "床前明月光，疑是地上霜。举头望明月，低头思故乡。",
    category: "诗词",
    imageQuery: "moon night sky",
  },
  {
    id: "figure",
    title: "今日人物",
    excerpt: "李白，唐代伟大的浪漫主义诗人，被誉为诗仙。",
    category: "人物",
    imageQuery: "ancient chinese poet Li Bai",
  },
  {
    id: "story",
    title: "今日典故",
    excerpt: "卧薪尝胆：形容人刻苦自励，立志报仇雪耻。",
    category: "典故",
    imageQuery: "ancient chinese warrior",
  },
  {
    id: "heritage",
    title: "今日非遗",
    excerpt: "昆曲，中国传统戏曲中最古老的剧种之一。",
    category: "非遗",
    imageQuery: "kunqu opera chinese traditional",
  },
];

export function TodayCards() {
  const [todayItems, setTodayItems] = useState<TodayItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodayItems();
  }, []);

  const fetchTodayItems = async () => {
    try {
      setLoading(true);
      
      const currentTerm = getCurrentSolarTerm();
      const items: TodayItem[] = [];

      items.push({
        id: "solar-term",
        title: "今日节气",
        excerpt: `今日是${currentTerm.name}，${currentTerm.description}`,
        category: "节气",
        imageQuery: `${currentTerm.name} solar term chinese`,
      });

      for (const staticItem of staticItems) {
        items.push({
          ...staticItem,
          imageLoading: true,
        });
      }

      await Promise.all(
        items.filter(item => item.imageQuery).map(async (item) => {
          try {
            const response = await fetch(`/api/search-image?q=${encodeURIComponent(item.imageQuery!)}`);
            const data = await response.json();
            if (data.url) {
              setTodayItems(prev => prev.map(i => 
                i.id === item.id ? { ...i, imageUrl: data.url, imageLoading: false } : i
              ));
            }
          } catch (error) {
            console.error(`Failed to fetch image for ${item.title}:`, error);
            setTodayItems(prev => prev.map(i => 
              i.id === item.id ? { ...i, imageLoading: false } : i
            ));
          }
        })
      );

      setTodayItems(items);
    } catch (error) {
      console.error("Failed to fetch today items:", error);
      setTodayItems(getStaticTodayItems());
    } finally {
      setLoading(false);
    }
  };

  const getStaticTodayItems = (): TodayItem[] => {
    const currentTerm = getCurrentSolarTerm();
    return [
      {
        id: "solar-term",
        title: "今日节气",
        excerpt: `今日是${currentTerm.name}，${currentTerm.description}`,
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
              <div className="relative h-28 overflow-hidden">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-secondary via-background to-secondary">
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
                )}
                {item.imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card/90 to-transparent" />
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
