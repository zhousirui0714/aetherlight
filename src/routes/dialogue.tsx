import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dialogue")({
  head: () => ({
    meta: [
      { title: "与名家对话 · 溯光" },
      { name: "description", content: "择一位名家，共话春秋。与李白、苏轼、孔子、庄子等历史人物展开 AI 对话。" },
      { property: "og:title", content: "与名家对话 · 溯光" },
      { property: "og:description", content: "AI 还原千年雅士，与你共话春秋。" },
    ],
  }),
  component: () => <Outlet />,
});
