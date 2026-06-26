import { useNavigate } from "@tanstack/react-router";
import { MessageCircle, ArrowUpRight } from "lucide-react";

type HotQuestion = {
  rank: number;
  question: string;
  category: string;
  categoryColor: string;
  heat: number;
  q: string; // 搜索 query
};

const HOT_LIST: HotQuestion[] = [
  { rank: 1, question: "李白为什么被称为'诗仙'？他的诗到底好在哪里？", category: "人物·唐", categoryColor: "text-amber-700 bg-amber-50",  heat: 9823, q: "李白为什么被称为诗仙" },
  { rank: 2, question: "端午节真的起源于屈原吗？背后的真实历史是什么？",  category: "节日·汉", categoryColor: "text-green-700 bg-green-50",  heat: 8741, q: "端午节的真实起源" },
  { rank: 3, question: "《山海经》是一本怎样的书？为什么古人那么爱它？",     category: "典籍·先秦", categoryColor: "text-purple-700 bg-purple-50", heat: 7654, q: "山海经是一本怎样的书" },
  { rank: 4, question: "孔子、孟子、荀子，儒家三圣的核心思想有何不同？",   category: "哲学·先秦", categoryColor: "text-indigo-700 bg-indigo-50", heat: 6982, q: "儒家三圣思想异同" },
  { rank: 5, question: "京剧的'生旦净丑'分别是什么？脸谱有什么讲究？",    category: "非遗·清", categoryColor: "text-rose-700 bg-rose-50",   heat: 6233, q: "京剧生旦净丑与脸谱" },
  { rank: 6, question: "王阳明'龙场悟道'悟出了什么？心学为何影响深远？", category: "人物·明", categoryColor: "text-amber-700 bg-amber-50", heat: 5871, q: "王阳明龙场悟道" },
  { rank: 7, question: "为什么'二十四节气'能准确指导农事？科学原理何在？", category: "节气·古代", categoryColor: "text-green-700 bg-green-50", heat: 5412, q: "二十四节气的科学原理" },
  { rank: 8, question: "《诗经》'风雅颂'到底在唱什么？305 篇该如何读？",   category: "典籍·周", categoryColor: "text-purple-700 bg-purple-50", heat: 4988, q: "诗经风雅颂怎么读" },
];

// 前三名配色 - 呼应"金榜题名"的朱砂红→金→铜
const TOP_STYLE: Record<number, { bar: string; sealBorder: string; sealBg: string; sealText: string; text: string; badge: string; bg: string }> = {
  1: { bar: "bg-rose-700",     sealBorder: "border-rose-800/85",  sealBg: "bg-rose-700/90",   sealText: "text-[#faf5e8]",  text: "group-hover:text-rose-800",   badge: "bg-rose-100 text-rose-800",   bg: "bg-gradient-to-r from-rose-50/90 via-amber-50/40 to-transparent" },
  2: { bar: "bg-amber-600",     sealBorder: "border-amber-700/85", sealBg: "bg-amber-600/90",  sealText: "text-[#faf5e8]",  text: "group-hover:text-amber-700",   badge: "bg-amber-100 text-amber-800",  bg: "bg-gradient-to-r from-amber-50/80 via-orange-50/30 to-transparent" },
  3: { bar: "bg-orange-600",    sealBorder: "border-orange-700/85",sealBg: "bg-orange-600/90", sealText: "text-[#faf5e8]",  text: "group-hover:text-orange-700",  badge: "bg-orange-100 text-orange-800", bg: "bg-gradient-to-r from-orange-50/70 via-amber-50/20 to-transparent" },
};

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

        {/* 列表容器 - 加装饰角印 */}
        <div className="relative">
          {/* 右上角小印 "热问" */}
          <div className="absolute -right-2 -top-3 z-10 hidden md:block">
            <div
              className="flex h-9 w-9 items-center justify-center border-2 border-rose-800/80 bg-rose-700/85 font-serif text-sm leading-none text-[#faf5e8] shadow-[0_2px_8px_rgba(180,40,40,0.3)]"
              style={{ borderRadius: "2px" }}
            >
              热问
            </div>
          </div>

          <ol className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
            {HOT_LIST.map((item) => {
              const isTop = item.rank <= 3;
              const style = isTop ? TOP_STYLE[item.rank] : null;

              return (
                <li
                  key={item.rank}
                  className="border-b border-border/40 last:border-b-0"
                >
                  <button
                    onClick={() => navigate({ to: "/chat", search: { q: item.q } })}
                    className={`group relative flex w-full items-center gap-4 overflow-hidden px-5 py-4 text-left transition md:gap-5 md:px-6 md:py-5 ${
                      isTop ? `${style!.bg} hover:bg-secondary/50` : "hover:bg-secondary/60"
                    }`}
                  >
                    {/* 左侧色条 - 前三名 */}
                    {isTop && (
                      <div className={`absolute inset-y-0 left-0 w-1 ${style!.bar}`} />
                    )}

                    {/* 名次印章 */}
                    {isTop ? (
                      // 前三名：方印样式
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center border-2 ${style!.sealBorder} ${style!.sealBg} font-serif text-xl ${style!.sealText} shadow-md md:h-14 md:w-14 md:text-2xl`}
                        style={{ borderRadius: "3px" }}
                      >
                        {item.rank}
                      </div>
                    ) : (
                      // 4-8 名：常规数字
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center md:h-12 md:w-12">
                        <span className="font-serif text-2xl tabular-nums text-muted-foreground/50 md:text-3xl">
                          {item.rank}
                        </span>
                      </div>
                    )}

                    {/* 中部内容 */}
                    <div className="min-w-0 flex-1">
                      <div
                        className={`font-serif leading-snug text-foreground transition ${
                          isTop
                            ? `text-lg md:text-2xl ${style!.text}`
                            : "text-base group-hover:text-primary md:text-lg"
                        }`}
                      >
                        {item.question}
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground md:mt-2">
                        {isTop ? (
                          <>
                            <span className={`rounded-full px-2 py-0.5 font-serif text-[10px] tracking-wider ${style!.badge}`}>
                              本周热问
                            </span>
                            <span className="font-serif tracking-wide text-amber-700">
                              {(item.heat / 1000).toFixed(1)}k 热度
                            </span>
                          </>
                        ) : (
                          <>
                            <span className={`rounded-full px-2 py-0.5 font-serif text-[10px] ${item.categoryColor}`}>
                              {item.category}
                            </span>
                            <span className="inline-flex items-center gap-0.5">
                              <MessageCircle className="h-3 w-3" />
                              {(item.heat / 1000).toFixed(1)}k 热度
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 右侧箭头 */}
                    <ArrowUpRight
                      className={`h-5 w-5 shrink-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                        isTop ? "text-rose-700 group-hover:text-rose-800" : "text-muted-foreground/40 group-hover:text-primary"
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
