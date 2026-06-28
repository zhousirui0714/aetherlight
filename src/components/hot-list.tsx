import { useNavigate } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

type HotQuestion = {
  rank: number;
  question: string;
  category: string;
  heat: number;
  q: string; // 搜索 query
};

const HOT_LIST: HotQuestion[] = [
  { rank: 1, question: "李白为什么被称为'诗仙'？他的诗到底好在哪里？", category: "人物·唐", heat: 9823, q: "李白为什么被称为诗仙" },
  { rank: 2, question: "端午节真的起源于屈原吗？背后的真实历史是什么？",  category: "节日·汉", heat: 8741, q: "端午节的真实起源" },
  { rank: 3, question: "《山海经》是一本怎样的书？为什么古人那么爱它？",     category: "典籍·先秦", heat: 7654, q: "山海经是一本怎样的书" },
  { rank: 4, question: "孔子、孟子、荀子，儒家三圣的核心思想有何不同？",   category: "哲学·先秦", heat: 6982, q: "儒家三圣思想异同" },
  { rank: 5, question: "京剧的'生旦净丑'分别是什么？脸谱有什么讲究？",    category: "非遗·清", heat: 6233, q: "京剧生旦净丑与脸谱" },
  { rank: 6, question: "王阳明'龙场悟道'悟出了什么？心学为何影响深远？", category: "人物·明", heat: 5871, q: "王阳明龙场悟道" },
  { rank: 7, question: "为什么'二十四节气'能准确指导农事？科学原理何在？", category: "节气·古代", heat: 5412, q: "二十四节气的科学原理" },
  { rank: 8, question: "《诗经》'风雅颂'到底在唱什么？305 篇该如何读？",   category: "典籍·周", heat: 4988, q: "诗经风雅颂怎么读" },
];

/**
 * 风格 A: 文化印柔
 *  - 全部 8 行统一字号、留白、节奏
 *  - 1/2/3 用朱砂红方印 (seal, 12x12), 4-8 用淡灰方印 (10x10)
 *  - 不用渐变背景, 不用 left-border 抢色
 *  - 整段右上一枚"溯光热问"朱砂方印
 *  - 每行 hover 时: 印色加深, 文字颜色变主色
 *  - 印章统一: 圆角 2px, 字体 serif, 数字/字 都用同字体大小
 */
function Seal({ rank, isTop }: { rank: number; isTop: boolean }) {
  // 朱砂印 vs 淡印: 同一形状不同色调, 保持视觉一致性
  const tone = isTop
    ? "border-cinnabar/90 bg-cinnabar text-[#faf5e8] shadow-[0_1px_3px_rgba(196,58,48,0.25)]"
    : "border-border/70 bg-secondary/40 text-muted-foreground/60";
  const size = isTop ? "h-11 w-11 text-lg" : "h-9 w-9 text-base";
  return (
    <div
      className={`flex shrink-0 items-center justify-center border-2 font-serif tabular-nums md:${isTop ? "h-12 md:w-12 md:text-xl" : "h-10 md:w-10 md:text-lg"} ${size} ${tone}`}
      style={{ borderRadius: "2px" }}
    >
      {rank}
    </div>
  );
}

export function HotList() {
  const navigate = useNavigate();

  return (
    <section className="bg-secondary/30 py-20">
      <div className="mx-auto max-w-4xl px-6">
        {/* 标题 */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="font-serif text-xs tracking-[0.4em] text-accent">WHAT PEOPLE ASK</div>
            <h2 className="mt-3 font-serif text-3xl text-foreground md:text-4xl">大家都在问</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              最受关注的文化疑问 · 点击直达 AI 雅士答疑
            </p>
          </div>
          <button
            onClick={() => navigate({ to: "/tongyou/community" })}
            className="hidden font-serif text-sm tracking-[0.2em] text-foreground/70 transition hover:text-primary md:inline-flex md:items-center md:gap-1"
          >
            全部问题
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* 列表容器 - 右上角小印 */}
        <div className="relative">
          {/* 右上角 "溯光·热问" 朱砂方印 */}
          <div className="absolute -right-2 -top-3 z-10 hidden md:block">
            <div
              className="flex h-10 w-10 items-center justify-center border-2 border-vermilion-700/90 bg-vermilion-700 font-serif text-[11px] leading-tight tracking-wider text-[#faf5e8] shadow-[0_2px_6px_rgba(180,40,40,0.3)]"
              style={{ borderRadius: "2px" }}
            >
              <div className="text-center">
                <div>溯光</div>
                <div>热问</div>
              </div>
            </div>
          </div>

          <ol className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
            {HOT_LIST.map((item) => {
              const isTop = item.rank <= 3;
              return (
                <li
                  key={item.rank}
                  className="border-b border-border/40 last:border-b-0"
                >
                  <button
                    onClick={() => navigate({ to: "/chat", search: { q: item.q } })}
                    className="group relative flex w-full items-center gap-4 overflow-hidden px-5 py-4 text-left transition hover:bg-secondary/50 md:gap-5 md:px-6 md:py-[18px]"
                  >
                    {/* 名次印章 - 全行统一形状, 只换颜色 */}
                    <Seal rank={item.rank} isTop={isTop} />

                    {/* 中部内容 */}
                    <div className="min-w-0 flex-1">
                      <div className="font-serif text-base leading-snug text-foreground transition group-hover:text-primary md:text-lg">
                        {item.question}
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground md:mt-2">
                        <span className="rounded-sm border border-border/60 px-1.5 py-px font-serif text-[10px] tracking-wider text-muted-foreground">
                          {item.category}
                        </span>
                        <span className="font-serif tracking-wide text-amber-700/80">
                          {isTop ? "本周热问 · " : ""}{(item.heat / 1000).toFixed(1)}k 热度
                        </span>
                      </div>
                    </div>

                    {/* 右侧箭头 */}
                    <ArrowUpRight
                      className={`h-4 w-5 shrink-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                        isTop ? "text-cinnabar/70 group-hover:text-cinnabar" : "text-muted-foreground/40 group-hover:text-primary"
                      }`}
                    />
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mt-6 text-center md:hidden">
          <button
            onClick={() => navigate({ to: "/tongyou/community" })}
            className="inline-flex items-center gap-1 font-serif text-sm tracking-[0.2em] text-foreground/70"
          >
            去讨论
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
