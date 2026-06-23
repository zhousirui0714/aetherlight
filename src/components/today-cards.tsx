import { useState, useEffect, useRef } from "react";
import { Calendar, BookOpen, User, Scroll, Award } from "lucide-react";
import { fetchDailyPush } from "@/lib/daily-push.functions";

interface TodayItem {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  termName?: string;
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

function getPoetryExcerpt(content: string): string {
  // 从内容中提取与诗词相关的信息
  const poetryKeywords = ['诗', '词', '韵', '吟', '咏', '赋', '律', '绝', '古体', '近体', '风雅', '骚人'];
  const poetryPatterns = [
    new RegExp(`(['"\`][^'\`"]{10,80}['"\`])`, 'g'),  // 引号内的内容
    /([^\s]{10,80}[，。；！？])/g,  // 句子片段
  ];
  
  for (const keyword of poetryKeywords) {
    if (content.includes(keyword)) {
      for (const pattern of poetryPatterns) {
        const match = content.match(pattern);
        if (match) {
          return match[0].substring(0, 100) + (match[0].length > 100 ? "..." : "");
        }
      }
    }
  }
  
  // 如果没有找到诗词相关内容，生成一个示例
  return "采菊东篱下，悠然见南山。山气日夕佳，飞鸟相与还。";
}

function getFigureExcerpt(content: string): string {
  // 从内容中提取与人物相关的信息
  const figureKeywords = ['人', '士', '贤', '杰', '圣', '师', '家', '先贤', '名士', '大家', '学者', '文人', '诗人'];
  const figurePatterns = [
    new RegExp(`([^，。；！？]*?[^，。；！？]*?(?:${figureKeywords.join('|')})[^，。；！？]*?[，。；！？])`, 'g'),
    /([^，。；！？]*?[^，。；！？]*?(?:生于|著有|擅长|开创)[^，。；！？]*?[，。；！？])/g,
  ];
  
  for (const keyword of figureKeywords) {
    if (content.includes(keyword)) {
      for (const pattern of figurePatterns) {
        const matches = content.match(pattern);
        if (matches && matches.length > 0) {
          return matches[0].substring(0, 100) + (matches[0].length > 100 ? "..." : "");
        }
      }
    }
  }
  
  // 如果没有找到人物相关内容，生成一个示例
  return "李白（701年-762年），字太白，号青莲居士，唐代伟大的浪漫主义诗人，被誉为诗仙。";
}

function getHeritageExcerpt(content: string): string {
  // 从内容中提取与非遗相关的信息
  const heritageKeywords = ['遗', '传', '艺', '技', '工', '俗', '风', '习', '匠', '手', '古法', '传统', '技艺', '工艺', '民俗'];
  const heritagePatterns = [
    new RegExp(`([^，。；！？]*?[^，。；！？]*?(?:${heritageKeywords.join('|')})[^，。；！？]*?[，。；！？])`, 'g'),
    /([^，。；！？]*?[^，。；！？]*?(?:流传|传承|古老|传统)[^，。；！？]*?[，。；！？])/g,
  ];
  
  for (const keyword of heritageKeywords) {
    if (content.includes(keyword)) {
      for (const pattern of heritagePatterns) {
        const matches = content.match(pattern);
        if (matches && matches.length > 0) {
          return matches[0].substring(0, 100) + (matches[0].length > 100 ? "..." : "");
        }
      }
    }
  }
  
  // 如果没有找到非遗相关内容，生成一个示例
  return "昆曲，中国现存最古老的戏曲形式之一，被誉为百戏之祖，2001年被联合国教科文组织列为人类口述和非物质遗产代表作。";
}

export function TodayCards() {
  const [todayItems, setTodayItems] = useState<TodayItem[]>([]);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadTodayItems();
  }, []);

  const loadTodayItems = async () => {
    try {
      // 获取今天的日期
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD 格式
      
      // 从每日推送中获取今天的个性化内容
      const dailyPushData = await fetchDailyPush({ data: { date: dateStr } });
      
      // 获取不同类型的文化内容
      const solarTerm = getCurrentSolarTerm();
      
      // 创建今天的主要文化推送卡片
      const todayItems: TodayItem[] = [
        {
          id: "daily-push",
          title: dailyPushData.title,
          excerpt: dailyPushData.body.substring(0, 100) + (dailyPushData.body.length > 100 ? "..." : ""),
          category: "今日推荐",
          termName: dailyPushData.source_note || ""
        },
        {
          id: "solar-term",
          title: "今日节气",
          excerpt: `今日是${solarTerm.name}，${solarTerm.description}`,
          category: "节气",
          termName: solarTerm.name,
        },
        {
          id: "poetry",
          title: "诗词赏析",
          excerpt: getPoetryExcerpt(dailyPushData.body),
          category: "诗词",
        },
        {
          id: "figure",
          title: "文化名人",
          excerpt: getFigureExcerpt(dailyPushData.body),
          category: "人物",
        },
        {
          id: "heritage",
          title: "文化瑰宝",
          excerpt: getHeritageExcerpt(dailyPushData.body),
          category: "非遗",
        },
      ];

      setTodayItems(todayItems);
    } catch (error) {
      console.error("加载今日推送内容失败:", error);
      
      // 如果加载失败，则使用默认内容
      const currentTerm = getCurrentSolarTerm();
      const fallbackItems: TodayItem[] = [
        {
          id: "fallback-1",
          title: "今日文化",
          excerpt: "今日为您推荐一份独特的文化内容，感受千年智慧的魅力。",
          category: "文化",
        },
        {
          id: "solar-term",
          title: "今日节气",
          excerpt: `今日是${currentTerm.name}，${currentTerm.description}`,
          category: "节气",
          termName: currentTerm.name,
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
          id: "heritage",
          title: "今日非遗",
          excerpt: "昆曲，中国传统戏曲中最古老的剧种之一。",
          category: "非遗",
        },
      ];

      setTodayItems(fallbackItems);
    }
  };

  const handleImageLoad = (id: string) => {
    setLoadedImages(prev => new Set([...prev, id]));
  };

  const handleImageError = (id: string) => {
    setFailedImages(prev => new Set([...prev, id]));
    setLoadedImages(prev => new Set([...prev, id]));
  };

  return (
    <section className="mt-12">
      <div className="mb-8 text-center">
        <div className="font-serif text-xs tracking-[0.4em] text-accent">TODAY'S HIGHLIGHTS</div>
        <h2 className="mt-2 font-serif text-3xl text-foreground">今 日 撷 英</h2>
        <p className="mt-2 text-sm text-muted-foreground">每日精选 · 文化瑰宝</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {todayItems.map((item) => {
          const Icon = categoryIcons[item.category] || BookOpen;
          const bgColor = categoryColors[item.category] || "bg-gray-500";
          
          // 为每个卡片生成基于内容的图片
          const imageUrl = item.id === "daily-push" 
            ? `https://picsum.photos/seed/${encodeURIComponent(item.title)}/400/200` 
            : `https://picsum.photos/seed/${item.category}/400/200`;
            
          const isLoaded = loadedImages.has(item.id);
          const isFailed = failedImages.has(item.id);
          
          return (
            <a
              key={item.id}
              href={item.id === "daily-push" ? `/daily` : `/gallery?category=${encodeURIComponent(item.category)}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
            >
              <div className="relative h-28 overflow-hidden">
                {isFailed || !imageUrl ? (
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
                ) : (
                  <>
                    <img
                      src={imageUrl}
                      alt={item.title}
                      className={`h-full w-full object-cover transition-all duration-500 ${
                        isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
                      } group-hover:scale-110`}
                      onLoad={() => handleImageLoad(item.id)}
                      onError={() => handleImageError(item.id)}
                      loading="lazy"
                    />
                    {!isLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-secondary via-background to-secondary">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bgColor}/20`}>
                          <Icon className={`h-6 w-6 ${bgColor.replace("bg-", "text-")} animate-pulse`} />
                        </div>
                      </div>
                    )}
                  </>
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
