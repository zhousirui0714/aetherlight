import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/wuge/")({
  beforeLoad: () => {
    throw redirect({ to: "/wuge/scroll" });
  },
});
