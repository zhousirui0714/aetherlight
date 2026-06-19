import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

const NAV: { to: "/" | "/gallery" | "/chat" | "/dialogue" | "/create" | "/community"; label: string; exact?: boolean }[] = [
  { to: "/", label: "首页", exact: true },
  { to: "/gallery", label: "知识长廊" },
  { to: "/chat", label: "问答助手" },
  { to: "/dialogue", label: "对话" },
  { to: "/create", label: "创作" },
  { to: "/community", label: "社区" },
];

export function SiteHeader() {
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
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
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <button
            aria-label="搜索"
            className="rounded-full p-2 text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Search className="h-[18px] w-[18px]" strokeWidth={1.6} />
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
  );
}
