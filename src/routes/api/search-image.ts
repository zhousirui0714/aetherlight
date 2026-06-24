import { createFileRoute } from "@tanstack/react-router";

interface CacheEntry {
  url: string;
  timestamp: number;
}

const imageCache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24小时缓存

// 精确的 Wikipedia 页面映射（标题 -> Wikipedia 页面标题）
const wikipediaPageMap: Record<string, string> = {
  // 节气
  "立春：东风解冻": "Beginning_of_Spring",
  "雨水：润物细无声": "Rain_Water",
  "惊蛰：春雷初响": "Awakening_of_Insects",
  "春分：昼夜平分": "Vernal_Equinox",
  "清明：踏青扫墓": "Qingming_Festival",
  "谷雨：雨生百谷": "Grain_Rain",
  "立夏": "Beginning_of_Summer",
  "小满": "Lesser_Fullness_of_Grain",
  "芒种": "Grain_in_Ear",
  "夏至": "Summer_Solstice",
  "小暑": "Lesser_Heat",
  "大暑": "Greater_Heat",
  "立秋": "Beginning_of_Autumn",
  "处暑": "End_of_Heat",
  "白露": "White_Dew",
  "寒露": "Cold_Dew",
  "霜降": "Frost's_Descent",
  "立冬": "Beginning_of_Winter",
  "小雪": "Lesser_Snow",
  "大雪": "Greater_Snow",
  "冬至": "Winter_Solstice",
  "小寒": "Lesser_Cold",
  "大寒": "Greater_Cold",
  // 节日
  "端午：汨罗江畔的千年追思": "Dragon_Boat_Festival",
  "中秋：月圆人团圆": "Mid-Autumn_Festival",
  "重阳：登高望远": "Double_Ninth_Festival",
  "春节：辞旧迎新": "Chinese_New_Year",
  "清明：慎终追远": "Qingming_Festival",
  "端午": "Dragon_Boat_Festival",
  "中秋": "Mid-Autumn_Festival",
  "重阳": "Double_Ninth_Festival",
  "春节": "Chinese_New_Year",
  "元宵": "Lantern_Festival",
  "七夕": "Qixi_Festival",
  "腊八": "Laba_Festival",
  // 诗词
  "静夜思·李白": "Quiet_Night_Thoughts",
  "水调歌头·明月几时有": "Shuidiao_Getou",
  "将进酒·李白": "Qiang_Jin_Jiu",
  "出师表·诸葛亮": "Chu_Shi_Biao",
  "静夜思": "Quiet_Night_Thoughts",
  "水调歌头": "Shuidiao_Getou",
  "将进酒": "Qiang_Jin_Jiu",
  "出师表": "Chu_Shi_Biao",
  "春晓": "Spring_Dawn",
  "登鹳雀楼": "Climbing_Stork_Tower",
  "悯农": "Pity_the_Peasants",
  "咏鹅": "Ode_to_the_Goose",
  "望庐山瀑布": "Viewing_the_Waterfall_at_Mount_Lu",
  "早发白帝城": "Departing_from_Baidi_Town_at_Dawn",
  // 典籍
  "《论语》：半部治天下": "Analerta",
  "《诗经》：风雅颂的源头": "Classic_of_Poetry",
  "《道德经》：道法自然": "Tao_Te_Ching",
  "《黄帝内经》：中医之祖": "Huangdi_Nejing",
  "论语": "Analerta",
  "诗经": "Classic_of_Poetry",
  "道德经": "Tao_Te_Ching",
  "黄帝内经": "Huangdi_Nejing",
  "周易": "I_Ching",
  "楚辞": "Chu_Ci",
  // 非遗
  "昆曲：百戏之祖": "Kunqu",
  "青花瓷：景德镇的蓝白韵律": "Blue_and_white_porcelain",
  "景泰蓝：皇家工艺": "Cloisonné",
  "剪纸：纸上生花": "Chinese_paper_cutting",
  "昆曲": "Kunqu",
  "青花瓷": "Blue_and_white_porcelain",
  "景泰蓝": "Cloisonné",
  "剪纸": "Chinese_paper_cutting",
  "刺绣": "Chinese_embroidery",
  "皮影戏": "Shadow_play",
  // 民俗
  "茶事：一盏清欢": "Chinese_tea_culture",
  "中国礼：礼仪之邦": "Chinese_etiquette",
  "对联：楹联艺术": "Chinese_couplet",
  "风水：天人合一": "Feng_shui",
  "茶事": "Chinese_tea_culture",
  "中国礼": "Chinese_etiquette",
  "对联": "Chinese_couplet",
  "风水": "Feng_shui",
  "书法": "Chinese_calligraphy",
  "国画": "Chinese_painting",
  "围棋": "Go_(game)",
  // 人物
  "苏东坡：也无风雨也无晴": "Su_Shi",
  "李白：诗仙醉月": "Li_Bai",
  "孔子：万世师表": "Confucius",
  "庄子：逍遥游": "Zhuang_Zhou",
  "王羲之：书圣": "Wang_Xizhi",
  "李清照：千古第一才女": "Li_Qingzhao",
  "苏东坡": "Su_Shi",
  "李白": "Li_Bai",
  "杜甫": "Du_Fu",
  "白居易": "Bai_Juyi",
  "苏轼": "Su_Shi",
  "王维": "Wang_Wei",
  "屈原": "Qu_Yuan",
  "陆游": "Lu_You",
  "孔子": "Confucius",
  "庄子": "Zhuang_Zhou",
  "王羲之": "Wang_Xizhi",
  "李清照": "Li_Qingzhao",
  "唐寅": "Tang_Yin",
};

