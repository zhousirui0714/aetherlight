import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ScrollText, BookMarked, NotebookPen, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/wuge")({
  head: () => ({ meta: [{ title: "吾阁 · 溯光" }] }),
  component: WugeLayout,
});

const TABS = [
  { to: "/wuge/scroll",  label: "书卷",  desc: "我的主页",  Icon: ScrollText },
  { to: "/wuge/library", label: "藏书",  desc: "收藏管理",  Icon: BookMarked },
  { to: "/wuge/notes",   label: "笔记",  desc: "感悟摘录",  Icon: NotebookPen },
  { to: "/wuge/growth",  label: "成长",  desc: "学习轨迹",  Icon: Sprout },
] as const;

function WugeLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = TABS.find((t) => pathname.startsWith(t.to))?.to ?? "/wuge/scroll";

  return (
    <AppShell fullBleed>
      {/* 卷轴题首 */}
      <div className="relative overflow-hidden bg-[#f4ecdc] dark:bg-[#2a241c]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] dark:opacity-[0.1]" aria-hidden>
          <svg viewBox="0 0 1200 200" preserveAspectRatio="none" width="100%" height="100%">
            <path d="M 0 140 Q 200 90 400 120 T 800 100 T 1200 110 L 1200 200 L 0 200 Z" fill="#3a3a3a" />
            <path d="M 0 165 Q 250 130 500 160 T 1000 150 T 1200 160 L 1200 200 L 0 200 Z" fill="#1a1a1a" opacity="0.6" />
          </svg>
        </div>
        <div className="relative mx-auto max-w-[1100px] px-6 pt-12 pb-8 md:pt-16">
          <div className="text-center">
            <div className="font-serif text-xs tracking-[0.6em] text-cinnabar/70">MY PRIVATE STUDY</div>
            <h1 className="mt-3 font-serif text-4xl font-light tracking-[0.25em] text-foreground md:text-5xl">
              吾　阁
            </h1>
            <div className="mx-auto mt-3 h-px w-24 bg-cinnabar/40" />
            <p className="mx-auto mt-4 max-w-md font-serif text-sm leading-loose tracking-wider text-foreground/60">
              一间记录文化学习与探索的个人书房
            </p>
          </div>

          {/* 4 tab 卷轴风导航 */}
          <nav className="mt-10 flex justify-center">
            <div className="relative inline-flex items-stretch overflow-hidden rounded-sm border border-cinnabar/20 bg-[#faf6ec]/80 shadow-[0_2px_12px_rgba(139,69,19,0.05)] backdrop-blur-sm dark:bg-[#3a3024]/80">
              {/* 卷轴左右两端小圆头 */}
              <div className="pointer-events-none absolute -left-1 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-cinnabar/60" />
              <div className="pointer-events-none absolute -right-1 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-cinnabar/60" />
              {TABS.map((tab) => {
                const isActive = active === tab.to;
                return (
                  <Link
                    key={tab.to}
                    to={tab.to}
                    className={cn(
                      "relative flex flex-col items-center gap-1 px-5 py-3 transition md:px-8 md:py-3.5",
                      "font-serif tracking-[0.2em]",
                      isActive
                        ? "bg-cinnabar/10 text-cinnabar"
                        : "text-foreground/65 hover:text-cinnabar hover:bg-cinnabar/5",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <tab.Icon className="h-3.5 w-3.5" strokeWidth={1.6} />
                      <span className="text-sm md:text-base">{tab.label}</span>
                    </div>
                    <span className="hidden md:inline text-[10px] tracking-[0.3em] text-foreground/40">
                      {tab.desc}
                    </span>
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 h-px w-12 -translate-x-1/2 bg-cinnabar" />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1100px] px-6 py-10">
        <Outlet />
      </div>
    </AppShell>
  );
}
