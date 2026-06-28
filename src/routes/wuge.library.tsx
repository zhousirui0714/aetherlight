import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Heart, Trash2, BookOpen, User, Lightbulb, Sparkles, ArrowRight, Loader2, Search, X, Filter } from "lucide-react";
import { loadAllFavorites, removeFavorite, type FavoriteItem } from "@/lib/favorites-storage";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/wuge/library")({
  head: () => ({
    meta: [{ title: "我的藏书 · 吾阁" }],
  }),
  component: LibraryPage,
});

type Cat = "all" | "person" | "poetry" | "classic" | "festival" | "heritage" | "architecture";

const CATS: { key: Cat; label: string }[] = [
  { key: "all",          label: "全部" },
  { key: "person",       label: "人物" },
  { key: "poetry",       label: "诗词" },
  { key: "classic",      label: "典籍" },
  { key: "festival",     label: "节日" },
  { key: "heritage",     label: "非遗" },
  { key: "architecture", label: "建筑" },
];

// 把现有 favorites.item_type 映射到 6 分类
function mapCategory(item: FavoriteItem): Cat[] {
  if (item.item_type === "person") return ["person"];
  if (item.item_type === "poetry") return ["poetry"];
  if (item.item_type === "quote")  return ["poetry"];
  if (item.item_type === "knowledge") {
    // 简单按 title/snippet 关键词推断
    const text = `${item.title} ${item.snippet ?? ""}`;
    if (/建筑|寺|塔|桥|楼|宫|城/.test(text)) return ["architecture"];
    if (/节日|节|端午|中秋|春节|清明|重阳|元宵/.test(text)) return ["festival"];
    if (/非遗|戏曲|京剧|昆曲|刺绣|陶瓷|剪纸|皮影/.test(text)) return ["heritage"];
    return ["classic"];
  }
  return ["classic"];
}

