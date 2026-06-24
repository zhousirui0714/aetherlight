import { useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SAGES } from "@/lib/sages";

const FEATURED_SAGE_IDS = [
  "confucius",      // 孔子
  "wangxizhi",      // 王羲之
  "libai",          // 李白
  "sushi",          // 苏轼
  "wangyangming",   // 王阳明
  "guanhanqing",    // 关汉卿
  "caoxueqin",      // 曹雪芹
  "meilanfang",     // 梅兰芳
];

// 8 位圣贤头像 (用 picsum seed 保持稳定, 后续可换 AI 生成的圣贤插图)
const SAGE_AVATAR: Record<string, string> = {
  confucius:    "https://picsum.photos/seed/confucius-portrait/240/240",
  wangxizhi:    "https://picsum.photos/seed/wangxizhi-portrait/240/240",
  libai:        "https://picsum.photos/seed/libai-portrait/240/240",
  sushi:        "https://picsum.photos/seed/sushi-portrait/240/240",
  wangyangming: "https://picsum.photos/seed/wangyangming-portrait/240/240",
  guanhanqing:  "https://picsum.photos/seed/guanhanqing-portrait/240/240",
  caoxueqin:    "https://picsum.photos/seed/caoxueqin-portrait/240/240",
  meilanfang:   "https://picsum.photos/seed/meilanfang-portrait/240/240",
};

export function SagesDialogue() {
  const navigate = useNavigate();
  const featured = FEATURED_SAGE_IDS
    .map((id) => SAGES.find((s) => s.id === id))
    .filter(Boolean) as typeof SAGES;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-amber-50/40 to-background py-20">
      {/* 装饰背景 */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]">
        <div className="absolute left-1/4 top-10 text-[200px] font-serif leading-none text-amber-900">道</div>
        <div className="absolute right-1/4 bottom-10 text-[200px] font-serif leading-none text-amber-900">禅</div>
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        {/* 标题 */}
        <div className="mb-12 text-center">
          <div className="font-serif text-xs tracking-[0.4em] text-accent">CONVERSE WITH THE SAGES</div>
          <h2 className="mt-3 font-serif text-3xl text-foreground md:text-4xl">与历史对话</h2>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            跨越千年的叩问，孔子、王阳明、李白、苏轼……他们就坐在你对面
          </p>
        </div>

        {/* 8 张圣贤卡片 - 2/3/4 列响应式 */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-5">
          {featured.map((sage) => (
            <button
              key={sage.id}
              onClick={() => navigate({ to: "/dialogue/$id", params: { id: sage.id } })}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 text-center transition-all hover:-translate-y-1 hover:border-amber-300 hover:shadow-xl md:p-6"
            >
              {/* 圆形头像 */}
              <div className="relative">
                <div
                  className="h-20 w-20 rounded-full bg-cover bg-center ring-2 ring-amber-100 transition-all group-hover:ring-amber-400 md:h-24 md:w-24"
                  style={{ backgroundImage: `url(${SAGE_AVATAR[sage.id] || "https://picsum.photos/seed/sage/240/240"})` }}
                />
                <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary font-serif text-xs text-primary-foreground shadow-md">
                  {sage.avatar}
                </div>
              </div>

              {/* 姓名 + 朝代 */}
              <div>
                <div className="font-serif text-lg text-foreground md:text-xl">{sage.name}</div>
                <div className="mt-0.5 text-[10px] text-muted-foreground md:text-xs">{sage.dynasty}</div>
              </div>

              {/* 金句（短） */}
              <div className="line-clamp-2 px-1 text-xs italic text-foreground/70 md:text-sm">
                「{sage.representative}」
              </div>

              {/* 标签 */}
              <div className="flex flex-wrap justify-center gap-1">
                {sage.styles.slice(0, 2).map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-800"
                  >
                    {s}
                  </span>
                ))}
              </div>

              {/* hover 显示 CTA */}
              <div className="mt-1 flex h-6 items-center gap-1 font-serif text-xs text-primary opacity-0 transition group-hover:opacity-100">
                与 TA 对话
                <ArrowRight className="h-3 w-3 transition group-hover:translate-x-1" />
              </div>
            </button>
          ))}
        </div>

        {/* 底部：进入对话名家页 */}
        <div className="mt-10 text-center">
          <button
            onClick={() => navigate({ to: "/dialogue" })}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary/5 px-6 py-2.5 font-serif text-sm tracking-[0.2em] text-primary transition hover:bg-primary hover:text-primary-foreground"
          >
            查看全部 {SAGES.length} 位圣贤
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
