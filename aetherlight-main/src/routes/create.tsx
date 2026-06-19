import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Brush } from "lucide-react";

export const Route = createFileRoute("/create")({
  head: () => ({ meta: [{ title: "创作 · 溯光" }] }),
  component: () => (
    <AppShell title="创作">
      <div className="mt-16 flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Brush className="h-7 w-7" strokeWidth={1.4} />
        </div>
        <h2 className="font-serif text-xl">创作天地</h2>
        <p className="max-w-xs text-sm text-muted-foreground">
          即将开启:AI 协助您创作诗词、楹联、书法题字。敬请期待。
        </p>
        <span className="seal mt-2">筹</span>
      </div>
    </AppShell>
  ),
});
