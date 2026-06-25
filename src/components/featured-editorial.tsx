import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, BookOpen } from "lucide-react";
import { FEATURED_EDITORIAL_IMAGE, FEATURED_EDITORIAL_CARDS } from "@/lib/home-illustrations";

type EditorialCard = {
  id: string;
  title: string;
  desc: string;
  category: string;
  categoryColor: string;
  image: string;
};

type Editorial = {
  id: string;
  tag: string;
  tagColor: string;
  title: string;
  desc: string;
  image: string;
  related: EditorialCard[];
};

// 编辑推荐 - 动态热门（初期 fallback 李白专题）
const EDITORIALS: Editorial[] = [
  {
    id: "libai",
    tag: "诗仙专题",
    tagColor: "bg-amber-100 text-amber-800",
    title: "李白：盛唐气象与诗歌巅峰",
    desc: "从《静夜思》的游子情怀，到《将进酒》的豪放不羁，再到《月下独酌》的孤高自许——诗仙李白的笔下，盛唐的山河与风骨徐徐展开。本专题精选 12 首代表作，串起他传奇一生的 4 个阶段。",
    image: FEATURED_EDITORIAL_IMAGE,
    related: [
      { id: "static-1", title: "静夜思", desc: "床前明月光，疑是地上霜", category: "诗词", categoryColor: "text-amber-700 bg-amber-50", image: FEATURED_EDITORIAL_CARDS[0].image },
      { id: "static-2", title: "将进酒", desc: "君不见黄河之水天上来", category: "诗词", categoryColor: "text-amber-700 bg-amber-50", image: FEATURED_EDITORIAL_CARDS[1].image },
      { id: "static-3", title: "月下独酌", desc: "举杯邀明月，对影成三人", category: "诗词", categoryColor: "text-amber-700 bg-amber-50", image: FEATURED_EDITORIAL_CARDS[2].image },
      { id: "static-4", title: "李白的蜀中岁月", desc: "少年仗剑去国，辞亲远游", category: "人物", categoryColor: "text-blue-700 bg-blue-50", image: FEATURED_EDITORIAL_CARDS[3].image },
    ],
  },
  // 后续可加更多专题
];

export function FeaturedEditorial() {
  const navigate = useNavigate();
  const editorial = EDITORIALS[0]; // 动态热门：目前只 1 个，hardcoded

  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-6xl px-6">
        {/* 标题 */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="font-serif text-xs tracking-[0.4em] text-accent">EDITOR'S PICK</div>
            <h2 className="mt-3 font-serif text-3xl text-foreground md:text-4xl">知识长廊精选</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              深入一个主题，关联诗词、人物与历史背景
            </p>
          </div>
          <button
            onClick={() => navigate({ to: "/gallery" })}
            className="hidden font-serif text-sm tracking-[0.2em] text-foreground/70 transition hover:text-primary md:inline-flex md:items-center md:gap-1"
          >
            查看更多
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* 大卡+小卡布局 */}
        <div className="grid gap-5 md:grid-cols-5">
          {/* 大卡 - 占 3/5 */}
          <button
            onClick={() => navigate({ to: "/article/$id", params: { id: editorial.id } })}
            className="group relative overflow-hidden rounded-2xl md:col-span-3 md:row-span-2"
          >
            <div
              className="aspect-[4/3] w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105 md:aspect-auto md:h-full"
              style={{ backgroundImage: `url(${editorial.image})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-8">
              <span className={`inline-block rounded-full px-3 py-1 font-serif text-xs ${editorial.tagColor}`}>
                {editorial.tag}
              </span>
              <h3 className="mt-4 font-serif text-2xl leading-tight drop-shadow-lg md:text-3xl lg:text-4xl">
                {editorial.title}
              </h3>
              <p className="mt-3 hidden max-w-xl text-sm text-white/90 drop-shadow md:line-clamp-3 md:block">
                {editorial.desc}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 font-serif text-sm tracking-[0.2em] text-amber-200">
                阅读专题
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </div>
          </button>

          {/* 小卡 - 4 张占 2/5 */}
          {editorial.related.map((card) => (
            <button
              key={card.id}
              onClick={() => navigate({ to: "/article/$id", params: { id: card.id } })}
              className="group flex gap-3 overflow-hidden rounded-2xl border border-border bg-card p-3 text-left transition hover:border-primary hover:shadow-md"
            >
              <div
                className="h-20 w-20 shrink-0 rounded-xl bg-cover bg-center md:h-24 md:w-24"
                style={{ backgroundImage: `url(${card.image})` }}
              />
              <div className="min-w-0 flex-1">
                <span className={`inline-block rounded-full px-2 py-0.5 font-serif text-[10px] ${card.categoryColor}`}>
                  {card.category}
                </span>
                <div className="mt-1.5 font-serif text-sm text-foreground line-clamp-1 group-hover:text-primary md:text-base">
                  {card.title}
                </div>
                <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {card.desc}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* 移动端"查看更多" */}
        <div className="mt-8 text-center md:hidden">
          <button
            onClick={() => navigate({ to: "/gallery" })}
            className="inline-flex items-center gap-1 font-serif text-sm tracking-[0.2em] text-foreground/70"
          >
            查看更多
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
