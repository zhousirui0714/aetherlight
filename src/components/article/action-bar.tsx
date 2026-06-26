import { useState, useEffect } from "react";
import { Heart, Share2, Bookmark, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import {
  addFavorite,
  removeFavorite,
  checkIsFavorited,
} from "@/lib/favorites-storage";
import { trackEvent } from "@/lib/journey-storage";
import { ShareCardButton } from "@/components/share-card-button";

interface ActionBarProps {
  articleId: string;
  articleTitle: string;
  articleCategory: string;
  dynasty?: string;
  author?: string;
  excerpt: string;
  cover?: string;
  coverUrl?: string;     // 完整封面图 URL（分享卡用）
  tags?: string[];       // 标签（分享卡用）
  onAskAI?: () => void;        // 进入 AI 问答
  onTalkFigure?: () => void;   // 与人物对话 (仅 figures)
  accent?: string;
}

export function ActionBar({
  articleId,
  articleTitle,
  articleCategory,
  dynasty,
  author,
  excerpt,
  cover,
  coverUrl,
  tags,
  onAskAI,
  onTalkFigure,
  accent = "var(--color-cinnabar)",
}: ActionBarProps) {
  const navigate = useNavigate();
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // 检查是否已收藏 (异步)
  useEffect(() => {
    let alive = true;
    checkIsFavorited(articleId)
      .then((v) => { if (alive) setIsFavorited(v); })
      .catch(() => {});
    return () => { alive = false; };
  }, [articleId]);

  const handleFavorite = async () => {
    if (favoriteLoading) return;
    setFavoriteLoading(true);
    try {
      if (isFavorited) {
        await removeFavorite(articleId);
        setIsFavorited(false);
        toast("已取消收藏");
      } else {
        await addFavorite({
          item_id: articleId,
          item_type: "knowledge",
          title: articleTitle,
          snippet: excerpt?.slice(0, 100) || "",
        });
        setIsFavorited(true);
        toast("已添加收藏");
        trackEvent({
          type: "favorite_add",
          title: `收藏：${articleTitle}`,
          description: excerpt?.slice(0, 50) || "",
          category: articleCategory,
        });
      }
    } catch {
      toast("操作失败，请重试");
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleShare = () => {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      (navigator as any).share({
        title: articleTitle,
        text: excerpt,
        url: typeof window !== "undefined" ? window.location.href : "",
      });
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast("链接已复制到剪贴板");
    }
  };

  return (
    <div
      className="mt-10 flex flex-wrap items-center gap-3 rounded-2xl border border-border p-4"
      style={{ background: `color-mix(in oklab, ${accent} 4%, var(--color-card))` }}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={handleFavorite}
          disabled={favoriteLoading}
          className={`flex items-center gap-1.5 rounded-full border px-4 py-2 font-serif text-sm transition ${
            isFavorited
              ? "border-red-300 bg-red-50 text-red-500"
              : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
          }`}
        >
          <Heart className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
          {isFavorited ? "已收藏" : "收藏"}
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 font-serif text-sm text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
        >
          <Share2 className="h-4 w-4" />
          分享链接
        </button>
        {ShareCardButton && (
          <ShareCardButton
            data={{
              title: articleTitle,
              category: articleCategory || "知识",
              dynasty,
              excerpt: excerpt || "",
              author,
              articleUrl: typeof window !== "undefined" ? window.location.href : "",
              coverEmoji: cover,
              coverUrl,
              tags,
            }}
          />
        )}
        <button
          onClick={onAskAI || (() => navigate({ to: "/chat", search: { q: articleTitle } }))}
          className="flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 font-serif text-sm text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
        >
          <MessageCircle className="h-4 w-4" />
          问 AI
        </button>
        {onTalkFigure && (
          <button
            onClick={onTalkFigure}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 font-serif text-sm text-white shadow-sm transition hover:opacity-90"
            style={{ background: accent }}
          >
            <Bookmark className="h-4 w-4" />
            与之对话
          </button>
        )}
      </div>
    </div>
  );
}
