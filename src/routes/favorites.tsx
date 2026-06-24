import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Heart, Trash2, BookOpen, User, Lightbulb, Sparkles, ArrowRight, Loader2, X } from "lucide-react";
import { loadAllFavorites, removeFavorite, type FavoriteItem } from "@/lib/favorites-storage";
import { toast } from "sonner";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "我的收藏 · 溯光" },
      { name: "description", content: "收藏的诗词、人物、典籍与知识，随时重温。" },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    const list = await loadAllFavorites();
    setFavorites(list);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleDelete = async (itemId: string) => {
    const success = await removeFavorite(itemId);
    if (success) {
      toast("已取消收藏");
      setConfirmDelete(null);
      await refresh();
    } else {
      toast("删除失败，请重试");
    }
  };

  const handleItemClick = (item: FavoriteItem) => {
    // 知识/诗词 → 详情页（诗词也归在 knowledge 收藏里）
    if (item.item_type === "knowledge" || item.item_type === "poetry") {
      navigate({ to: "/article/$id", params: { id: item.item_id } });
    } else if (item.item_type === "person") {
      navigate({ to: "/dialogue" });
    } else {
      // quote 等其他类型 → 跳到 AI 问答
      navigate({ to: "/chat", search: { q: item.title } });
    }
  };

  const tabs = [
    { key: "all", label: "全部" },
    { key: "knowledge", label: "知识" },
    { key: "person", label: "人物" },
    { key: "poetry", label: "诗词" },
  ];

  const filteredFavorites = activeTab === "all"
    ? favorites
    : favorites.filter(f => f.item_type === activeTab);

  const typeIcon: Record<string, typeof BookOpen> = {
    knowledge: Lightbulb,
    person: User,
    poetry: BookOpen,
    quote: Sparkles,
  };

  const typeColor: Record<string, string> = {
    knowledge: "bg-orange-100 text-orange-600",
    person: "bg-primary/10 text-primary",
    poetry: "bg-accent/10 text-accent",
    quote: "bg-purple-100 text-purple-600",
  };

  const typeLabel: Record<string, string> = {
    knowledge: "知识",
    person: "人物",
    poetry: "诗词",
    quote: "名句",
  };

  return (
    <AppShell title="我的收藏">
      <div className="mb-8 text-center">
        <div className="font-serif text-xs tracking-[0.4em] text-accent">MY FAVORITES</div>
        <h1 className="mt-3 font-serif text-4xl text-foreground">我 的 收 藏</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-loose text-muted-foreground">
          珍藏每一缕文化微光，随时温故而知新。
        </p>
      </div>

      {/* 标签筛选 */}
      <div className="mb-6 flex justify-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-serif transition ${
              activeTab === tab.key
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            <span className="ml-1 text-xs opacity-70">
              ({tab.key === "all" ? favorites.length : favorites.filter(f => f.item_type === tab.key).length})
            </span>
          </button>
        ))}
      </div>

      {/* 收藏列表 */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">加载中…</p>
        </div>
      ) : filteredFavorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/30">
            <Heart className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <h3 className="font-serif text-lg text-foreground">尚无收藏</h3>
          <p className="mt-2 text-sm text-muted-foreground">在问答中遇到喜欢的内容，点击收藏即可保存</p>
          <button
            onClick={() => navigate({ to: "/chat" })}
            className="mt-6 rounded-full bg-primary px-6 py-2 text-sm text-primary-foreground hover:opacity-90"
          >
            去探索
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredFavorites.map((item) => {
            const Icon = typeIcon[item.item_type] || Lightbulb;
            const colorClass = typeColor[item.item_type] || "bg-muted text-muted-foreground";
            return (
              <div
                key={item.id}
                className="group relative rounded-3xl border border-border bg-card p-5 transition hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className={`shrink-0 rounded-xl p-3 ${colorClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{typeLabel[item.item_type] || item.item_type}</span>
                    </div>
                    <h3 
                      className="mt-1 cursor-pointer font-serif text-lg text-foreground group-hover:text-primary transition"
                      onClick={() => handleItemClick(item)}
                    >
                      {item.title}
                    </h3>
                    {item.snippet && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.snippet}</p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground/70">
                        {new Date(item.created_at).toLocaleDateString("zh-CN")}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleItemClick(item)}
                          className="flex items-center gap-1 rounded-full px-3 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                        >
                          查看 <ArrowRight className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(item.id)}
                          className="flex items-center gap-1 rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                          title="取消收藏"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 确认删除弹窗 */}
                {confirmDelete === item.id && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-background/90 backdrop-blur-sm">
                    <div className="text-center">
                      <p className="font-serif text-sm">确定取消收藏？</p>
                      <div className="mt-4 flex items-center justify-center gap-3">
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground hover:bg-secondary"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded-full bg-destructive px-4 py-1.5 text-sm text-destructive-foreground hover:opacity-90"
                        >
                          确定
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
