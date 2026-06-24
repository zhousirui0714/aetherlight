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
            onClick={() => navigate({ to: "/qa-square" })}
            className="hidden font-serif text-sm tracking-[0.2em] text-foreground/70 transition hover:text-primary md:inline-flex md:items-center md:gap-1"
          >
            全部问题
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* 知乎热榜式列表 */}
        <ol className="divide-y divide-border rounded-2xl border border-border bg-card">
          {HOT_LIST.map((item) => (
            <li key={item.rank}>
              <button
                onClick={() => navigate({ to: "/chat", search: { q: item.q } })}
                className="group flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-secondary"
              >
                {/* 排名 */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center">
                  <span
                    className={`font-serif text-2xl tabular-nums ${
                      item.rank <= 3 ? "text-amber-600" : "text-muted-foreground/50"
                    }`}
                  >
                    {item.rank}
                  </span>
                </div>

                {/* 中部内容 */}
                <div className="min-w-0 flex-1">
                  <div className="font-serif text-base text-foreground group-hover:text-primary md:text-lg">
                    {item.question}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={`rounded-full px-2 py-0.5 font-serif ${item.categoryColor}`}>
                      {item.category}
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                      <MessageCircle className="h-3 w-3" />
                      {(item.heat / 1000).toFixed(1)}k 热度
                    </span>
                  </div>
                </div>

                {/* 右侧箭头 */}
                <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground/40 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
              </button>
            </li>
          ))}
        </ol>

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
