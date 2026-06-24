interface CacheEntry {
  url: string;
  timestamp: number;
}

const imageCache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24小时缓存

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query) {
    return new Response(JSON.stringify({ error: 'Missing query' }), { status: 400 });
  }

  const cacheKey = query.toLowerCase().trim();
  const cached = imageCache.get(cacheKey);
  
  // 检查缓存是否有效
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return new Response(JSON.stringify({ 
      url: cached.url,
      fromCache: true 
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400"
      }
    });
  }

  try {
    // 使用 Wikimedia Commons API 搜索图片
    const encodedQuery = encodeURIComponent(query);
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodedQuery}&gsrnamespace=6&gsrlimit=5&format=json`;
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json();
    
    if (!data.query || !data.query.pages) {
      // 没有找到图片，返回空 URL，前端会显示占位图
      return new Response(JSON.stringify({ 
        url: "",
        message: "No image found"
      }), {
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=3600"
        }
      });
    }
    
    // 获取第一个图片的 URL
    const pages = Object.values(data.query.pages) as any[];
    const firstPage = pages[0];
    
    if (firstPage && firstPage.title) {
      // 构建图片 URL
      const title = firstPage.title.replace(/ /g, '_');
      const imageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${title}`;
      
      // 存入缓存
      imageCache.set(cacheKey, { url: imageUrl, timestamp: Date.now() });
      
      return new Response(JSON.stringify({ url: imageUrl }), {
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=86400"
        }
      });
    }
    
    // 没有找到图片，返回空 URL
    return new Response(JSON.stringify({ 
      url: "",
      message: "No image found"
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600"
      }
    });
    
  } catch (error) {
    console.error('Image search error:', error);
    
    return new Response(JSON.stringify({ 
      url: "",
      message: "Image search failed"
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=1800"
      }
    });
  }
}