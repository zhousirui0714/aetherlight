import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { DailyCard } from "@/components/daily-card";
import { KnowledgeGallery } from "@/components/knowledge-gallery";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "溯光 · 活化中国传统文化" },
      { name: "description", content: "溯历史长河,撷文明之光。AI 驱动的中国传统文化探索平台。" },
      { property: "og:title", content: "溯光 · 活化中国传统文化" },
      { property: "og:description", content: "每日文化撷光,知识长廊,AI 问答。" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <AppShell>
      <DailyCard />
      <KnowledgeGallery />
    </AppShell>
  );
}
