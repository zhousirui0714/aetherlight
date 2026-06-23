export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query) {
    return new Response(JSON.stringify({ error: 'Missing query' }), { status: 400 });
  }

  try {
    // 使用 Wikimedia Commons API 搜索图片
    const encodedQuery = encodeURIComponent(query);
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodedQuery}&gsrnamespace=6&gsrlimit=5&format=json`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.query || !data.query.pages) {
      // 如果没有找到结果，使用默认图片
      return new Response(JSON.stringify({ 
        url: `https://picsum.photos/seed/${encodedQuery}/400/300` 
      }));
    }
    
    // 获取第一个图片的 URL
    const pages = Object.values(data.query.pages) as any[];
    const firstPage = pages[0];
    
    if (firstPage && firstPage.title) {
      // 构建图片 URL
      const title = firstPage.title.replace(/ /g, '_');
      const imageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${title}`;
      return new Response(JSON.stringify({ url: imageUrl }));
    }
    
    // 回退到默认图片
    return new Response(JSON.stringify({ 
      url: `https://picsum.photos/seed/${encodedQuery}/400/300` 
    }));
    
  } catch (error) {
    console.error('Image search error:', error);
    return new Response(JSON.stringify({ 
      url: `https://picsum.photos/seed/${encodeURIComponent(query)}/400/300` 
    }));
  }
}