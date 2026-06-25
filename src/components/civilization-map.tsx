import { useNavigate } from "@tanstack/react-router";
import {
  User, ScrollText, BookOpen, Sparkles, Mountain, Drama,
  Building2, Brain, Cog, ArrowRight,
} from "lucide-react";

type Category = {
  key: string;
  label: string;
  desc: string;
  seal: string;  // 朱印字
  icon: typeof User;
};

const CATEGORIES: Category[] = [
  { key: "figures",    label: "人物", desc: "圣贤名士",   seal: "人", icon: User },
  { key: "poems",      label: "诗词", desc: "唐诗宋词",   seal: "诗", icon: ScrollText },
  { key: "classics",   label: "典籍", desc: "经史子集",   seal: "典", icon: BookOpen },
  { key: "festivals",  label: "节气", desc: "岁时节令",   seal: "气", icon: Sparkles },
  { key: "mythology",  label: "神话", desc: "上古传说",   seal: "神", icon: Mountain },
  { key: "intangible", label: "非遗", desc: "传统技艺",   seal: "遗", icon: Drama },
  { key: "artifacts",  label: "建筑", desc: "宫殿园林",   seal: "筑", icon: Building2 },
  { key: "philosophy", label: "哲学", desc: "诸子百家",   seal: "哲", icon: Brain },
  { key: "technology", label: "科技", desc: "四大发明",   seal: "科", icon: Cog },
];

export function CivilizationMap() {
  const navigate = useNavigate();

  return (
    <section data-section="civilization-map" className="relative overflow-hidden bg-background py-20">
      {/* 极淡的水墨底纹：右上角晕染圆 */}
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-[0.04]"
        style={{ background: "radial-gradient(circle, #2a2520 0%, transparent 60%)" }}
      />
      <div
        className="pointer-events-none absolute -left-20 bottom-20 h-72 w-72 rounded-full opacity-[0.03]"
        style={{ background: "radial-gradient(circle, #2a2520 0%, transparent 60%)" }}
      />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* 标题 */}
        <div className="mb-14 text-center">
          <div className="font-serif text-xs tracking-[0.4em] text-accent">EXPLORE BY CATEGORY</div>
          <h2 className="mt-3 font-serif text-3xl text-foreground md:text-4xl">文明地图</h2>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            九大主题，纵横五千年。点选一方水土，开启一场与先贤的对话。
          </p>
        </div>

        {/* 九宫格：水墨宣纸卡 */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-3">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.key}
                onClick={() => navigate({ to: "/gallery" })}
                className="group relative flex flex-col items-start gap-3 overflow-hidden rounded-xl border border-stone-300/60 bg-[#faf5e8]/70 p-6 text-left shadow-[0_1px_0_rgba(0,0,0,0.02)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-stone-500/70 hover:bg-[#f3ecd8]/80 hover:shadow-[0_8px_24px_-12px_rgba(42,37,32,0.25)] md:p-7"
              >
                {/* 极淡斜线纹路：装饰用 */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.025]"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(135deg, #2a2520 0px, #2a2520 1px, transparent 1px, transparent 14px)",
                  }}
                />

                {/* 图标：墨色统一，hover 显赭石 */}
                <div className="relative flex h-11 w-11 items-center justify-center text-foreground/75 transition-colors duration-300 group-hover:text-amber-800">
                  <Icon className="h-7 w-7" strokeWidth={1.4} />
                </div>

                {/* 标题与副标题 */}
                <div className="relative flex-1">
                  <div className="font-serif text-xl text-foreground md:text-[22px] tracking-wider">{cat.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground/80 md:text-sm">{cat.desc}</div>
                </div>

                {/* 右下角：朱印（hover 时颜色加深） */}
                <div className="relative ml-auto">
                  <div
                    className="flex h-7 w-7 items-center justify-center border border-rose-800/70 bg-rose-700/90 font-serif text-[12px] text-[#faf5e8] shadow-[0_1px_2px_rgba(180,40,40,0.3)] transition-all duration-300 group-hover:border-rose-900 group-hover:bg-rose-800 group-hover:shadow-[0_2px_6px_rgba(180,40,40,0.45)]"
                    style={{ borderRadius: "2px" }}
                  >
                    {cat.seal}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 底部小注 */}
        <div className="mt-12 text-center">
          <button
            onClick={() => navigate({ to: "/gallery" })}
            className="inline-flex items-center gap-1.5 font-serif text-sm tracking-[0.2em] text-foreground/70 transition hover:text-amber-800"
          >
            探索全部 15 大分类
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
