import { useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

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
// 配图规则：知识长廊精选的配图统一用 AI 生成的对应主题图（pollinations.ai）
// 资源位于 public/images/editorial/，由 scripts/gen-editorial-images.mjs 生成
const EDITORIALS: Editorial[] = [
  {
    id: "libai",
    tag: "诗仙专题",
    tagColor: "bg-amber-100 text-amber-800",
    title: "李白：盛唐气象与诗歌巅峰",
    desc: "从《静夜思》的游子情怀，到《将进酒》的豪放不羁，再到《月下独酌》的孤高自许——诗仙李白的笔下，盛唐的山河与风骨徐徐展开。本专题精选 12 首代表作，串起他传奇一生的 4 个阶段。",
    image: "/images/editorial/libai.jpg",
    related: [
      { id: "static-1", title: "静夜思", desc: "床前明月光，疑是地上霜", category: "诗词", categoryColor: "text-amber-700 bg-amber-50", image: "/images/editorial/jingyesi.jpg" },
      { id: "static-2", title: "将进酒", desc: "君不见黄河之水天上来", category: "诗词", categoryColor: "text-amber-700 bg-amber-50", image: "/images/editorial/jiangjinjiu.jpg" },
      { id: "static-3", title: "月下独酌", desc: "举杯邀明月，对影成三人", category: "诗词", categoryColor: "text-amber-700 bg-amber-50", image: "/images/editorial/yuexiaduzhuo.jpg" },
      { id: "static-4", title: "李白的蜀中岁月", desc: "少年仗剑去国，辞亲远游", category: "人物", categoryColor: "text-blue-700 bg-blue-50", image: "/images/editorial/shuzhong.jpg" },
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

        {/* 方案 C：长卷横版大卡 + 下方 4 列小卡 */}
        <div className="space-y-5">
          {/* 大卡 - 16:7 横长 + 左侧米白渐变 + 文案叠加 */}
          <button
            onClick={() => navigate({ to: "/article/$id", params: { id: editorial.id } })}
            className="group relative block w-full overflow-hidden rounded-2xl border border-border/40 bg-card text-left transition hover:border-amber-300 hover:shadow-xl"
          >
            <div className="relative aspect-[16/7] w-full">
              {/* AI 生成主图作为背景 */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url(${editorial.image})` }}
              />
              {/* 左侧米白渐变蒙版（让文字可读） */}
              <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/65 to-background/10" />
              {/* 底部微弱米白，确保右下角细节也清晰 */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/30" />

              {/* 文案 - 左侧 55% 区域 */}
              <div className="absolute left-0 top-0 flex h-full w-3/5 flex-col justify-center p-6 md:p-10 lg:p-14">
                <span className={`inline-block w-fit rounded-full px-3 py-1 font-serif text-xs ${editorial.tagColor}`}>
                  {editorial.tag}
                </span>
                <h3 className="mt-3 font-serif text-xl leading-tight text-foreground md:mt-4 md:text-3xl lg:text-4xl">
                  {editorial.title}
                </h3>
                <p className="mt-2 hidden max-w-md text-sm text-foreground/75 md:mt-3 md:line-clamp-3 md:block md:text-base">
                  {editorial.desc}
                </p>
                <span className="mt-3 inline-flex w-fit items-center gap-1.5 font-serif text-sm tracking-[0.2em] text-rose-800 transition-all group-hover:gap-2.5 md:mt-5">
                  阅读专题
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>

              {/* 右侧装饰 - 印章 */}
              <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 md:block">
                <div
                  className="flex h-16 w-16 flex-col items-center justify-center border-2 border-rose-800/70 bg-rose-700/75 font-serif text-base leading-tight text-[#faf5e8] shadow-[0_4px_12px_rgba(180,40,40,0.35)] lg:h-20 lg:w-20 lg:text-lg"
                  style={{ borderRadius: "3px" }}
                >
                  <div>诗</div>
                  <div>仙</div>
                </div>
              </div>
            </div>
          </button>

          {/* 4 小卡 - 4 列横排 */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {editorial.related.map((card) => (
              <button
                key={card.id}
                onClick={() => navigate({ to: "/article/$id", params: { id: card.id } })}
                className="group flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card text-left transition hover:border-amber-300 hover:shadow-md"
              >
                <div
                  className="aspect-[4/3] w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url(${card.image})` }}
                />
                <div className="flex flex-1 flex-col p-3 md:p-4">
                  <span className={`inline-block w-fit rounded-full px-2 py-0.5 font-serif text-[10px] ${card.categoryColor}`}>
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