// 中文关键词到英文的映射，提高 Wikimedia 搜索命中率
const keywordMap: Record<string, string> = {
  // 节气 - 完整标题匹配
  "立春：东风解冻": "spring beginning nature cherry blossom",
  "雨水：润物细无声": "spring rain gentle drizzle nature",
  "惊蛰：春雷初响": "spring thunder awakening insects",
  "春分：昼夜平分": "spring equinox sunrise balance",
  "清明：踏青扫墓": "Qingming Festival tomb sweeping spring outing",
  "谷雨：雨生百谷": "grain rain agriculture spring",
  "立夏": "summer beginning nature",
  "小满": "grain buds wheat field",
  "芒种": "grain in ear harvest farming",
  "夏至": "summer solstice sunlight lotus",
  "小暑": "minor heat summer hot",
  "大暑": "major heat summer hottest",
  "立秋": "autumn beginning fall leaves",
  "处暑": "end of heat autumn cooling",
  "白露": "white dew autumn morning",
  "寒露": "cold dew autumn chilly",
  "霜降": "frost descent autumn late",
  "立冬": "winter beginning snow cold",
  "小雪": "light snow winter first",
  "大雪": "heavy snow winter landscape",
  "冬至": "winter solstice shortest day",
  "小寒": "minor cold winter freezing",
  "大寒": "major cold winter coldest",
  // 节气 - 简称匹配
  "立春": "spring beginning nature",
  "雨水": "rain water spring",
  "惊蛰": "awakening insects spring",
  "春分": "spring equinox",
  "清明": "Qingming Festival",
  "谷雨": "grain rain",
  // 节日
  "端午：汨罗江畔的千年追思": "Dragon Boat Festival zongzi rice dumpling",
  "中秋：月圆人团圆": "Mid-Autumn Festival full moon mooncake",
  "重阳：登高望远": "Double Ninth Festival chrysanthemum autumn",
  "春节：辞旧迎新": "Chinese New Year Spring Festival red lantern",
  "清明：慎终追远": "Qingming Festival tomb sweeping",
  "端午": "Dragon Boat Festival zongzi",
  "中秋": "Mid-Autumn Festival moon",
  "重阳": "Double Ninth Festival",
  "春节": "Chinese New Year Spring Festival",
  "元宵": "Lantern Festival lanterns",
  "七夕": "Qixi Festival Chinese Valentine",
  "腊八": "Laba Festival congee",
  // 诗词
  "静夜思·李白": "moon night sky moonlight poetry Li Bai",
  "水调歌头·明月几时有": "full moon night Chinese poetry Su Shi",
  "将进酒·李白": "Chinese wine ancient poetry Li Bai",
  "出师表·诸葛亮": "ancient Chinese scroll calligraphy Zhuge Liang",
  "静夜思": "moon night sky moonlight",
  "水调歌头": "full moon night Chinese poetry",
  "将进酒": "Chinese wine ancient poetry",
  "出师表": "ancient Chinese scroll calligraphy",
  "春晓": "spring morning flowers birds",
  "登鹳雀楼": "ancient Chinese tower landscape",
  "悯农": "farming agriculture field rice",
  "咏鹅": "white goose water pond",
  "望庐山瀑布": "waterfall mountain landscape",
  "早发白帝城": "river landscape ancient China",
  // 典籍
  "《论语》：半部治天下": "Confucius ancient Chinese book Analects",
  "《诗经》：风雅颂的源头": "Book of Songs ancient Chinese poetry",
  "《道德经》：道法自然": "Tao Te Ching ancient philosophy Laozi",
  "《黄帝内经》：中医之祖": "Chinese medicine ancient book Huangdi Neijing",
  "论语": "Confucius Analects ancient book",
  "诗经": "Book of Songs ancient poetry",
  "道德经": "Tao Te Ching ancient philosophy",
  "黄帝内经": "Chinese medicine ancient book",
  "周易": "I Ching ancient divination",
  "楚辞": "Chu Ci ancient poetry Qu Yuan",
  // 非遗
  "昆曲：百戏之祖": "Kunqu opera Chinese traditional theater",
  "青花瓷：景德镇的蓝白韵律": "blue and white porcelain China Jingdezhen",
  "景泰蓝：皇家工艺": "cloisonne enamel art imperial",
  "剪纸：纸上生花": "Chinese paper cutting art folk",
  "昆曲": "Kunqu opera Chinese",
  "青花瓷": "blue and white porcelain China",
  "景泰蓝": "cloisonne enamel art",
  "剪纸": "Chinese paper cutting",
  "刺绣": "Chinese embroidery silk",
  "皮影戏": "shadow puppetry China",
  // 民俗
  "茶事：一盏清欢": "Chinese tea ceremony teapot traditional",
  "中国礼：礼仪之邦": "Chinese etiquette ceremony traditional",
  "对联：楹联艺术": "Chinese couplets calligraphy Spring Festival",
  "风水：天人合一": "feng shui traditional Chinese landscape",
  "茶事": "Chinese tea ceremony",
  "中国礼": "Chinese etiquette ceremony",
  "对联": "Chinese couplets calligraphy",
  "风水": "feng shui traditional",
  "书法": "Chinese calligraphy brush",
  "国画": "Chinese painting ink landscape",
  "围棋": "Go game Weiqi board",
  // 人物
  "苏东坡：也无风雨也无晴": "Su Shi poet Song dynasty portrait",
  "李白：诗仙醉月": "Li Bai poet Tang dynasty portrait moon",
  "孔子：万世师表": "Confucius Chinese philosopher portrait",
  "庄子：逍遥游": "Zhuangzi Chinese philosophy portrait butterfly",
  "王羲之：书圣": "Wang Xizhi Chinese calligrapher portrait",
  "李清照：千古第一才女": "Li Qingzhao Chinese poetess portrait",
  "苏东坡": "Su Shi poet Song dynasty",
  "李白": "Li Bai poet Tang dynasty",
  "杜甫": "Du Fu poet Tang dynasty",
  "白居易": "Bai Juyi poet Tang dynasty",
  "苏轼": "Su Shi poet Song dynasty",
  "王维": "Wang Wei poet Tang dynasty",
  "屈原": "Qu Yuan poet Chu",
  "陆游": "Lu You poet Song dynasty",
  "孔子": "Confucius Chinese philosopher",
  "庄子": "Zhuangzi Chinese philosophy",
  "王羲之": "Wang Xizhi Chinese calligrapher",
  "李清照": "Li Qingzhao Chinese poetess",
  "唐寅": "Tang Yin ancient painter",
  // 典故
  "卧薪尝胆": "Goujian revenge Yue kingdom",
  "夏至一阴生": "yin yang taiji diagram",
  "阴阳转换": "yin yang taiji symbol",
};

