import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { Heart, ArrowLeft, Calendar, BookOpen, Loader2, Share2 } from "lucide-react";
import { ARTICLES } from "@/lib/knowledge-data";
import { addFavorite, removeFavorite, checkIsFavorited } from "@/lib/favorites-storage";
import { trackEvent } from "@/lib/journey-storage";
import { AnnotationPanel } from "@/components/annotation-panel";
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

function ArticlePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

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
          setArticle(data);
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
          <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
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

          <div className="prose prose-lg max-w-none font-serif leading-loose text-foreground/85">
            {article.body ? (
              <div className="whitespace-pre-wrap">{article.body}</div>
            ) : (
              <div className="space-y-6">
                <p>
                  <span className="float-left mr-3 mt-1 font-serif text-6xl leading-none text-accent">
                    {article.excerpt?.charAt(0) || "溯"}
                  </span>
                  {article.excerpt}
                </p>
                <p>
                  中华文化源远流长，博大精深。在五千年的历史长河中，先人为我们留下了无数珍贵的文化遗产。从诗词歌赋到琴棋书画，从节气节日到民俗传统，每一项都是中华民族智慧的结晶。
                </p>
                <p>
                  {article.category}作为中华文化的重要组成部分，承载着先人的思想与情感，记录着历史的变迁与发展。通过了解这些文化知识，我们可以更好地理解中华文明的精神内核，感受传统文化的独特魅力。
                </p>
                <h2 className="font-serif text-2xl text-foreground">文化意义</h2>
                <p>
                  每一种文化形式都有其独特的存在价值和历史意义。它们不仅是过去的见证，更是连接过去与未来的桥梁。在当今快速发展的时代，传承和弘扬中华优秀传统文化，具有重要的现实意义。
                </p>
                <h2 className="font-serif text-2xl text-foreground">传承与发展</h2>
                <p>
                  传统文化的传承需要代代相传，也需要与时俱进。在保留核心精神的同时，结合现代元素进行创新发展，才能让传统文化焕发新的生机与活力。
                </p>
              </div>
            )}
          </div>

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
                <Share2 className="h-4 w-4" /> 分享
              </button>
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
