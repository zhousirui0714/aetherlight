import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ARTICLES } from "@/lib/knowledge-data";
import { Heart, Share2 } from "lucide-react";

export const Route = createFileRoute("/article/$id")({
  loader: ({ params }) => {
    const article = ARTICLES.find((a) => a.id === params.id);
    if (!article) throw notFound();
    return { article };
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
      <div className="py-20 text-center text-muted-foreground">篇章不存在</div>
    </AppShell>
  ),
  errorComponent: () => (
    <AppShell>
      <div className="py-20 text-center text-muted-foreground">加载出错</div>
    </AppShell>
  ),
  component: ArticlePage,
});

function ArticlePage() {
  const { article } = Route.useLoaderData();
  const related = ARTICLES.filter((a) => a.category === article.category && a.id !== article.id).slice(0, 5);

  return (
    <AppShell>
      {/* breadcrumb */}
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">首页</Link>
        <span className="mx-2 text-border">/</span>
        <Link to="/gallery" className="hover:text-foreground">知识长廊</Link>
        <span className="mx-2 text-border">/</span>
        <span className="text-foreground/80">{article.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <article className="min-w-0 rounded-3xl border border-border bg-card p-8 md:p-12 scroll-in">
          <div className="mb-3 flex items-center gap-3 text-xs">
            <span className="font-serif tracking-[0.3em] text-accent">{article.category}</span>
            <span className="text-border">·</span>
            <span className="text-muted-foreground inline-flex items-center gap-1">
              <Heart className="h-3 w-3" /> {article.favorites.toLocaleString()}
            </span>
          </div>
          <h1 className="font-serif text-4xl font-semibold leading-snug text-foreground brush-in">
            {article.title}
          </h1>
          <div className="relative my-8 flex h-[260px] items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border/70 bg-gradient-to-br from-secondary via-background to-secondary">
            <div className="absolute inset-0 opacity-40" style={{
              background: "radial-gradient(circle at 30% 40%, var(--color-bronze) 0%, transparent 45%), radial-gradient(circle at 75% 70%, var(--color-cinnabar) 0%, transparent 40%)",
            }} />
            <span className="relative text-[120px]">{article.cover}</span>
          </div>
          <div className="prose-suguang space-y-5">
            <p className="text-[15px] leading-[2] text-foreground/85 whitespace-pre-line">
              {article.content}
            </p>
          </div>
          <div className="mt-10 flex items-center gap-2 border-t border-border/60 pt-6">
            <button className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm text-muted-foreground hover:bg-secondary">
              <Heart className="h-4 w-4" /> 收藏
            </button>
            <button className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm text-muted-foreground hover:bg-secondary">
              <Share2 className="h-4 w-4" /> 分享
            </button>
          </div>
        </article>

        <aside className="space-y-4">
          <h3 className="font-serif text-base tracking-[0.3em] text-foreground/80">相 关 推 荐</h3>
          {related.length === 0 && (
            <p className="text-sm text-muted-foreground">暂无相关篇章</p>
          )}
          {related.map((r) => (
            <Link
              key={r.id}
              to="/article/$id"
              params={{ id: r.id }}
              className="group block rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-secondary text-3xl">
                  {r.cover}
                </div>
                <div className="min-w-0">
                  <div className="font-serif text-[10px] tracking-widest text-accent">{r.category}</div>
                  <h4 className="mt-1 font-serif text-sm text-foreground line-clamp-2 group-hover:text-primary">{r.title}</h4>
                </div>
              </div>
            </Link>
          ))}
        </aside>
      </div>
    </AppShell>
  );
}