// 将中文查询转换为更易搜索的英文关键词
function translateQuery(query: string): string {
  for (const [cn, en] of Object.entries(keywordMap)) {
    if (query.includes(cn)) {
      return en;
    }
  }
  return query;
}

// 带超时的 fetch
async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Aetherlight/1.0 (educational culture project; contact@aetherlight.app)" },
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

// 方法1：通过 Wikimedia Commons 搜索图片
async function searchWikimediaCommons(query: string): Promise<string | null> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodedQuery}&gsrnamespace=6&gsrlimit=10&format=json&prop=imageinfo&iiprop=url&iiurlwidth=400`;

    const response = await fetchWithTimeout(url);
    const data = await response.json();

    if (!data.query || !data.query.pages) return null;

    const pages = Object.values(data.query.pages) as any[];
    pages.sort((a, b) => (a.index || 0) - (b.index || 0));

    for (const page of pages) {
      if (page.imageinfo && page.imageinfo[0] && page.imageinfo[0].thumburl) {
        return page.imageinfo[0].thumburl;
      }
      if (page.title) {
        const title = page.title.replace(/ /g, "_");
        return `https://commons.wikimedia.org/wiki/Special:FilePath/${title}?width=400`;
      }
    }
    return null;
  } catch (error) {
    console.error("Wikimedia Commons search error:", error);
    return null;
  }
}

