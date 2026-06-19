import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Users } from "lucide-react";

export const Route = createFileRoute("/community")({
  head: () => ({ meta: [{ title: "社区 · 溯光" }] }),
  component: () => (
    <AppShell title="社区">
      <div className="mt-16 flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Users className="h-7 w-7" strokeWidth={1.4} />
        </div>
        <h2 className="font-serif text-xl">雅集</h2>
        <p className="max-w-xs text-sm text-muted-foreground">
          同好相聚,分享您的文化感悟、收藏与创作。敬请期待。
        </p>
        <span className="seal mt-2">筹</span>
      </div>
    </AppShell>
  ),
});