function LibraryPage() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Cat>("all");
  const [search, setSearch] = useState("");
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
    if (item.item_type === "knowledge" || item.item_type === "poetry") {
      navigate({ to: "/article/$id", params: { id: item.item_id } });
    } else if (item.item_type === "person") {
      navigate({ to: "/dialogue" });
    } else {
      navigate({ to: "/chat", search: { q: item.title } });
    }
  };

  const filtered = useMemo(() => {
    let list = favorites;
    if (activeTab !== "all") {
      list = list.filter((f) => mapCategory(f).includes(activeTab));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (f) => f.title.toLowerCase().includes(q) || (f.snippet ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [favorites, activeTab, search]);

  const counts = useMemo(() => {
    const m: Record<Cat, number> = { all: favorites.length, person: 0, poetry: 0, classic: 0, festival: 0, heritage: 0, architecture: 0 };
    favorites.forEach((f) => {
      mapCategory(f).forEach((c) => { if (c !== "all") m[c]++; });
    });
    return m;
  }, [favorites]);

  const typeIcon: Record<string, typeof BookOpen> = {
    knowledge: Lightbulb,
    person: User,
    poetry: BookOpen,
    quote: Sparkles,
  };

  const typeColor: Record<string, string> = {
    knowledge: "bg-cinnabar/10 text-cinnabar",
    person: "bg-cinnabar/10 text-cinnabar",
    poetry: "bg-cinnabar/10 text-cinnabar",
    quote: "bg-cinnabar/10 text-cinnabar",
  };

  const typeLabel: Record<string, string> = {
    knowledge: "知识",
    person: "人物",
    poetry: "诗词",
    quote: "名句",
  };

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-serif text-xs tracking-[0.4em] text-cinnabar/70">MY LIBRARY</div>
          <h2 className="mt-2 font-serif text-3xl tracking-[0.2em] text-foreground">我的藏书</h2>
          <p className="mt-2 font-serif text-sm text-foreground/55">
            共 {favorites.length} 卷 · 分类管理你的文化珍藏
          </p>
        </div>
        {/* 搜索框 */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索藏书..."
            className="w-full rounded-full border border-cinnabar/20 bg-[#faf6ec]/80 py-2 pl-9 pr-9 font-serif text-sm text-foreground placeholder:text-foreground/40 focus:border-cinnabar/50 focus:outline-none dark:bg-[#3a3024]/60"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 分类筛选 (古风细线 tab) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="h-3.5 w-3.5 shrink-0 text-foreground/40" />
        {CATS.map((c) => {
          const active = activeTab === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setActiveTab(c.key)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-1.5 font-serif text-xs tracking-[0.2em] transition",
                active
                  ? "border-cinnabar bg-cinnabar text-[#faf5e8]"
                  : "border-cinnabar/25 text-foreground/70 hover:border-cinnabar/50 hover:text-cinnabar",
              )}
            >
              {c.label}
              <span className={cn("ml-1.5 text-[10px]", active ? "opacity-80" : "text-foreground/40")}>
                {counts[c.key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-cinnabar" />
          <p className="mt-3 font-serif text-sm text-foreground/50">展开书阁…</p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={search ? "未搜到相关藏书" : "尚无藏书"}
          desc={search ? "换个关键词试试" : "在问答中遇到喜欢的内容,点击收藏即可保存"}
          actionLabel={search ? undefined : "去探索"}
          onAction={search ? undefined : () => navigate({ to: "/chat" })}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const Icon = typeIcon[item.item_type] || Lightbulb;
            const colorClass = typeColor[item.item_type] || "bg-cinnabar/10 text-cinnabar";
            return (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-sm border border-cinnabar/15 bg-[#faf6ec]/80 p-5 transition hover:border-cinnabar/40 hover:shadow-[0_4px_20px_rgba(139,69,19,0.08)] dark:bg-[#3a3024]/60"
              >
                <div className="flex items-start gap-4">
                  <div className={cn("shrink-0 rounded-sm p-2.5", colorClass)}>
                    <Icon className="h-4 w-4" strokeWidth={1.6} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-[10px] tracking-[0.3em] text-foreground/45">
                        {typeLabel[item.item_type] || item.item_type}
                      </span>
                      <span className="text-foreground/20">·</span>
                      <span className="font-serif text-[10px] tracking-wider text-foreground/40">
                        {new Date(item.created_at).toLocaleDateString("zh-CN")}
                      </span>
                    </div>
                    <h3
                      className="mt-1 cursor-pointer font-serif text-base leading-snug text-foreground group-hover:text-cinnabar transition line-clamp-2"
                      onClick={() => handleItemClick(item)}
                    >
                      {item.title}
                    </h3>
                    {item.snippet && (
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-foreground/55">
                        {item.snippet}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <button
                        onClick={() => handleItemClick(item)}
                        className="flex items-center gap-1 font-serif text-xs tracking-[0.2em] text-cinnabar/70 hover:text-cinnabar"
                      >
                        展 卷 <ArrowRight className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(item.id)}
                        className="rounded-full p-1.5 text-foreground/30 hover:bg-cinnabar/10 hover:text-cinnabar transition"
                        title="移出书阁"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {confirmDelete === item.id && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-sm bg-background/90 backdrop-blur-sm">
                    <div className="text-center">
                      <p className="font-serif text-sm">确定移出书阁？</p>
                      <div className="mt-4 flex items-center justify-center gap-3">
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="rounded-full border border-border px-4 py-1.5 text-xs text-muted-foreground hover:bg-secondary"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded-full bg-cinnabar px-4 py-1.5 text-xs text-[#faf5e8] hover:opacity-90"
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
    </div>
  );
}

function EmptyState({ title, desc, actionLabel, onAction }: { title: string; desc: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-sm border border-cinnabar/20 bg-cinnabar/5">
        <Heart className="h-7 w-7 text-cinnabar/40" strokeWidth={1.5} />
      </div>
      <h3 className="font-serif text-lg text-foreground">{title}</h3>
      <p className="font-serif text-sm text-foreground/55">{desc}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 rounded-full border border-cinnabar/30 bg-cinnabar/5 px-6 py-2 font-serif text-sm tracking-[0.3em] text-cinnabar hover:bg-cinnabar/10"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
