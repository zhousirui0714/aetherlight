import { createFileRoute } from "@tanstack/react-router";

interface CacheEntry {
  url: string;
  timestamp: number;
}

const imageCache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24小时缓存

// 精确的中文 Wikipedia 页面映射（标题 -> 中文 Wikipedia 页面标题）
const wikipediaPageMap: Record<string, string> = {
  // 节气
  "立春：东风解冻": "立春",
  "雨水：润物细无声": "雨水",
  "惊蛰：春雷初响": "惊蛰",
  "春分：昼夜平分": "春分",
  "清明：踏青扫墓": "清明节",
  "谷雨：雨生百谷": "谷雨",
  "立夏": "立夏",
  "小满": "小满",
  "芒种": "芒种",
  "夏至": "夏至",
  "小暑": "小暑",
  "大暑": "大暑",
  "立秋": "立秋",
  "处暑": "处暑",
  "白露": "白露",
  "寒露": "寒露",
  "霜降": "霜降",
  "立冬": "立冬",
  "小雪": "小雪",
  "大雪": "大雪",
  "冬至": "冬至",
  "小寒": "小寒",
  "大寒": "大寒",
  // 节日
  "端午：汨罗江畔的千年追思": "端午节",
  "中秋：月圆人团圆": "中秋节",
  "重阳：登高望远": "重阳节",
  "春节：辞旧迎新": "春节",
  "清明：慎终追远": "清明节",
  "端午": "端午节",
  "中秋": "中秋节",
  "重阳": "重阳节",
  "春节": "春节",
  "元宵": "元宵节",
  "七夕": "七夕节",
  "腊八": "腊八节",
  // 诗词
  "静夜思·李白": "静夜思",
  "水调歌头·明月几时有": "水调歌头·明月几时有",
  "将进酒·李白": "将进酒",
  "出师表·诸葛亮": "出师表",
  "静夜思": "静夜思",
  "水调歌头": "水调歌头·明月几时有",
  "将进酒": "将进酒",
  "出师表": "出师表",
  "春晓": "春晓",
  "登鹳雀楼": "登鹳雀楼",
  "悯农": "悯农",
  "咏鹅": "咏鹅",
  "望庐山瀑布": "望庐山瀑布",
  "早发白帝城": "早发白帝城",
  // 典籍
  "《论语》：半部治天下": "论语",
  "《诗经》：风雅颂的源头": "诗经",
  "《道德经》：道法自然": "道德经",
  "《黄帝内经》：中医之祖": "黄帝内经",
  "论语": "论语",
  "诗经": "诗经",
  "道德经": "道德经",
  "黄帝内经": "黄帝内经",
  "周易": "周易",
  "楚辞": "楚辞",
  // 非遗
  "昆曲：百戏之祖": "昆曲",
  "青花瓷：景德镇的蓝白韵律": "青花瓷",
  "景泰蓝：皇家工艺": "景泰蓝",
  "剪纸：纸上生花": "剪纸",
  "昆曲": "昆曲",
  "青花瓷": "青花瓷",
  "景泰蓝": "景泰蓝",
  "剪纸": "剪纸",
  "刺绣": "刺绣",
  "皮影戏": "皮影戏",
  // 民俗
  "茶事：一盏清欢": "中国茶文化",
  "中国礼：礼仪之邦": "中国礼仪",
  "对联：楹联艺术": "对联",
  "风水：天人合一": "风水",
  "茶事": "中国茶文化",
  "中国礼": "中国礼仪",
  "对联": "对联",
  "风水": "风水",
  "书法": "中国书法",
  "国画": "中国画",
  "围棋": "围棋",
  // 人物
  "苏东坡：也无风雨也无晴": "苏轼",
  "李白：诗仙醉月": "李白",
  "孔子：万世师表": "孔子",
  "庄子：逍遥游": "庄子",
  "王羲之：书圣": "王羲之",
  "李清照：千古第一才女": "李清照",
  "苏东坡": "苏轼",
  "李白": "李白",
  "杜甫": "杜甫",
  "白居易": "白居易",
  "苏轼": "苏轼",
  "王维": "王维",
  "屈原": "屈原",
  "陆游": "陆游",
  "孔子": "孔子",
  "庄子": "庄子",
  "王羲之": "王羲之",
  "李清照": "李清照",
  "唐寅": "唐寅",
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

// 从标题中提取核心关键词（去掉副标题、作者等）
function extractKeyword(title: string): string {
  // 先处理带书名号的标题，如"《论语》：半部治天下" -> "论语"
  if (title.includes("《") && title.includes("》")) {
    const match = title.match(/《([^》]+)》/);
    if (match) return match[1];
  }
  // 处理带冒号的标题，如"立春：东风解冻" -> "立春"
  if (title.includes("：")) {
    return title.split("：")[0];
  }
  // 处理带点的标题，如"静夜思·李白" -> "静夜思"
  if (title.includes("·")) {
    return title.split("·")[0];
  }
  return title;
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

// 方法1.1：严格模式的 Wikimedia Commons 搜索（只返回高度相关的图片）
async function searchWikimediaCommonsStrict(query: string): Promise<string | null> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodedQuery}&gsrnamespace=6&gsrlimit=5&format=json&prop=imageinfo&iiprop=url&iiurlwidth=400`;

    const response = await fetchWithTimeout(url);
    const data = await response.json();

    if (!data.query || !data.query.pages) return null;

    const pages = Object.values(data.query.pages) as any[];
    pages.sort((a, b) => (a.index || 0) - (b.index || 0));

    // 严格筛选：只返回标题中明确包含关键词的图片
    for (const page of pages) {
      if (page.title) {
        const title = page.title.toLowerCase();
        const queryLower = query.toLowerCase();
        
        // 检查标题是否包含关键词（中文或英文）
        if (title.includes(queryLower) || title.includes(query)) {
          if (page.imageinfo && page.imageinfo[0] && page.imageinfo[0].thumburl) {
            return page.imageinfo[0].thumburl;
          }
          const fileName = page.title.replace(/ /g, "_");
          return `https://commons.wikimedia.org/wiki/Special:FilePath/${fileName}?width=400`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Wikimedia Commons strict search error:", error);
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

// 方法4：通过精确的中文 Wikipedia 页面映射获取图片
async function getWikipediaPageImage(pageTitle: string): Promise<string | null> {
  try {
    // 优先尝试 pageimages（页面首图）
    const imageUrl = `https://zh.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&format=json&piprop=thumbnail&pithumbsize=400&origin=*`;
    const imageResponse = await fetchWithTimeout(imageUrl);
    const imageData = await imageResponse.json();

    if (imageData.query && imageData.query.pages) {
      const pages = Object.values(imageData.query.pages) as any[];
      for (const page of pages) {
        if (page.thumbnail && page.thumbnail.source) {
          return page.thumbnail.source;
        }
      }
    }

    // Fallback: 获取页面内的第一张图片
    const pageImagesUrl = `https://zh.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=images&format=json&imlimit=10&origin=*`;
    const pageImagesResponse = await fetchWithTimeout(pageImagesUrl);
    const pageImagesData = await pageImagesResponse.json();

    if (pageImagesData.query && pageImagesData.query.pages) {
      const pages = Object.values(pageImagesData.query.pages) as any[];
      for (const page of pages) {
        if (page.images && page.images.length > 0) {
          // 过滤掉常见的图标/徽章图片
          const validImage = page.images.find((img: any) => {
            const title = img.title.toLowerCase();
            return !title.includes("icon") &&
                   !title.includes("logo") &&
                   !title.includes("symbol") &&
                   !title.includes("commons-logo") &&
                   !title.includes("wiki") &&
                   !title.includes("disambig") &&
                   !title.includes("edit") &&
                   !title.includes("question") &&
                   !title.includes("information");
          });

          if (validImage) {
            // 获取图片的实际 URL
            const fileName = validImage.title.replace("File:", "").replace(" ", "_");
            const thumbUrl = `https://zh.wikipedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(fileName)}&prop=imageinfo&format=json&iiprop=url&iiurlwidth=400&origin=*`;
            const thumbResponse = await fetchWithTimeout(thumbUrl);
            const thumbData = await thumbResponse.json();

            if (thumbData.query && thumbData.query.pages) {
              const filePages = Object.values(thumbData.query.pages) as any[];
              for (const filePage of filePages) {
                if (filePage.imageinfo && filePage.imageinfo[0] && filePage.imageinfo[0].thumburl) {
                  return filePage.imageinfo[0].thumburl;
                }
              }
            }
          }
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Chinese Wikipedia page image error:", error);
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
          // 精确映射存在但没有配图，直接返回空 URL，避免返回不相关的图片
          return new Response(JSON.stringify({ url: "", message: "No image found for exact page" }), {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=1800",
            },
          });
        }

        // 如果没有精确映射，尝试提取关键词搜索
        const keyword = extractKeyword(query);
        
        // 对于中国传统文化主题，优先使用中文 Wikipedia，避免返回不相关的图片
        const imageSources = [
          () => searchChineseWikipediaImage(keyword),  // 优先用关键词在中文 Wikipedia 搜索
          () => searchChineseWikipediaImage(query),     // 再用完整标题搜索
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
