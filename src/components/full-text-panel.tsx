import { useState, useEffect } from "react";
import { Loader2, BookOpen, Languages, BookText, Sparkles } from "lucide-react";
import { knowledgeApi } from "@/lib/knowledge-api";
import { aiFillArticle } from "@/lib/knowledge-api";
import { toast } from "sonner";

interface VerseLine {
  original: string;
  modern: string;
}

interface AnnotationItem {
  term: string;
  meaning: string;
  source: string;
}

interface FullTextPanelProps {
  articleId: string;
  fullText?: string | null;
  title: string;
  category: string;
  body: string;
}

/**
 * 全文 / 翻译 / 注释面板
 * - 诗词/典籍 (poems/classics) 优先显示
 * - 翻译/注释通过 AI 懒加载补全
 */
export function FullTextPanel({ articleId, fullText, title, category, body }: FullTextPanelProps) {
  const [tab, setTab] = useState<"text" | "translation" | "annotation">("text");
  const [verseByVerse, setVerseByVerse] = useState<VerseLine[] | null>(null);
  const [overall, setOverall] = useState<string>("");
  const [annotations, setAnnotations] = useState<AnnotationItem[] | null>(null);
  const [loading, setLoading] = useState<"translation" | "annotation" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 切到翻译/注释 tab 时, 懒加载
  useEffect(() => {
    if (tab === "translation" && !verseByVerse && !loading) {
      loadTranslation();
    }
    if (tab === "annotation" && !annotations && !loading) {
      loadAnnotation();
    }
  }, [tab]);

  const loadTranslation = async () => {
    setLoading("translation");
    setError(null);
    try {
      const res = await aiFillArticle(articleId, ["translation"], {
        title,
        category,
        excerpt: "",
        body,
      });
      const filled = res.filled.translation;
      if (typeof filled === "string") {
        // 整体文本 (无结构)
        setOverall(filled);
      } else if (filled && typeof filled === "object") {
        setVerseByVerse(filled.verseByVerse || []);
        setOverall(filled.overall || "");
      }
    } catch (err: any) {
      console.error("[translation] failed:", err);
      setError("翻译生成失败，请稍后重试");
      toast("翻译生成失败");
    } finally {
      setLoading(null);
    }
  };

  const loadAnnotation = async () => {
    setLoading("annotation");
    setError(null);
    try {
      const res = await aiFillArticle(articleId, ["annotation"], {
        title,
        category,
        excerpt: "",
        body,
      });
      const filled = res.filled.annotation;
      if (Array.isArray(filled)) {
        setAnnotations(filled);
      } else if (typeof filled === "string") {
        // 整体文本 -> 解析
        const lines = filled.split("\n").filter((l) => l.trim());
        const items: AnnotationItem[] = lines
          .map((line) => {
            const m = line.match(/^(.+?)[:：](.+?)[【《](.+?)[】》]\s*$/);
            if (m) return { term: m[1].trim(), meaning: m[2].trim(), source: m[3].trim() };
            return { term: line, meaning: "", source: "" };
          });
        setAnnotations(items);
      }
    } catch (err: any) {
      console.error("[annotation] failed:", err);
      setError("注释生成失败，请稍后重试");
      toast("注释生成失败");
    } finally {
      setLoading(null);
    }
  };

  // 把 fullText 按行/句拆
  const fullTextLines = fullText?.split(/\n+/).filter((l) => l.trim()) || [];

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <BookText className="h-5 w-5 text-primary" />
        <h3 className="font-serif text-lg font-semibold text-foreground">全文 · 译注</h3>
        <span className="ml-auto flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] text-accent">
          <Sparkles className="h-3 w-3" /> AI 译注
        </span>
      </div>

      {/* tabs */}
      <div className="mb-4 flex gap-1 border-b border-border">
        <button
          onClick={() => setTab("text")}
          className={`relative px-4 py-2 text-sm font-medium transition ${
            tab === "text" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="mr-1.5 inline h-3.5 w-3.5" />
          原文
          {tab === "text" && (
            <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
          )}
        </button>
        <button
          onClick={() => setTab("translation")}
          className={`relative px-4 py-2 text-sm font-medium transition ${
            tab === "translation" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Languages className="mr-1.5 inline h-3.5 w-3.5" />
          翻译
          {tab === "translation" && (
            <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
          )}
        </button>
        <button
          onClick={() => setTab("annotation")}
          className={`relative px-4 py-2 text-sm font-medium transition ${
            tab === "annotation" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookText className="mr-1.5 inline h-3.5 w-3.5" />
          注释
          {tab === "annotation" && (
            <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
          )}
        </button>
      </div>

      {/* content */}
      <div className="min-h-[120px]">
        {tab === "text" && (
          <div className="space-y-3">
            {fullTextLines.length > 0 ? (
              fullTextLines.map((line, idx) => (
                <p
                  key={idx}
                  className="font-serif text-base leading-loose text-foreground/90 tracking-wide"
                >
                  {line}
                </p>
              ))
            ) : (
              <p className="text-sm text-muted-foreground italic">
                该条目暂无全文内容。可在原文摘要中查阅核心信息。
              </p>
            )}
          </div>
        )}

        {tab === "translation" && (
          <div className="space-y-3">
            {loading === "translation" ? (
              <div className="flex flex-col items-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p className="mt-2 text-xs text-muted-foreground">AI 翻译生成中…</p>
              </div>
            ) : error ? (
              <p className="text-sm text-red-500">{error}</p>
            ) : verseByVerse && verseByVerse.length > 0 ? (
              <>
                <div className="space-y-3">
                  {verseByVerse.map((v, idx) => (
                    <div key={idx} className="rounded-lg bg-secondary/30 p-3">
                      <p className="font-serif text-sm font-medium text-foreground/90">
                        {v.original}
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed text-foreground/70">
                        {v.modern}
                      </p>
                    </div>
                  ))}
                </div>
                {overall && (
                  <div className="mt-4 rounded-lg border-l-4 border-accent/30 bg-accent/5 p-3">
                    <p className="text-xs font-medium text-accent">整体意境</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground/85">
                      {overall}
                    </p>
                  </div>
                )}
              </>
            ) : overall ? (
              <p className="text-sm leading-loose text-foreground/85">{overall}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                暂无翻译。可点击上方「翻译」tab 由 AI 生成。
              </p>
            )}
          </div>
        )}

        {tab === "annotation" && (
          <div className="space-y-3">
            {loading === "annotation" ? (
              <div className="flex flex-col items-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p className="mt-2 text-xs text-muted-foreground">AI 注释生成中…</p>
              </div>
            ) : error ? (
              <p className="text-sm text-red-500">{error}</p>
            ) : annotations && annotations.length > 0 ? (
              <div className="space-y-2">
                {annotations.map((a, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-border bg-secondary/30 p-3"
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="font-serif text-base font-semibold text-primary">
                        {a.term}
                      </span>
                      {a.source && (
                        <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] text-accent">
                          《{a.source}》
                        </span>
                      )}
                    </div>
                    {a.meaning && (
                      <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">
                        {a.meaning}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                暂无注释。可点击上方「注释」tab 由 AI 生成。
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
