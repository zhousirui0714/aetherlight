import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { KnowledgeGallery } from "@/components/knowledge-gallery";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "知识长廊 · 溯光" },
      { name: "description", content: "节气、节日、诗词、典籍、非遗、民俗、人物 —— 探索中华文明长河中的每一缕光。" },
    ],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  return (
    <AppShell>
      <div className="mb-2 text-center">
        <div className="font-serif text-xs tracking-[0.4em] text-accent">SUGUANG GALLERY</div>
        <h1 className="mt-3 font-serif text-4xl text-foreground">知 识 长 廊</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-loose text-muted-foreground">
          以书卷之姿，铺陈千年文化。在分类中漫步，在搜索中相遇。
        </p>
      </div>
      <KnowledgeGallery />
    </AppShell>
  );
}
