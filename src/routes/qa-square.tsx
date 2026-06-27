import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * /qa-square 已弃用 - "问答广场"功能合并到 /tongyou/community
 * 用户可以在社区里自由聊天
 */
export const Route = createFileRoute("/qa-square")({
  beforeLoad: () => {
    throw redirect({
      to: "/tongyou/community",
      replace: true,
    });
  },
});
