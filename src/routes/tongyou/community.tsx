import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/tongyou/community")({
  head: () => ({
    meta: [
      { title: "文化社区 · 溯光" },
      { name: "description", content: "与同好共话文化，发帖讨论，传承千年智慧。" },
    ],
  }),
  component: () => <Outlet />,
});
