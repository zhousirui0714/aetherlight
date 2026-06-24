import { useNavigate } from "@tanstack/react-router";
import {
  User, ScrollText, BookOpen, Sparkles, Mountain, Drama,
  Building2, Brain, Cog, ArrowRight,
} from "lucide-react";

type Category = {
  key: string;
  label: string;
  desc: string;
  icon: typeof User;
  color: string;
  bg: string;
};

const CATEGORIES: Category[] = [
  { key: "figures",  label: "人物", desc: "圣贤名士", icon: User,         color: "text-blue-700",   bg: "bg-blue-50 hover:bg-blue-100" },
  { key: "poems",    label: "诗词", desc: "唐诗宋词", icon: ScrollText,   color: "text-amber-700",  bg: "bg-amber-50 hover:bg-amber-100" },
  { key: "classics", label: "典籍", desc: "经史子集", icon: BookOpen,     color: "text-purple-700", bg: "bg-purple-50 hover:bg-purple-100" },
  { key: "festivals",label: "节气", desc: "岁时节令", icon: Sparkles,     color: "text-green-700",  bg: "bg-green-50 hover:bg-green-100" },
  { key: "mythology",label: "神话", desc: "上古传说", icon: Mountain,     color: "text-cyan-700",   bg: "bg-cyan-50 hover:bg-cyan-100" },
  { key: "intangible",label: "非遗", desc: "传统技艺", icon: Drama,        color: "text-rose-700",   bg: "bg-rose-50 hover:bg-rose-100" },
  { key: "artifacts",label: "建筑", desc: "宫殿园林", icon: Building2,    color: "text-orange-700", bg: "bg-orange-50 hover:bg-orange-100" },
  { key: "philosophy",label: "哲学", desc: "诸子百家", icon: Brain,        color: "text-indigo-700", bg: "bg-indigo-50 hover:bg-indigo-100" },
  { key: "technology",label: "科技", desc: "四大发明", icon: Cog,          color: "text-slate-700",  bg: "bg-slate-50 hover:bg-slate-100" },
];

export function CivilizationMap() {
  const navigate = useNavigate();

  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-6xl px-6">
        {/* 标题 */}
        <div className="mb-12 text-center">
          <div className="font-serif text-xs tracking-[0.4em] text-accent">EXPLORE BY CATEGORY</div>
          <h2 className="mt-3 font-serif text-3xl text-foreground md:text-4xl">文明地图</h2>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            九大主题，纵横五千年。点选一方水土，开启一场与先贤的对话。
          </p>
        </div>

        {/* 九宫格 */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-3">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.key}
                onClick={() => navigate({ to: "/gallery" })}
                className={`group relative flex flex-col items-start gap-3 rounded-2xl border border-border p-5 text-left transition-all hover:-translate-y-1 hover:shadow-lg md:p-6 ${cat.bg}`}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ${cat.color} transition-transform group-hover:scale-110`}>
                  <Icon className="h-6 w-6" strokeWidth={1.6} />
                </div>
                <div className="flex-1">
                  <div className="font-serif text-xl text-foreground md:text-2xl">{cat.label}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground md:text-sm">{cat.desc}</div>
                </div>
                <ArrowRight className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" />
              </button>
            );
          })}
        </div>

        {/* 底部小注 */}
        <div className="mt-10 text-center">
          <button
            onClick={() => navigate({ to: "/gallery" })}
            className="inline-flex items-center gap-1.5 font-serif text-sm tracking-[0.2em] text-foreground/70 transition hover:text-primary"
          >
            探索全部 15 大分类
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