// 方法2：通过 Wikipedia REST API 获取页面首图
async function searchWikipediaImage(query: string): Promise<string | null> {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
    const searchResponse = await fetchWithTimeout(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
      return null;
    }

    const title = searchData.query.search[0].title;

    const imageUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&piprop=thumbnail&pithumbsize=400&origin=*`;
    const imageResponse = await fetchWithTimeout(imageUrl);
    const imageData = await imageResponse.json();

    if (!imageData.query || !imageData.query.pages) return null;

    const pages = Object.values(imageData.query.pages) as any[];
    for (const page of pages) {
      if (page.thumbnail && page.thumbnail.source) {
        return page.thumbnail.source;
      }
    }
    return null;
  } catch (error) {
    console.error("Wikipedia image search error:", error);
    return null;
  }
}

// 方法3：通过中文 Wikipedia 获取图片
async function searchChineseWikipediaImage(query: string): Promise<string | null> {
  try {
    const searchUrl = `https://zh.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
    const searchResponse = await fetchWithTimeout(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
      return null;
    }

    const title = searchData.query.search[0].title;

    const imageUrl = `https://zh.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&piprop=thumbnail&pithumbsize=400&origin=*`;
    const imageResponse = await fetchWithTimeout(imageUrl);
    const imageData = await imageResponse.json();

    if (!imageData.query || !imageData.query.pages) return null;

    const pages = Object.values(imageData.query.pages) as any[];
    for (const page of pages) {
      if (page.thumbnail && page.thumbnail.source) {
        return page.thumbnail.source;
      }
    }
    return null;
  } catch (error) {
    console.error("Chinese Wikipedia image search error:", error);
    return null;
  }
}

// 方法4：通过精确的 Wikipedia 页面映射获取图片
async function getWikipediaPageImage(pageTitle: string): Promise<string | null> {
  try {
    const imageUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&format=json&piprop=thumbnail&pithumbsize=400&origin=*`;
    const imageResponse = await fetchWithTimeout(imageUrl);
    const imageData = await imageResponse.json();

    if (!imageData.query || !imageData.query.pages) return null;

    const pages = Object.values(imageData.query.pages) as any[];
    for (const page of pages) {
      if (page.thumbnail && page.thumbnail.source) {
        return page.thumbnail.source;
      }
    }
    return null;
  } catch (error) {
    console.error("Wikipedia page image error:", error);
    return null;
  }
}

export const Route = createFileRoute("/api/search-image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");

        if (!query) {
          return new Response(JSON.stringify({ error: "Missing query" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const cacheKey = query.toLowerCase().trim();
        const cached = imageCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          return new Response(JSON.stringify({ url: cached.url, fromCache: true }), {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=86400",
            },
          });
        }

        // 优先使用精确的 Wikipedia 页面映射
        const exactPage = wikipediaPageMap[query];
        if (exactPage) {
          const imageUrl = await getWikipediaPageImage(exactPage);
          if (imageUrl) {
            imageCache.set(cacheKey, { url: imageUrl, timestamp: Date.now() });
            return new Response(JSON.stringify({ url: imageUrl }), {
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "public, max-age=86400",
              },
            });
          }
        }

        // 如果没有精确映射，使用关键词翻译和搜索
        const translatedQuery = translateQuery(query);

        // 依次尝试多种图片源
        const imageSources = [
          () => searchWikimediaCommons(translatedQuery),
          () => searchWikipediaImage(translatedQuery),
          () => searchChineseWikipediaImage(query),
          () => searchWikimediaCommons(query),
        ];

        for (const searchFn of imageSources) {
          try {
            const imageUrl = await searchFn();
            if (imageUrl) {
              imageCache.set(cacheKey, { url: imageUrl, timestamp: Date.now() });
              return new Response(JSON.stringify({ url: imageUrl }), {
                headers: {
                  "Content-Type": "application/json",
                  "Cache-Control": "public, max-age=86400",
                },
              });
            }
          } catch (error) {
            console.error("Image source error:", error);
          }
        }

        return new Response(JSON.stringify({ url: "", message: "No image found" }), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=1800",
          },
        });
      },
    },
  },
});
