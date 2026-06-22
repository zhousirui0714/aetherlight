import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Heart, Share2, ArrowLeft, Calendar, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ARTICLES, type Article } from "@/lib/knowledge-data";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/article/$id")({
  loader: async ({ params }) => {
    // Try to fetch from Supabase first
    const { data: dbArticle } = await supabase
      .from("knowledge_articles")
      .select("*")
      .eq("id", params.id)
      .single();

    if (dbArticle) {
      return {
        article: {
          id: dbArticle.id,
          title: dbArticle.title,
          category: dbArticle.category,
          excerpt: dbArticle.excerpt,
          content: dbArticle.body,
          favorites: dbArticle.favorites,
          cover: dbArticle.cover || "📜",
          author: dbArticle.author,
          source: dbArticle.source,
          tags: dbArticle.tags || [],
          created_at: dbArticle.created_at,
        },
        source: "db" as const,
      };
    }

    // Fallback to static data
    const article = ARTICLES.find((a) => a.id === params.id);
    if (!article) throw notFound();

    return {
      article: { ...article, author: "溯光编辑", source: "溯光知识库" },
      source: "static" as const,
    };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.article.title} · 溯光` },
          { name: "description", content: loaderData.article.excerpt },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <AppShell>
      <div className="py-20 text-center">
        <span className="text-6xl">📜</span>
        <h2 className="mt-4 font-serif text-2xl text-foreground">篇章不存在</h2>
        <p className="mt-2 text-sm text-muted-foreground">您寻的篇章或已散佚</p>
        <Link
          to="/gallery"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground hover:opacity-90"
        >
          <ArrowLeft className="h-4 w-4" /> 返回知识长廊
        </Link>
      </div>
    </AppShell>
  ),
  errorComponent: () => (
    <AppShell>
      <div className="py-20 text-center">
        <h2 className="font-serif text-2xl text-foreground">加载出错</h2>
        <p className="mt-2 text-sm text-muted-foreground">稍候片刻,重新撷取</p>
        <Link
          to="/gallery"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground hover:opacity-90"
        >
          <ArrowLeft className="h-4 w-4" /> 返回知识长廊
        </Link>
      </div>
    </AppShell>
  ),
  component: ArticlePage,
});

function ArticlePage() {
  const { article, source } = Route.useLoaderData();
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(article.favorites);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);

  useEffect(() => {
    // Check if user has favorited this article
    const checkFavorite = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data } = await supabase
        .from("article_favorites")
        .select("id")
        .eq("article_id", article.id)
        .eq("user_id", session.user.id)
        .single();

      if (data) setIsFavorited(true);
    };
    checkFavorite();
  }, [article.id]);

  const handleFavorite = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast.error("请先登录后再收藏");
      return;
    }

    setIsLoadingFavorite(true);
    try {
      if (isFavorited) {
        // Remove favorite
        await supabase
          .from("article_favorites")
          .delete()
          .eq("article_id", article.id)
          .eq("user_id", session.user.id);
        setIsFavorited(false);
        setFavoriteCount((c) => c - 1);
        toast.success("已取消收藏");
      } else {
        // Add favorite
        await supabase
          .from("article_favorites")
          .insert({ article_id: article.id, user_id: session.user.id });
        setIsFavorited(true);
        setFavoriteCount((c) => c + 1);
        toast.success("收藏成功");

        // Update article favorites count in DB
        if (source === "db") {
          await supabase
            .from("knowledge_articles")
            .update({ favorites: favoriteCount + 1 })
            .eq("id", article.id);
        }
      }
    } catch {
      toast.error("操作失败，请重试");
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = article.title;

    if (navigator.share) {
      try {
        await navigator.share({ title, text: article.excerpt, url });
      } catch {
        // User cancelled or error
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(url);
      toast.success("链接已复制到剪贴板");
    }
  };

  const related = ARTICLES.filter(
    (a) => a.category === article.category && a.id !== article.id
  ).slice(0, 5);

  return (
    <AppShell>
      {/* breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground transition-colors">首页</Link>
        <span className="text-border">/</span>
        <Link to="/gallery" className="hover:text-foreground transition-colors">知识长廊</Link>
        <span className="text-border">/</span>
        <span className="text-foreground/80 line-clamp-1">{article.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <article className="min-w-0 rounded-3xl border border-border bg-card p-8 md:p-12 scroll-in">
          {/* meta */}
          <div className="mb-4 flex flex-wrap items-center gap-3 text-xs">
            <span className="rounded-full bg-primary/10 px-3 py-1 font-serif tracking-wider text-primary">
              {article.category}
            </span>
            {article.source && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <User className="h-3 w-3" /> {article.author || "溯光编辑"}
              </span>
            )}
            {article.created_at && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3 w-3" /> {new Date(article.created_at).toLocaleDateString("zh-CN")}
              </span>
            )}
          </div>

          {/* title */}
          <h1 className="font-serif text-3xl font-semibold leading-snug text-foreground brush-in md:text-4xl">
            {article.title}
          </h1>

          {/* cover image placeholder */}
          <div className="relative my-8 flex h-[280px] items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border/70 bg-gradient-to-br from-secondary via-background to-secondary">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background:
                  "radial-gradient(circle at 30% 40%, var(--color-bronze) 0%, transparent 45%), radial-gradient(circle at 75% 70%, var(--color-cinnabar) 0%, transparent 40%)",
              }}
            />
            <span className="relative text-[100px]">{article.cover}</span>
          </div>

          {/* excerpt */}
          <p className="mb-6 font-serif text-lg leading-relaxed text-muted-foreground italic">
            {article.excerpt}
          </p>

          {/* content */}
          <div className="prose-suguang space-y-5">
            <p className="text-[15px] leading-[2] text-foreground/85 whitespace-pre-line">
              {article.content}
            </p>
          </div>

          {/* tags */}
          {"tags" in article && Array.isArray(article.tags) && article.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* actions */}
          <div className="mt-10 flex items-center gap-3 border-t border-border/60 pt-6">
            <button
              onClick={handleFavorite}
              disabled={isLoadingFavorite}
              className={`flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm transition-all ${
                isFavorited
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Heart className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
              {isFavorited ? "已收藏" : "收藏"} · {favoriteCount.toLocaleString()}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
            >
              <Share2 className="h-4 w-4" /> 分享
            </button>
          </div>

          {/* source */}
          {article.source && (
            <p className="mt-6 border-t border-border/40 pt-4 text-xs text-muted-foreground/70">
              出处: {article.source}
            </p>
          )}
        </article>

        {/* sidebar */}
        <aside className="space-y-6">
          {/* back button */}
          <Link
            to="/gallery"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 font-serif text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> 返回知识长廊
          </Link>

          {/* related */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-4 font-serif text-sm tracking-[0.3em] text-foreground/80">相 关 推 荐</h3>
            {related.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">暂无相关篇章</p>
            ) : (
              <div className="space-y-3">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    to="/article/$id"
                    params={{ id: r.id }}
                    className="group flex items-start gap-3 rounded-xl border border-transparent p-2 transition-colors hover:border-border hover:bg-secondary/50"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary text-2xl">
                      {r.cover}
                    </div>
                    <div className="min-w-0">
                      <div className="font-serif text-[10px] tracking-widest text-accent">{r.category}</div>
                      <h4 className="mt-0.5 font-serif text-sm leading-snug text-foreground line-clamp-2 group-hover:text-primary">
                        {r.title}
                      </h4>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
