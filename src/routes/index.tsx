import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { DailyCard } from "@/components/daily-card";
import { TodayCards } from "@/components/today-cards";
import { QABanner } from "@/components/qa-banner";
import { HotQuestions } from "@/components/hot-questions";
import { FeaturedKnowledge } from "@/components/featured-knowledge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "溯光 Aetherlight · 活化中国传统文化的 AI 平台" },
      { name: "description", content: "溯历史长河，撷文明之光。每日文化推送、今日撷英、AI 雅士问答，以 AI 重现千年东方智慧。" },
      { property: "og:title", content: "溯光 · 活化中国传统文化" },
      { property: "og:description", content: "每日撷光 · 今日撷英 · AI 问道" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <AppShell>
      <DailyCard />
      <TodayCards />
      <HotQuestions />
      <FeaturedKnowledge />
      <QABanner />
    </AppShell>
  );
}
