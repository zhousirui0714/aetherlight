import { useState, useEffect, useMemo } from "react";
import { Search, X, BookOpen, User, Lightbulb, Sparkles, MessageSquare, Palette } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { persons, type Person } from "@/lib/cultural-knowledge";
import { supabase } from "@/integrations/supabase/client";
import { listCreations, type CreationItem } from "@/lib/creation-storage";
import { ARTICLES } from "@/lib/knowledge-data";

export interface SearchResult {
  id: string;
  type: "knowledge" | "person" | "book" | "poetry" | "article" | "post" | "creation";
  title: string;
  subtitle?: string;
  description?: string;
  url?: string;
}

interface SearchCache {
  timestamp: number;
  results: SearchResult[];
}

const cache = new Map<string, SearchCache>();
const CACHE_TTL = 60000;

export async function searchAll(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  
  const lowerQuery = query.toLowerCase();
  
  // 检查缓存
  const cached = cache.get(lowerQuery);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.results;
  }

  const results: SearchResult[] = [];

  // 搜索人物
  Object.entries(persons).forEach(([key, person]) => {
    if (
      person.name.includes(query) ||
      person.description.toLowerCase().includes(lowerQuery) ||
      person.works?.some((w: string) => w.includes(query)) ||
      key.toLowerCase().includes(lowerQuery)
    ) {
      results.push({
        id: key,
        type: "person",
        title: person.name,
        subtitle: person.dynasty,
        description: person.description.slice(0, 100) + "...",
      });
    }
  });

  // 搜索知识文章
  ARTICLES.forEach((article) => {
    if (
      article.title.toLowerCase().includes(lowerQuery) ||
      article.excerpt.toLowerCase().includes(lowerQuery) ||
      article.category.toLowerCase().includes(lowerQuery)
    ) {
      results.push({
        id: article.id,
        type: "article",
        title: article.title,
        subtitle: article.category,
        description: article.excerpt.slice(0, 100) + "...",
      });
    }
  });

  // 搜索概念/知识
  const concepts = [
    { id: "fengyasa", title: "风雅颂", description: "《诗经》的三种体制分类" },
    { id: "liuyi", title: "六义", description: "《诗经》的六种表现手法" },
    { id: "kunqu", title: "昆曲", description: "百戏之祖，中国最古老的戏曲剧种" },
    { id: "chinese-culture", title: "中华传统文化", description: "诗词歌赋、琴棋书画、传统节日等" },
  ];
  
  concepts.forEach((c) => {
    if (c.title.includes(query) || c.description.includes(query)) {
      results.push({
        id: c.id,
        type: "knowledge",
        title: c.title,
        description: c.description,
      });
    }
  });

  // 搜索社区帖子（异步）
  try {
    const { data: posts } = await supabase
      .from("community_posts")
      .select("id, title, content, category")
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .limit(5);
    
    if (posts) {
      posts.forEach((post: any) => {
        results.push({
          id: post.id,
          type: "post",
          title: post.title,
          subtitle: post.category,
          description: (post.content || "").slice(0, 100) + "...",
        });
      });
    }
  } catch {
    // ignore
  }

  // 搜索创作作品（本地）
  const creations = await listCreations();
  creations.forEach((item: CreationItem) => {
    if (
      item.prompt.toLowerCase().includes(lowerQuery) ||
      item.style.toLowerCase().includes(lowerQuery)
    ) {
      results.push({
        id: item.id,
        type: "creation",
        title: item.prompt.slice(0, 30) + (item.prompt.length > 30 ? "..." : ""),
        subtitle: item.type === "image" ? "画作" : "乐曲",
        description: item.style,
      });
    }
  });

  // 排序：相关度优先（标题匹配优先）
  results.sort((a, b) => {
    const aTitleMatch = a.title.toLowerCase().includes(lowerQuery) ? 1 : 0;
    const bTitleMatch = b.title.toLowerCase().includes(lowerQuery) ? 1 : 0;
    return bTitleMatch - aTitleMatch;
  });

  // 缓存结果
  cache.set(lowerQuery, { timestamp: Date.now(), results: results.slice(0, 15) });

  return results.slice(0, 15);
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    let cancelled = false;
    
    searchAll(query).then((found) => {
      if (!cancelled) {
        setResults(found);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    onClose();
    switch (result.type) {
      case "person":
        if (result.title === "李白") {
          navigate({ to: "/chat", search: { sage: "libai" } });
        } else if (result.title === "杜甫") {
          navigate({ to: "/chat", search: { sage: "dufu" } });
        } else if (result.title === "苏轼") {
          navigate({ to: "/chat", search: { sage: "sushi" } });
        } else {
          navigate({ to: "/dialogue" });
        }
        break;
      case "article":
        navigate({ to: "/article/$id", params: { id: result.id } });
        break;
      case "post":
        navigate({ to: "/community/$id", params: { id: result.id } });
        break;
      case "creation":
        navigate({ to: "/create" });
        break;
      default:
        navigate({ to: "/chat", search: { q: result.title } });
    }
  };

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "person": return <User className="h-4 w-4" />;
      case "article": return <BookOpen className="h-4 w-4" />;
      case "post": return <MessageSquare className="h-4 w-4" />;
      case "creation": return <Palette className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getIconStyle = (type: SearchResult["type"]) => {
    switch (type) {
      case "person": return "bg-primary/10 text-primary";
      case "article": return "bg-accent/10 text-accent";
      case "post": return "bg-blue-100 text-blue-600";
      case "creation": return "bg-purple-100 text-purple-600";
      default: return "bg-orange-100 text-orange-600";
    }
  };

  const getTypeName = (type: SearchResult["type"]) => {
    switch (type) {
      case "person": return "人物";
      case "article": return "文章";
      case "post": return "帖子";
      case "creation": return "创作";
      case "poetry": return "诗词";
      default: return "知识";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl mx-4 rounded-3xl border border-border bg-background shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索诗词、人物、文章、帖子、创作..."
            className="flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="rounded-full p-1 hover:bg-secondary"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {query && (
          <div className="max-h-[50vh] overflow-y-auto">
            {loading ? (
              <div className="py-12 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-3 animate-pulse" />
                <p>搜索中...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p>未找到相关结果</p>
                <p className="text-sm mt-1">尝试搜索其他关键词</p>
              </div>
            ) : (
              <ul className="py-2">
                {results.map((result) => (
                  <li key={result.id}>
                    <button
                      onClick={() => handleSelect(result)}
                      className="flex w-full items-start gap-4 px-5 py-3 hover:bg-secondary/50 transition"
                    >
                      <div className={`mt-0.5 shrink-0 rounded-lg p-2 ${getIconStyle(result.type)}`}>
                        {getIcon(result.type)}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <p className="font-serif text-base text-foreground">{result.title}</p>
                          <span className="rounded-full bg-secondary/50 px-2 py-0.5 text-[10px] text-muted-foreground">
                            {getTypeName(result.type)}
                          </span>
                        </div>
                        {result.subtitle && (
                          <p className="text-xs text-muted-foreground mt-0.5">{result.subtitle}</p>
                        )}
                        {result.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{result.description}</p>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {!query && (
          <div className="py-8 text-center text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">输入关键词搜索诗词、人物、文章、帖子、创作</p>
          </div>
        )}

        <div className="border-t border-border px-5 py-3 bg-muted/20">
          <p className="text-xs text-muted-foreground mb-2">快捷搜索</p>
          <div className="flex flex-wrap gap-2">
            {["李白", "杜甫", "苏轼", "诗经", "论语", "节气", "非遗"].map((keyword) => (
              <button
                key={keyword}
                onClick={() => setQuery(keyword)}
                className="rounded-full border border-border bg-background px-3 py-1 text-xs font-serif text-muted-foreground hover:text-foreground hover:border-primary/30 transition"
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
