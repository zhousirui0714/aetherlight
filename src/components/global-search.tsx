import { useState, useEffect, useMemo } from "react";
import { Search, X, BookOpen, User, Lightbulb, Sparkles } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { persons, type Person } from "@/lib/cultural-knowledge";

export interface SearchResult {
  id: string;
  type: "knowledge" | "person" | "book" | "poetry";
  title: string;
  subtitle?: string;
  description?: string;
}

// 搜索知识库内容
export function searchKnowledge(query: string): SearchResult[] {
  if (!query.trim()) return [];
  
  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase();

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

  // 搜索经典诗词（从 deep-knowledge）
  const poetKeywords = ["将进酒", "静夜思", "杜甫", "李白", "苏轼", "诗经", "论语", "道德经"];
  poetKeywords.forEach((keyword) => {
    if (keyword.includes(query) && !results.some((r) => r.title.includes(keyword))) {
      results.push({
        id: keyword,
        type: "poetry",
        title: keyword,
        description: "经典诗词",
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

  return results.slice(0, 10);
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const found = searchKnowledge(query);
    setResults(found);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    onClose();
    // 根据类型导航到对应页面
    if (result.type === "person") {
      if (result.title === "李白") {
        navigate({ to: "/chat", search: { sage: "libai" } });
      } else if (result.title === "杜甫") {
        navigate({ to: "/chat", search: { sage: "dufu" } });
      } else if (result.title === "苏轼") {
        navigate({ to: "/chat", search: { sage: "sushi" } });
      } else {
        navigate({ to: "/chat", search: { q: result.title } });
      }
    } else {
      navigate({ to: "/chat", search: { q: result.title } });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* 搜索框 */}
      <div className="relative w-full max-w-2xl mx-4 rounded-3xl border border-border bg-background shadow-2xl overflow-hidden">
        {/* 搜索输入 */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索诗词、人物、典籍..."
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

        {/* 搜索结果 */}
        {query && (
          <div className="max-h-[50vh] overflow-y-auto">
            {results.length === 0 ? (
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
                      <div className={`mt-0.5 shrink-0 rounded-lg p-2 ${
                        result.type === "person" ? "bg-primary/10 text-primary" :
                        result.type === "book" ? "bg-accent/10 text-accent" :
                        result.type === "poetry" ? "bg-secondary/20 text-secondary-foreground" :
                        "bg-orange-100 text-orange-600"
                      }`}>
                        {result.type === "person" ? <User className="h-4 w-4" /> :
                         result.type === "book" ? <BookOpen className="h-4 w-4" /> :
                         <Lightbulb className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-serif text-base text-foreground">{result.title}</p>
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

        {/* 空状态提示 */}
        {!query && (
          <div className="py-8 text-center text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">输入关键词搜索诗词、人物、典籍</p>
          </div>
        )}

        {/* 底部快捷搜索 */}
        <div className="border-t border-border px-5 py-3 bg-muted/20">
          <p className="text-xs text-muted-foreground mb-2">快捷搜索</p>
          <div className="flex flex-wrap gap-2">
            {["李白", "杜甫", "苏轼", "诗经", "论语"].map((keyword) => (
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
