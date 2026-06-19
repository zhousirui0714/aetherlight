import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Search, Moon, Sun } from "lucide-react";
import { BottomNav } from "./bottom-nav";
import { useTheme } from "./theme-provider";

interface Props {
  children: ReactNode;
  title?: string;
  showSearch?: boolean;
}

export function AppShell({ children, title, showSearch = true }: Props) {
  const { theme, toggle } = useTheme();
  return (
    <div className="min-h-screen paper-texture pb-24">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="seal">溯光</span>
            {title ? <span className="font-serif text-base text-foreground/80">{title}</span> : null}
          </Link>
          <div className="flex items-center gap-1">
            {showSearch && (
              <button
                aria-label="搜索"
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <Search className="h-5 w-5" strokeWidth={1.6} />
              </button>
            )}
            <button
              aria-label="切换主题"
              onClick={toggle}
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" strokeWidth={1.6} /> : <Moon className="h-5 w-5" strokeWidth={1.6} />}
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 pt-4">{children}</main>
      <BottomNav />
    </div>
  );
}
