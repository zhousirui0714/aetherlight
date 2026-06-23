import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { ARTICLES, type Article } from "@/lib/knowledge-data";
import { LazyImage } from "./lazy-image";

export function FeaturedKnowledge() {
  const featured = ARTICLES.slice(0, 4);

  return (
    <section className="mt-24">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <div className="font-serif text-xs tracking-[0.4em] text-accent">FEATURED</div>
          <h2 className="mt-2 font-serif text-3xl text-foreground">精选知识</h2>
          <p className="mt-2 text-sm text-muted-foreground">探寻文化深处的精彩</p>
        </div>
        <Link
          to="/gallery"
          className="hidden items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition md:inline-flex"
        >
          知识长廊 <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {featured.map((item, i) => (
          <Link
            key={item.id}
            to="/article/$id"
            params={{ id: item.id }}
            style={{ animationDelay: `${i * 60}ms` }}
            className="scroll-in group relative overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
          >
            {/* 封面 */}
            <div className="relative h-40 overflow-hidden">
              <LazyImage
                alt={item.title}
                placeholder={item.cover}
                fallback={item.cover}
                className="h-40 w-full transition-transform duration-500 group-hover:scale-110"
              />
              <span className="absolute left-3 top-3 rounded-full bg-background/80 px-2.5 py-0.5 text-[10px] font-serif tracking-widest text-accent backdrop-blur z-10">
                {item.category}
              </span>
            </div>

            {/* 内容 */}
            <div className="p-4">
              <h3 className="font-serif text-base text-foreground group-hover:text-primary transition line-clamp-2">
                {item.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                {item.excerpt}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 text-center md:hidden">
        <Link
          to="/gallery"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
        >
          进入知识长廊 <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
