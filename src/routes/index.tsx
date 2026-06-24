import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { HomeHero } from "@/components/home-hero";
import { CivilizationMap } from "@/components/civilization-map";
import { HotList } from "@/components/hot-list";
import { FeaturedEditorial } from "@/components/featured-editorial";
import { SagesDialogue } from "@/components/sages-dialogue";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "溯光 Aetherlight · 探索中华文明" },
      { name: "description", content: "溯光是一座由 AI 驱动的数字长廊：故事、分类、问题、知识、对话——五种方式，带你穿越五千年中华文明。" },
      { property: "og:title", content: "溯光 · 探索中华文明" },
      { property: "og:description", content: "故事 → 分类 → 问题 → 知识 → 对话" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <AppShell>
      {/* ① 全屏 Hero - 故事入口 */}
      <HomeHero />
      {/* ② 文明地图 - 九宫格分类 */}
      <CivilizationMap />
      {/* ③ 大家都在问 - 知乎热榜式 */}
      <HotList />
      {/* ④ 知识长廊精选 - 大卡+小卡编辑推荐 */}
      <FeaturedEditorial />
      {/* ⑤ 与历史对话 - 8 位圣贤 */}
      <SagesDialogue />
    </AppShell>
  );
}
