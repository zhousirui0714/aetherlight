import { useState, useEffect, useRef } from "react";
import { Calendar, BookOpen, User, Scroll, Award } from "lucide-react";

interface TodayItem {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  imageUrl?: string;
  seed: number;
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

// 预定义的文化图片 URL（更快加载）
const culturalImages: Record<string, string> = {
  "节气-小寒": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Winter_in_Harbin_2.jpg/400px-Winter_in_Harbin_2.jpg",
  "节气-大寒": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Winter_in_Harbin_2.jpg/400px-Winter_in_Harbin_2.jpg",
  "节气-立春": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Doumer_Bridge_in_Spring.jpg/400px-Doumer_Bridge_in_Spring.jpg",
  "节气-雨水": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Tokyo_rainy_season.jpg/400px-Tokyo_rainy_season.jpg",
  "节气-惊蛰": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Thunderstorm_in_the_Makgadikgadi_Pan.jpg/400px-Thunderstorm_in_the_Makgadikgadi_Pan.jpg",
  "节气-春分": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Tulip_fields,_skagit_county,_washington,_usa_02.jpg/400px-Tulip_fields%2C_skagit_county%2C_washington%2C_usa_02.jpg",
  "节气-清明": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Weeping_cherry_tree_in_Shin_Umesato_Park.jpg/400px-Weeping_cherry_tree_in_Shin_Umesato_Park.jpg",
  "节气-谷雨": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Rice_paddy_in_Yangsan.jpg/400px-Rice_paddy_in_Yangsan.jpg",
  "节气-立夏": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Summer_in_the_Alps.jpg/400px-Summer_in_the_Alps.jpg",
  "节气-小满": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Wheat_field_in_Gansu.jpg/400px-Wheat_field_in_Gansu.jpg",
  "节气-芒种": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Wheat_field_in_Gansu.jpg/400px-Wheat_field_in_Gansu.jpg",
  "节气-夏至": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Summer_in_the_Alps.jpg/400px-Summer_in_the_Alps.jpg",
  "节气-小暑": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Summer_in_the_Alps.jpg/400px-Summer_in_the_Alps.jpg",
  "节气-大暑": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Summer_in_the_Alps.jpg/400px-Summer_in_the_Alps.jpg",
  "节气-立秋": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Autumn_leaves_in_Johvi.jpg/400px-Autumn_leaves_in_Johvi.jpg",
  "节气-处暑": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Autumn_leaves_in_Johvi.jpg/400px-Autumn_leaves_in_Johvi.jpg",
  "节气-白露": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Autumn_leaves_in_Johvi.jpg/400px-Autumn_leaves_in_Johvi.jpg",
  "节气-秋分": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Autumn_leaves_in_Johvi.jpg/400px-Autumn_leaves_in_Johvi.jpg",
  "节气-寒露": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Autumn_leaves_in_Johvi.jpg/400px-Autumn_leaves_in_Johvi.jpg",
  "节气-霜降": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Frost_on_leaves.jpg/400px-Frost_on_leaves.jpg",
  "节气-立冬": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Snowy_landscape.jpg/400px-Snowy_landscape.jpg",
  "节气-小雪": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Snowy_landscape.jpg/400px-Snowy_landscape.jpg",
  "节气-大雪": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Snowy_landscape.jpg/400px-Snowy_landscape.jpg",
  "节气-冬至": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Snowy_landscape.jpg/400px-Snowy_landscape.jpg",
  "诗词": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/In_the_Moonlit_Night_While_Traveling.jpg/400px-In_the_Moonlit_Night_While_Traveling.jpg",
  "人物": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Li_Bai.jpg/400px-Li_Bai.jpg",
  "典故": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Ma_Yuan_-_Water_Album_-_Walters_W11020B.jpg/400px-Ma_Yuan_-_Water_Album_-_Walters_W11020B.jpg",
  "非遗": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Kunqu_Opera%2C_2007.jpg/400px-Kunqu_Opera%2C_2007.jpg",
};

function getImageUrl(category: string, termName?: string): string {
  if (termName) {
    const key = `${category}-${termName}`;
    return culturalImages[key] || culturalImages[`${category}-${termName.slice(0, 2)}`] || culturalImages[category];
  }
  return culturalImages[category] || "";
}

export function TodayCards() {
  const [todayItems, setTodayItems] = useState<TodayItem[]>([]);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const imageRefs = useRef<Map<string, HTMLImageElement>>(new Map());

  useEffect(() => {
    initializeTodayItems();
  }, []);

  const initializeTodayItems = () => {
    const currentTerm = getCurrentSolarTerm();
    const baseItems = [
      {
        id: "solar-term",
        title: "今日节气",
        excerpt: `今日是${currentTerm.name}，${currentTerm.description}`,
        category: "节气",
        termName: currentTerm.name,
        seed: currentTerm.name.charCodeAt(0) + currentTerm.name.charCodeAt(1),
      },
      {
        id: "poetry",
        title: "今日诗词",
        excerpt: "床前明月光，疑是地上霜。举头望明月，低头思故乡。",
        category: "诗词",
        seed: 1001,
      },
      {
        id: "figure",
        title: "今日人物",
        excerpt: "李白，唐代伟大的浪漫主义诗人，被誉为诗仙。",
        category: "人物",
        seed: 1002,
      },
      {
        id: "story",
        title: "今日典故",
        excerpt: "卧薪尝胆：形容人刻苦自励，立志报仇雪耻。",
        category: "典故",
        seed: 1003,
      },
      {
        id: "heritage",
        title: "今日非遗",
        excerpt: "昆曲，中国传统戏曲中最古老的剧种之一。",
        category: "非遗",
        seed: 1004,
      },
    ];

    setTodayItems(baseItems.map(item => ({
      ...item,
      termName: (item as { termName?: string }).termName,
    })));
  };

  const handleImageLoad = (id: string) => {
    setLoadedImages(prev => new Set([...prev, id]));
  };

  const handleImageError = (id: string) => {
    setFailedImages(prev => new Set([...prev, id]));
    setLoadedImages(prev => new Set([...prev, id]));
  };

  const renderImage = (item: TodayItem) => {
    const termName = (item as { termName?: string }).termName;
    const imageUrl = getImageUrl(item.category, termName);
    const isLoaded = loadedImages.has(item.id);
    const isFailed = failedImages.has(item.id);
    const Icon = categoryIcons[item.category] || BookOpen;
    const bgColor = categoryColors[item.category] || "bg-gray-500";

    if (isFailed || !imageUrl) {
      return (
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
      );
    }

    return (
      <>
        <img
          ref={(el) => {
            if (el) imageRefs.current.set(item.id, el);
          }}
          src={imageUrl}
          alt={item.title}
          className={`h-full w-full object-cover transition-all duration-500 ${
            isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
          } group-hover:scale-110`}
          onLoad={() => handleImageLoad(item.id)}
          onError={() => handleImageError(item.id)}
          loading="eager"
        />
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-secondary via-background to-secondary">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bgColor}/20`}>
              <Icon className={`h-6 w-6 ${bgColor.replace("bg-", "text-")} animate-pulse`} />
            </div>
          </div>
        )}
      </>
    );
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
          
          return (
            <a
              key={item.id}
              href={`/gallery?category=${encodeURIComponent(item.category)}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
            >
              <div className="relative h-28 overflow-hidden">
                {renderImage(item)}
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
