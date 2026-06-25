import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, X, BookOpen, User, Lightbulb, Sparkles, MessageSquare, Palette, Clock, Trash2, History, CornerDownLeft } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { persons, type Person } from "@/lib/cultural-knowledge";
import { supabase } from "@/integrations/supabase/client";
import { listCreations, type CreationItem } from "@/lib/creation-storage";
import { ARTICLES } from "@/lib/knowledge-data";
import { semanticSearch } from "@/lib/semantic-search";
import {
  getSearchHistory,
  addSearchHistory,
  removeSearchHistory,
  clearSearchHistory,
  type SearchHistoryItem,
} from "@/lib/search-history";
import { getSuggestions } from "@/lib/search-suggest";

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

  // ========== 1. 人物语义搜索 ==========
  const personEntries = Object.entries(persons);
  const personCandidates = personEntries.map(([key, person]) => {
    const text = `${person.name} ${person.dynasty} ${person.description} ${(person.works || []).join(" ")} ${key}`;
    return { key, person, text };
  });
  const personHits = await semanticSearch(query, personCandidates, ["text"], { useAI: true, topK: 6, threshold: 0.18 });
  personHits.forEach(({ item, score }) => {
    results.push({
      id: item.key,
      type: "person",
      title: item.person.name,
      subtitle: `${item.person.dynasty} · 匹配度 ${(score * 100).toFixed(0)}%`,
      description: item.person.description.slice(0, 100) + "...",
    });
  });

  // ========== 2. 知识文章语义搜索（走 TF-IDF 全量索引 /api/articles/search） ==========
  try {
    const searchRes = await fetch(`/api/articles/search?q=${encodeURIComponent(query)}&topK=10`);
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      (searchData.results || []).forEach((item: any) => {
        results.push({
          id: item.id,
          type: "article",
          title: item.title,
          subtitle: `${item.category} · 匹配度 ${(item.score * 100).toFixed(0)}%`,
          description: (item.excerpt || "").slice(0, 100) + "...",
        });
      });
    }
  } catch (err) {
    console.warn("[search] knowledge articles API failed, fallback to static:", err);
    // 兜底：走静态 ARTICLES
    const articleHits = await semanticSearch(
      query,
      ARTICLES,
      ["title", "excerpt", "category"],
      { useAI: true, topK: 10, threshold: 0.18 }
    );
    articleHits.forEach(({ item, score }) => {
      results.push({
        id: item.id,
        type: "article",
        title: item.title,
        subtitle: `${item.category} · 匹配度 ${(score * 100).toFixed(0)}%`,
        description: item.excerpt.slice(0, 100) + "...",
      });
    });
  }

  // ========== 3. 概念/知识 ==========
  const concepts = [
    { id: "fengyasa", title: "风雅颂", description: "《诗经》的三种体制分类" },
    { id: "liuyi", title: "六义", description: "《诗经》的六种表现手法" },
    { id: "kunqu", title: "昆曲", description: "百戏之祖，中国最古老的戏曲剧种" },
    { id: "chinese-culture", title: "中华传统文化", description: "诗词歌赋、琴棋书画、传统节日等" },
  ];

  const conceptHits = await semanticSearch(query, concepts, ["title", "description"], { useAI: true, topK: 4, threshold: 0.2 });
  conceptHits.forEach(({ item, score }) => {
    results.push({
      id: item.id,
      type: "knowledge",
      title: item.title,
      subtitle: `匹配度 ${(score * 100).toFixed(0)}%`,
      description: item.description,
    });
  });

  // ========== 4. 社区帖子（DB，仍用 ILIKE） ==========
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
  cache.set(lowerQuery, { timestamp: Date.now(), results: results.slice(0, 25) });

  return results.slice(0, 25);
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0); // 键盘上下高亮
  const navigate = useNavigate();

  // 打开时刷新搜索历史
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setHistory(getSearchHistory());
      setActiveIndex(0);
    }
  }, [isOpen]);

  // 监听跨 tab 同步
  useEffect(() => {
    if (!isOpen) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === "suguang:search:history") setHistory(getSearchHistory());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [isOpen]);

  // query 变化时更新联想词（毫秒级，不调 API）
  useEffect(() => {
    if (query.trim()) {
      setSuggestions(getSuggestions(query));
      setActiveIndex(0);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  // 实际搜索
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
    addSearchHistory(query);
    setHistory(getSearchHistory());
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
        navigate({ to: "/tongyou/community/$id", params: { id: result.id } });
        break;
      case "creation":
        navigate({ to: "/create" });
        break;
      default:
        navigate({ to: "/chat", search: { q: result.title } });
    }
  };

  // 点联想词 → 写入历史 + 触发搜索
  const handleSelectSuggestion = (s: string) => {
    addSearchHistory(s);
    setHistory(getSearchHistory());
    setQuery(s);
  };

  // 点历史 → 写入历史（移到最前）+ 触发搜索
  const handleSelectHistory = (h: string) => {
    addSearchHistory(h);
    setHistory(getSearchHistory());
    setQuery(h);
  };

  // 删除单条历史
  const handleRemoveHistory = (e: React.MouseEvent, q: string) => {
    e.stopPropagation();
    removeSearchHistory(q);
    setHistory(getSearchHistory());
  };

  // 清空历史
  const handleClearHistory = () => {
    if (!confirm("清空所有搜索历史？")) return;
    clearSearchHistory();
    setHistory([]);
  };

  // 键盘导航（上下 + 回车）
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0 && activeIndex < results.length) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === "Escape") {
      onClose();
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
            onKeyDown={handleKeyDown}
            placeholder="搜索诗词、人物、文章、帖子、创作..."
            className="flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="rounded-full p-1 hover:bg-secondary"
              aria-label="清空"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          <kbd className="hidden sm:inline-block rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div className="max-h-[55vh] overflow-y-auto">
          {/* ============ query 为空：搜索历史 + 热门词 ============ */}
          {!query.trim() && (
            <div className="px-5 py-4">
              {/* 搜索历史 */}
              {history.length > 0 && (
                <div className="mb-5">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="flex items-center gap-1.5 text-[11px] font-serif tracking-[0.2em] text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" strokeWidth={1.6} />
                      最近搜索
                    </h3>
                    <button
                      onClick={handleClearHistory}
                      className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      <Trash2 className="h-3 w-3" />
                      清空
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {history.map((h) => (
                      <div
                        key={h.query}
                        className="group flex items-center gap-0.5 rounded-full border border-border bg-card transition hover:border-primary/30"
                      >
                        <button
                          onClick={() => handleSelectHistory(h.query)}
                          className="px-3 py-1 text-sm font-serif text-foreground/85 hover:text-foreground"
                        >
                          {h.query}
                        </button>
                        <button
                          onClick={(e) => handleRemoveHistory(e, h.query)}
                          className="mr-1 rounded-full p-0.5 text-muted-foreground opacity-0 transition hover:bg-secondary hover:text-foreground group-hover:opacity-100"
                          aria-label="删除"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 热门词 */}
              <div>
                <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-serif tracking-[0.2em] text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" strokeWidth={1.6} />
                  热门词
                </h3>
                <div className="flex flex-wrap gap-2">
                  {["李白", "杜甫", "苏轼", "诗经", "论语", "节气", "非遗", "山水", "思乡", "神话"].map((k) => (
                    <button
                      key={k}
                      onClick={() => handleSelectHistory(k)}
                      className="rounded-full border border-border bg-card px-3 py-1 text-sm font-serif text-foreground/80 transition hover:border-primary/30 hover:text-foreground"
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              {/* 空状态引导 */}
              {history.length === 0 && (
                <div className="mt-8 text-center text-sm text-muted-foreground">
                  <Search className="mx-auto mb-2 h-7 w-7 opacity-30" />
                  <p>输入关键词开始搜索</p>
                  <p className="mt-1 text-xs">支持诗词、人物、典籍、节气、节日、人物、概念…</p>
                </div>
              )}
            </div>
          )}

          {/* ============ query 有内容：联想词 + 真实结果 ============ */}
          {query.trim() && (
            <>
              {/* 联想词（不调 API，毫秒级） */}
              {suggestions.length > 0 && (
                <div className="border-b border-border bg-muted/20 px-5 py-3">
                  <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-serif tracking-[0.2em] text-muted-foreground">
                    <CornerDownLeft className="h-3 w-3" strokeWidth={1.6} />
                    联想词
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSelectSuggestion(s)}
                        className="rounded-full bg-card px-2.5 py-1 text-xs font-serif text-foreground/80 transition hover:bg-primary/10 hover:text-primary"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 真实搜索结果 */}
              {loading ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Search className="mx-auto mb-3 h-8 w-8 animate-pulse" />
                  <p>搜索中...</p>
                </div>
              ) : results.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Sparkles className="mx-auto mb-3 h-8 w-8 opacity-50" />
                  <p>未找到相关结果</p>
                  <p className="mt-1 text-sm">试试上方联想词，或换个关键词</p>
                </div>
              ) : (
                <ul className="py-2">
                  {results.map((result, i) => (
                    <li key={result.id}>
                      <button
                        onClick={() => handleSelect(result)}
                        onMouseEnter={() => setActiveIndex(i)}
                        className={`flex w-full items-start gap-4 px-5 py-3 transition ${
                          activeIndex === i
                            ? "bg-secondary/80"
                            : "hover:bg-secondary/50"
                        }`}
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
                            <p className="mt-0.5 text-xs text-muted-foreground">{result.subtitle}</p>
                          )}
                          {result.description && (
                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{result.description}</p>
                          )}
                        </div>
                        {activeIndex === i && (
                          <CornerDownLeft className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        <div className="border-t border-border bg-muted/20 px-5 py-2.5 text-[10px] text-muted-foreground/80">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border bg-background px-1">↑</kbd>
                <kbd className="rounded border border-border bg-background px-1">↓</kbd>
                选择
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border bg-background px-1">↵</kbd>
                进入
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border bg-background px-1">ESC</kbd>
                关闭
              </span>
            </span>
            <span>语义搜索 · 联想词</span>
          </div>
        </div>
      </div>
    </div>
  );
}
