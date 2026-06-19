import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ThemeProvider } from "@/components/theme-provider";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-6xl text-foreground">404</h1>
        <h2 className="mt-3 font-serif text-xl text-foreground">此页未撷得</h2>
        <p className="mt-2 text-sm text-muted-foreground">您寻的篇章或已散佚</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground hover:opacity-90"
        >
          回到溯光
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-xl text-foreground">墨色未干</h1>
        <p className="mt-2 text-sm text-muted-foreground">稍候片刻,重新撷取</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
          >
            重试
          </button>
          <a href="/" className="rounded-full border border-border bg-card px-4 py-2 text-sm hover:bg-secondary">
            返回首页
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#F5F0E8" },
      { title: "溯光 · 活化中国传统文化" },
      { name: "description", content: "溯历史长河,撷文明之光。AI 驱动的中国传统文化探索平台。" },
      { property: "og:title", content: "溯光" },
      { property: "og:description", content: "每日撷光 · 知识长廊 · AI 雅士" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Outlet />
        <Toaster position="top-center" toastOptions={{ className: "font-serif" }} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
