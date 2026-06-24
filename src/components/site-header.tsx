import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Search, Moon, Sun, ChevronDown, MessageSquare, Calendar, Users } from "lucide-react";
import { useTheme } from "./theme-provider";
import { GlobalSearch } from "./global-search";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const NAV: { to: "/" | "/gallery" | "/chat" | "/dialogue" | "/create"; label: string; exact?: boolean }[] = [
  { to: "/", label: "首页", exact: true },
  { to: "/gallery", label: "知识长廊" },
  { to: "/chat", label: "问答助手" },
  { to: "/dialogue", label: "对话名家" },
  { to: "/create", label: "艺创工坊" },
];

const COMMUNITY_ITEMS: { to: "/tongyou/community" | "/tongyou/challenge"; label: string; icon: typeof MessageSquare; desc: string }[] = [
  { to: "/tongyou/community", label: "社区", icon: Users, desc: "用户分享与讨论" },
  { to: "/tongyou/challenge", label: "打卡", icon: Calendar, desc: "诗词打卡挑战" },
];

export function SiteHeader() {
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isCommunityActive = pathname.startsWith("/tongyou");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 键盘快捷键打开搜索
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-40 border-b transition-all ${
          scrolled
            ? "border-border/70 bg-background/85 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.15)] backdrop-blur-xl"
            : "border-transparent bg-background/60 backdrop-blur-md"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-8 px-6">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <span className="seal text-sm">溯光</span>
            <span className="font-serif text-lg tracking-[0.25em] text-foreground/90 hidden sm:inline">
              溯 · 光
            </span>
          </Link>

          <nav className="hidden md:flex flex-1 items-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: !!item.exact }}
                activeProps={{
                  className:
                    "text-primary after:scale-x-100",
                }}
                inactiveProps={{
                  className: "text-foreground/70 hover:text-foreground",
                }}
                className="relative font-serif px-3 py-2 text-sm tracking-[0.2em] transition-colors after:absolute after:left-3 after:right-3 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-primary after:transition-transform"
              >
                {item.label}
              </Link>
            ))}

            {/* 社区 Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={`relative inline-flex items-center gap-1 font-serif px-3 py-2 text-sm tracking-[0.2em] transition-colors outline-none ${
                  isCommunityActive
                    ? "text-primary"
                    : "text-foreground/70 hover:text-foreground"
                }`}
              >
                同游
                <ChevronDown className="h-3.5 w-3.5 opacity-70" strokeWidth={1.6} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[240px] p-1.5">
                {COMMUNITY_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.to;
                  return (
                    <DropdownMenuItem key={item.to} asChild>
                      <Link
                        to={item.to}
                        className={`flex items-start gap-3 rounded-md px-3 py-2.5 cursor-pointer outline-none ${
                          active ? "bg-secondary text-primary" : ""
                        }`}
                      >
                        <Icon className="h-4 w-4 mt-0.5 shrink-0" strokeWidth={1.6} />
                        <div className="flex-1 min-w-0">
                          <div className="font-serif text-sm tracking-wider">{item.label}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <button
              aria-label="搜索"
              onClick={() => setSearchOpen(true)}
              className="rounded-full p-2 text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Search className="h-[18px] w-[18px]" strokeWidth={1.6} />
              <span className="sr-only">搜索</span>
            </button>
            <button
              aria-label="切换主题"
              onClick={toggle}
              className="rounded-full p-2 text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground"
            >
              {theme === "dark" ? (
                <Sun className="h-[18px] w-[18px]" strokeWidth={1.6} />
              ) : (
                <Moon className="h-[18px] w-[18px]" strokeWidth={1.6} />
              )}
            </button>
            <Link
              to="/auth"
              className="ml-2 rounded-full border border-border bg-card px-4 py-1.5 font-serif text-sm tracking-widest text-foreground transition hover:border-primary/40 hover:text-primary"
            >
              登录
            </Link>
            <Link
              to="/auth"
              className="hidden sm:inline-flex rounded-full bg-primary px-4 py-1.5 font-serif text-sm tracking-widest text-primary-foreground transition hover:opacity-90"
            >
              注册
            </Link>
          </div>
        </div>
      </header>

      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
