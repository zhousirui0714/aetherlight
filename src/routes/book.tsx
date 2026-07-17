import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "典籍对话 · 溯光" },
      { name: "description", content: "与千年典籍对话，向 AI 学者请教经史子集。" },
    ],
  }),
  component: () => <Outlet />,
});
