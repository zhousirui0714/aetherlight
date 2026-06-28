import { useNavigate } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

type HotQuestion = {
  rank: number;
  question: string;
  category: string;
  heat: number;
  q: string;
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

// 序号用繁体大写数字(传统印章/账册写法), 更古雅: 壹貳參肆伍陸柒捌玖拾
const CN_NUM = ["", "壹", "貳", "參", "肆", "伍", "陸", "柒", "捌", "玖", "拾"];

/**
 * 新中式水墨风 — HotList
 *
 * 设计原则:
 *  - 整段背景 = 宣纸米黄 + 淡淡水墨山水 SVG
 *  - 序号 = 竖排毛笔体(中文数字), 而不是色块
 *  - 分类/标签 = 极简小字 + 细线, 不再用色块
 *  - 行间分隔 = 极淡的朱砂横线 (像题跋)
 *  - 顶部题首 = "大家都在问" 用朱砂方印
 *  - 底部落款 = "—— 溯光" 朱砂小印
 *  - 整体留白 60%+, 远多于信息密度
 *  - 没有五颜六色, 没有圆角彩色胶囊
 */
export function HotList() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-[#f4ecdc] py-20">
      {/* 背景水墨山水 SVG - 极淡, 营造宣纸氛围 */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.08]" aria-hidden>
        <svg
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid slice"
          viewBox="0 0 1200 600"
        >
          {/* 远山 */}
          <path
            d="M 0 350 Q 100 280 200 320 T 400 290 T 600 310 T 800 280 T 1000 300 T 1200 270 L 1200 600 L 0 600 Z"
            fill="#3a3a3a"
          />
          {/* 中山 */}
          <path
            d="M 0 420 Q 150 360 300 400 T 600 380 T 900 410 T 1200 380 L 1200 600 L 0 600 Z"
            fill="#2a2a2a"
            opacity="0.6"
          />
          {/* 近山 */}
          <path
            d="M 0 500 Q 200 450 400 490 T 800 480 T 1200 470 L 1200 600 L 0 600 Z"
            fill="#1a1a1a"
            opacity="0.5"
          />
          {/* 飞鸟 3 只 */}
          <path
            d="M 850 120 q 8 -6 16 0 m -16 0 q 8 6 16 0"
            stroke="#1a1a1a"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M 920 90 q 6 -5 12 0 m -12 0 q 6 5 12 0"
            stroke="#1a1a1a"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M 980 140 q 6 -5 12 0 m -12 0 q 6 5 12 0"
            stroke="#1a1a1a"
            strokeWidth="1.5"
            fill="none"
          />
          {/* 一叶扁舟 */}
          <path
            d="M 150 480 q 40 -8 80 0 z"
            fill="#1a1a1a"
            opacity="0.7"
          />
          <line x1="190" y1="480" x2="190" y2="450" stroke="#1a1a1a" strokeWidth="1" opacity="0.6" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-4xl px-6">
        {/* 标题区 - 卷轴题首风 */}
        <div className="mb-12 text-center">
          <div className="font-serif text-xs tracking-[0.6em] text-cinnabar/70">
            溯　光
          </div>
          <h2 className="mt-4 font-serif text-4xl font-light tracking-[0.2em] text-foreground md:text-5xl">
            大家都在问
          </h2>
          <div className="mx-auto mt-3 h-px w-24 bg-cinnabar/40" />
          <p className="mt-4 font-serif text-sm tracking-wider text-foreground/60">
            最受关注的文化疑问 · 点击直达 AI 雅士答疑
          </p>
        </div>

        {/* 列表 - 卷轴风 */}
        <div className="relative rounded-sm border border-cinnabar/15 bg-[#faf6ec]/80 px-8 py-10 shadow-[0_2px_20px_rgba(139,69,19,0.06)] backdrop-blur-sm md:px-14 md:py-12">
          {/* 卷轴左右两端小圆头装饰 */}
          <div className="absolute -left-1 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-cinnabar/60" />
          <div className="absolute -right-1 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-cinnabar/60" />

          {/* 顶部小印: "热问" */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <div
              className="border-2 border-cinnabar bg-cinnabar px-3 py-1 font-serif text-xs tracking-[0.3em] text-[#faf5e8] shadow-[0_2px_4px_rgba(196,58,48,0.3)]"
              style={{ borderRadius: "1px" }}
            >
              热 问
            </div>
          </div>

          {/* 列表 - 一题一行, 中间用极细朱砂线分隔 */}
          <ol className="divide-y divide-cinnabar/15">
            {HOT_LIST.map((item) => (
              <li key={item.rank}>
                <button
                  onClick={() => navigate({ to: "/chat", search: { q: item.q } })}
                  className="group relative flex w-full items-baseline gap-6 py-5 text-left transition md:gap-8 md:py-6"
                >
                  {/* 序号 - 中文数字, 极淡, 像落款序号 */}
                  <span
                    className="w-8 shrink-0 select-none text-right font-serif text-2xl font-light text-cinnabar/40 transition group-hover:text-cinnabar md:w-10 md:text-3xl"
                    style={{ fontFamily: "'KaiTi', 'STKaiti', serif" }}
                  >
                    {CN_NUM[item.rank]}
                  </span>

                  {/* 中部内容 */}
                  <div className="min-w-0 flex-1">
                    <div className="font-serif text-base leading-relaxed text-foreground/85 transition group-hover:text-cinnabar md:text-lg">
                      {item.question}
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      <span className="font-serif tracking-[0.2em] text-foreground/50">
                        {item.category}
                      </span>
                      <span className="text-foreground/20">·</span>
                      <span className="font-serif tracking-wider text-foreground/40">
                        {(item.heat / 1000).toFixed(1)}k
                      </span>
                    </div>
                  </div>

                  {/* 右侧 - 极细箭头, hover 出现 */}
                  <ArrowUpRight
                    className="h-4 w-4 shrink-0 self-center text-foreground/20 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cinnabar/70"
                  />
                </button>
              </li>
            ))}
          </ol>

          {/* 底部落款 - 朱砂小印 "溯光" */}
          <div className="mt-8 flex items-center justify-between border-t border-cinnabar/15 pt-6">
            <div className="font-serif text-xs tracking-[0.3em] text-foreground/40">
              ——　溯光　辑录
            </div>
            <button
              onClick={() => navigate({ to: "/tongyou/community" })}
              className="font-serif text-xs tracking-[0.3em] text-cinnabar/70 transition hover:text-cinnabar"
            >
              观 其 全 貌 →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
