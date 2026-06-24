import { createFileRoute } from "@tanstack/react-router";

interface CacheEntry {
  url: string;
  timestamp: number;
}

const imageCache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24小时缓存

// 中文关键词到英文的映射，提高 Wikimedia 搜索命中率
const keywordMap: Record<string, string> = {
  // 节气
  "夏至": "Xiazhi summer solstice",
  "冬至": "Dongzhi winter solstice",
  "清明": "Qingming Festival",
  "立春": "Lichun spring beginning",
  "立夏": "Lixia summer beginning",
  "立秋": "Liqiu autumn beginning",
  "立冬": "Lidong winter beginning",
  "惊蛰": "Jingzhe awakening insects",
  "春分": "Chunfen spring equinox",
  "秋分": "Qiufen autumn equinox",
  "芒种": "Mangzhong grain in ear",
  "小暑": "Xiaoshu slight heat",
  "大暑": "Dashu great heat",
  "处暑": "Chushu end heat",
  "白露": "Bailu white dew",
  "寒露": "Hanlu cold dew",
  "霜降": "Shuangjiang frost descent",
  "小寒": "Xiaohan slight cold",
  "大寒": "Dahan great cold",
  "雨水": "Yushui rain water",
  "谷雨": "Guyu grain rain",
  "小满": "Xiaoman grain buds",
  "小雪": "Xiaoxue slight snow",
  "大雪": "Daxue great snow",
  // 人物
  "李白": "Li Bai poet Tang dynasty",
  "杜甫": "Du Fu poet Tang dynasty",
  "白居易": "Bai Juyi poet Tang dynasty",
  "苏轼": "Su Shi poet Song dynasty",
  "王维": "Wang Wei poet Tang dynasty",
  "屈原": "Qu Yuan poet Chu",
  "陆游": "Lu You poet Song dynasty",
  "孟浩然": "Meng Haoran poet Tang dynasty",
  "韦应物": "Wei Yingwu poet Tang dynasty",
  "杜牧": "Du Mu poet Tang dynasty",
  "元稹": "Yuan Zhen poet Tang dynasty",
  "黄庭坚": "Huang Tingjian poet Song dynasty",
  "孟郊": "Meng Jiao poet Tang dynasty",
  "刘言史": "Tang dynasty poet",
  "司空曙": "Sikong Shu poet Tang dynasty",
  "吕本中": "Lu Benzhong poet",
  "朱槔": "Zhu Gao poet",
  "徐铉": "Xu Xuan scholar",
  // 非遗
  "昆曲": "Kunqu opera Chinese",
  "端午节": "Dragon Boat Festival zongzi",
  "龙舟竞渡": "dragon boat race",
  "夏至祭祀": "summer solstice sacrifice ceremony",
  "二十四节气": "24 solar terms China",
  "清明节": "Qingming festival tomb sweeping",
  "踏青": "spring outing China",
  "中秋节": "Mid-Autumn Festival moon",
  "春节": "Chinese New Year Spring Festival",
  "腊八节": "Laba Festival",
  "书法": "Chinese calligraphy",
  "国画": "Chinese painting ink",
  "剪纸": "Chinese paper cutting",
  "皮影戏": "shadow puppetry China",
  // 诗词相关
  "古诗": "Chinese classical poetry",
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
