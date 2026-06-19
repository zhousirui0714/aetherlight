import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ARTICLES } from "@/lib/knowledge-data";
import { ChevronLeft, Heart } from "lucide-react";

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
  const related = ARTICLES.filter((a) => a.category === article.category && a.id !== article.id).slice(0, 3);

  return (
    <AppShell>
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> 返回
      </Link>
      <article className="rounded-3xl border border-border bg-card p-6 sm:p-10 scroll-in">
        <div className="mb-2 flex items-center gap-2 text-xs">
          <span className="font-serif tracking-widest text-accent">{article.category}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground inline-flex items-center gap-1">
            <Heart className="h-3 w-3" /> {article.favorites.toLocaleString()}
          </span>
        </div>
        <h1 className="font-serif text-3xl font-semibold leading-snug text-foreground">{article.title}</h1>
        <div className="my-6 flex h-40 items-center justify-center rounded-2xl border border-dashed border-border bg-background/40 text-7xl">
          {article.cover}
        </div>
        <p className="leading-loose text-foreground/85 whitespace-pre-line">{article.content}</p>
      </article>

      {related.length > 0 && (
        <section className="mt-8">
          <h3 className="mb-3 font-serif tracking-widest text-muted-foreground">相关推荐</h3>
          <div className="grid grid-cols-2 gap-3">
            {related.map((r) => (
              <Link
                key={r.id}
                to="/article/$id"
                params={{ id: r.id }}
                className="rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow"
              >
                <div className="text-3xl">{r.cover}</div>
                <h4 className="mt-2 font-serif text-sm">{r.title}</h4>
              </Link>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}
