import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { Heart, ArrowLeft, Calendar, Loader2, Share2, BookOpen, Sparkles, Network } from "lucide-react";
import { ARTICLES } from "@/lib/knowledge-data";
import type { Article } from "@/lib/knowledge-data";
import { getExpandedContent } from "@/lib/expanded-content";
import { addFavorite, removeFavorite, checkIsFavorited } from "@/lib/favorites-storage";
import { trackEvent } from "@/lib/journey-storage";
import { AnnotationPanel } from "@/components/annotation-panel";
import { AIInsightsPanel } from "@/components/ai-insights-panel";
import { ArticleRelatedGraph } from "@/components/article-related-graph";
import { FullTextPanel } from "@/components/full-text-panel";
import { ShareCardButton } from "@/components/share-card-button";
import { aiFillArticle, type ArticleDetail, getRecommendations, type ArticleRecommendation } from "@/lib/knowledge-api";
import { toast } from "sonner";

export const Route = createFileRoute("/article/$id")({
  head: () => ({
    meta: [
      { title: "知识详情 · 溯光" },
      { name: "description", content: "深入了解中华传统文化知识" },
    ],
  }),
  component: ArticlePage,
});

/**
 * 字段归一化：DB snake_case / API camelCase 都统一为 Article 接口
 */
function normalizeArticle(raw: any): Article {
  if (!raw) return raw;
  return {
    id: raw.id,
    title: raw.title,
    category: raw.category as any,
    excerpt: raw.excerpt || "",
    content: raw.content || raw.body || "",
    favorites: raw.favorites ?? 0,
    cover: raw.cover || "📜",
    source: raw.source,
    history: raw.history,
    relatedPeople: raw.relatedPeople || raw.related_people || [],
    relatedBooks: raw.relatedBooks || raw.related_books || [],
    relatedEvents: raw.relatedEvents || raw.related_events || [],
    relatedPoems: raw.relatedPoems || raw.related_poems || [],
    relatedArticles: raw.relatedArticles || raw.related_articles || [],
    influence: raw.influence,
    tags: raw.tags,
    author: raw.author,
    created_at: raw.created_at,
    dynasty: raw.dynasty,
    era: raw.era,
    region: raw.region,
  } as Article;
}

function ArticlePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [aiFilling, setAiFilling] = useState(false);
  const [recommendations, setRecommendations] = useState<ArticleRecommendation[]>([]);
  const [recLoading, setRecLoading] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      try {
        // 先尝试从 Supabase 获取
        const { data, error } = await supabase
          .from("knowledge_articles")
          .select("*")
          .eq("id", id)
          .single();

        if (data && !error) {
          setArticle(normalizeArticle(data));
        } else {
          // 回退到静态数据
          const staticArticle = ARTICLES.find(a => a.id === id);
          if (staticArticle) {
            setArticle(staticArticle);
          }
        }
      } catch (err) {
        console.error("Failed to fetch article:", err);
        const staticArticle = ARTICLES.find(a => a.id === id);
        if (staticArticle) {
          setArticle(staticArticle);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  // AI 懒加载补全：history/influence/faq 任意一个为空时调用
  useEffect(() => {
    if (!article) return;

    const missing: string[] = [];
    if (!article.history) missing.push("history");
    if (!article.influence) missing.push("influence");
    if (!article.faq || (article.faq as any).length === 0) missing.push("faq");

    if (missing.length === 0) return;

    // 已有的 expanded-content 也可以兜底，不打接口
    const expanded = getExpandedContent(article.id);
    const stillMissing = missing.filter((f) => {
      if (f === "history") return !article.history && !expanded?.history;
      if (f === "influence") return !article.influence && !expanded?.influence;
      if (f === "faq") return (!article.faq || (article.faq as any).length === 0);
      return false;
    });

    if (stillMissing.length === 0) return;

    setAiFilling(true);
    aiFillArticle(article.id, stillMissing, {
      title: article.title,
      category: String(article.category),
      excerpt: article.excerpt,
      body: (article as any).content || (article as any).body,
    })
      .then((res) => {
        if (!res || !res.filled) return;
        setArticle((prev) => {
          if (!prev) return prev;
          const updated: Article = { ...prev } as Article;
          if (res.filled.history) updated.history = res.filled.history;
          if (res.filled.influence) updated.influence = res.filled.influence;
          if (Array.isArray(res.filled.faq) && res.filled.faq.length > 0) {
            (updated as any).faq = res.filled.faq;
          }
          return updated;
        });
      })
      .catch((err) => {
        console.warn("[article-page] ai-fill failed:", err);
      })
      .finally(() => setAiFilling(false));
  }, [article?.id]);

  // 追踪文章阅读
  useEffect(() => {
    if (article) {
      trackEvent({
        type: "article_view",
        title: article.title || "未知文章",
        description: article.excerpt || article.content?.slice(0, 50),
        category: article.category || "知识",
      });
    }
  }, [article]);

  useEffect(() => {
    const checkFavorite = async () => {
      if (article) {
        const favorited = await checkIsFavorited(article.id);
        setIsFavorited(favorited);
      }
    };
    checkFavorite();
  }, [article]);

  // TF-IDF 推荐：基于全量文章算相似度
  useEffect(() => {
    if (!article) return;
    let aborted = false;
    setRecLoading(true);
    setRecommendations([]);
    getRecommendations(article.id, { topK: 6 })
      .then((res) => {
        if (!aborted) setRecommendations(res.recommendations || []);
      })
      .catch((err) => {
        if (!aborted) console.warn("[article-page] rec failed:", err);
      })
      .finally(() => {
        if (!aborted) setRecLoading(false);
      });
    return () => {
      aborted = true;
    };
  }, [article?.id]);

  const handleFavorite = async () => {
    if (!article || favoriteLoading) return;
    setFavoriteLoading(true);
    try {
      if (isFavorited) {
        await removeFavorite(article.id);
        setIsFavorited(false);
        toast("已取消收藏");
      } else {
        await addFavorite({
          item_id: article.id,
          item_type: "knowledge",
          title: article.title,
          snippet: article.excerpt?.slice(0, 100) || "",
        });
        setIsFavorited(true);
        toast("已添加收藏");
        trackEvent({
          type: "favorite_add",
          title: `收藏：${article.title}`,
          description: article.excerpt?.slice(0, 50) || "",
          category: article.category || "知识",
        });
      }
    } catch (error) {
      toast("操作失败，请重试");
    } finally {
      setFavoriteLoading(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 font-serif text-sm text-muted-foreground">加载中…</p>
        </div>
      </AppShell>
    );
  }

  if (!article) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="seal text-2xl mb-4">溯</div>
          <h2 className="font-serif text-xl text-foreground">未找到这篇文章</h2>
          <p className="mt-2 text-sm text-muted-foreground">它可能已经被移动或删除</p>
          <button
            onClick={() => navigate({ to: "/gallery" })}
            className="mt-6 rounded-full bg-primary px-6 py-2 text-sm text-primary-foreground hover:opacity-90"
          >
            返回知识长廊
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* 返回按钮 */}
      <button
        onClick={() => navigate({ to: "/gallery" })}
        className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="h-4 w-4" /> 返回知识长廊
      </button>

      <article className="scroll-in">
        {/* 文章头部 */}
        <div className="mb-10 text-center">
          <span className="inline-block rounded-full border border-accent/30 bg-accent/5 px-4 py-1 font-serif text-xs tracking-widest text-accent">
            {article.category}
          </span>
          <h1 className="mt-5 font-serif text-4xl leading-relaxed text-foreground md:text-5xl">
            {article.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            {(article as any).dynasty && (
              <span className="rounded-full bg-secondary px-2.5 py-0.5">
                {String((article as any).dynasty)}
              </span>
            )}
            {article.created_at && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(article.created_at).toLocaleDateString("zh-CN")}
              </span>
            )}
            {article.favorites !== undefined && (
              <span className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" />
                {article.favorites} 收藏
              </span>
            )}
            {aiFilling && (
              <span className="flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-accent">
                <Sparkles className="h-3 w-3 animate-pulse" />
                AI 补全中
              </span>
            )}
          </div>
        </div>

        {/* 文章封面 */}
        <div className="mb-10 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-secondary via-background to-secondary">
          <div className="relative h-[300px] w-full md:h-[400px]">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background:
                  "radial-gradient(circle at 30% 40%, var(--color-bronze) 0%, transparent 45%), radial-gradient(circle at 75% 70%, var(--color-cinnabar) 0%, transparent 40%)",
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-8xl md:text-9xl">
              {article.cover || "📜"}
            </div>
          </div>
        </div>

        {/* 文章内容 */}
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 rounded-2xl border-l-4 border-accent/30 bg-accent/5 px-6 py-4">
            <p className="font-serif text-lg leading-loose text-foreground/90 italic">
              {article.excerpt}
            </p>
          </div>

          {/* 正文 */}
          <div className="prose prose-lg max-w-none font-serif leading-loose text-foreground/85">
            {(() => {
              const expanded = getExpandedContent(article.id);
              if (article.content) {
                return <div className="whitespace-pre-wrap">{article.content}</div>;
              }
              if (expanded) {
                const paragraphs = expanded.content.split(/\n\n+/);
                return (
                  <div className="space-y-5">
                    {paragraphs.map((para, idx) => {
                      const match = para.match(/^(【[^】]+】)\s*([\s\S]*)$/);
                      if (match) {
                        return (
                          <div key={idx}>
                            <h3 className="mb-2 mt-6 font-serif text-xl font-semibold text-foreground/90 first:mt-0">
                              {match[1].replace(/[【】]/g, "")}
                            </h3>
                            <p className="leading-loose text-foreground/85">
                              {match[2].trim()}
                            </p>
                          </div>
                        );
                      }
                      return <p key={idx} className="leading-loose text-foreground/85">{para.trim()}</p>;
                    })}
                  </div>
                );
              }
              return (
                <p>
                  <span className="float-left mr-3 mt-1 font-serif text-6xl leading-none text-accent">
                    {article.excerpt?.charAt(0) || "溯"}
                  </span>
                  {article.content || article.excerpt}
                </p>
              );
            })()}
          </div>

          {/* AI 深度内容面板 - 包含：出处、历史背景、相关人物/典籍/事件/诗词/推荐、知识图谱、时间线、现代解读、常见问题 */}
          {/* v3 全文/翻译/注释面板 (诗词/典籍专用) */}
          {(article.category === "poems" || article.category === "classics" || article.category === "诗词文章" || article.category === "典籍经典") && (
            <div className="mt-10">
              <FullTextPanel
                articleId={article.id}
                title={article.title}
                category={String(article.category)}
                body={(article as any).content || (article as any).body}
                fullText={(article as any).fullText || (article as any).full_text}
              />
            </div>
          )}

          {/* v3 知识图谱 (跨分类关联) */}
          <div className="mt-10 rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              <h3 className="font-serif text-lg font-semibold text-foreground">知识图谱</h3>
              <span className="ml-auto text-xs text-muted-foreground">跨分类关联</span>
            </div>
            <ArticleRelatedGraph
              articleId={article.id}
              articleTitle={article.title}
            />
          </div>

          <AIInsightsPanel article={article} />

          {/* 猜你喜欢：TF-IDF 余弦相似度推荐 */}
          {(recLoading || recommendations.length > 0) && (
            <section className="mt-10 rounded-2xl border border-accent/20 bg-accent/5 p-6">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                <h2 className="font-serif text-xl text-foreground">猜你喜欢</h2>
                <span className="ml-auto rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-serif text-accent">
                  算法推荐
                </span>
              </div>
              {recLoading ? (
                <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  正在为你找相似的文章…
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {recommendations.map((rec) => (
                    <button
                      key={rec.id}
                      onClick={() => navigate({ to: "/article/$id", params: { id: rec.id } })}
                      className="group flex flex-col items-start gap-1.5 rounded-xl border border-border bg-background/60 p-4 text-left transition hover:border-accent/50 hover:bg-background"
                    >
                      <div className="flex w-full items-center gap-2">
                        <span className="text-xl leading-none">{rec.cover || "📜"}</span>
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                          {rec.category}
                        </span>
                        <span className="ml-auto text-[10px] text-muted-foreground/70">
                          {(rec.score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <h3 className="font-serif text-sm font-semibold text-foreground line-clamp-1 group-hover:text-accent">
                        {rec.title}
                      </h3>
                      {rec.excerpt && (
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {rec.excerpt}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* 底部操作 */}
          <div className="mt-12 flex items-center justify-between border-t border-border pt-8">
            <div className="flex items-center gap-3">
              <button
                onClick={handleFavorite}
                disabled={favoriteLoading}
                className={`flex items-center gap-2 rounded-full border px-5 py-2 text-sm transition ${
                  isFavorited
                    ? "border-red-300 bg-red-50 text-red-500 dark:bg-red-950/20"
                    : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/30"
                }`}
              >
                {favoriteLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Heart className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
                )}
                {isFavorited ? "已收藏" : "收藏"}
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: article.title,
                      text: article.excerpt,
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    toast("链接已复制到剪贴板");
                  }
                }}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition"
              >
                <Share2 className="h-4 w-4" /> 分享链接
              </button>
              <ShareCardButton
                data={{
                  title: article.title,
                  category: String(article.category || "知识"),
                  dynasty: (article as any).dynasty || (article as any).era || undefined,
                  excerpt: article.excerpt || "",
                  author: article.author || undefined,
                  articleUrl: typeof window !== "undefined" ? window.location.href : "",
                  coverEmoji: article.cover,
                }}
              />
            </div>
            <button
              onClick={() => navigate({ to: "/chat", search: { q: article.title } })}
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground hover:opacity-90 transition"
            >
              <BookOpen className="h-4 w-4" /> 深入了解
            </button>
          </div>
        </div>
      </article>

      <AnnotationPanel
        articleId={article.id}
        articleTitle={article.title}
        category={article.category || "知识"}
      />
    </AppShell>
  );
}
