import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { getMyAnnotations, deleteAnnotation, type Annotation } from "@/lib/annotation-storage";
import { BookOpen, Trash2, MessageSquare, Clock, Loader2, User, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/annotations")({
  head: () => ({ meta: [{ title: "我的批注 · 溯光" }] }),
  component: AnnotationsPage,
});

function AnnotationsPage() {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterArticle, setFilterArticle] = useState<string>("all");

  useEffect(() => {
    loadAnnotations();
  }, []);

  const loadAnnotations = async () => {
    setLoading(true);
    try {
      const data = await getMyAnnotations();
      setAnnotations(data);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteAnnotation(id);
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);

    if (days < 1) return "今天";
    if (days < 7) return `${days} 天前`;
    if (days < 30) return `${Math.floor(days / 7)} 周前`;
    return date.toLocaleDateString("zh-CN");
  };

  const uniqueArticles = [...new Set(annotations.map((a) => a.article_id))];

  const filteredAnnotations =
    filterArticle === "all"
      ? annotations
      : annotations.filter((a) => a.article_id === filterArticle);

  if (loading) {
    return (
      <AppShell showSearch={false} title="我的批注">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell showSearch={false} title="我的批注">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-foreground">我的批注</h1>
          <p className="mt-1 text-sm text-muted-foreground">记录你的阅读思考和感悟</p>
        </div>
        <div className="text-right">
          <p className="font-serif text-3xl text-primary">{annotations.length}</p>
          <p className="text-xs text-muted-foreground">条批注</p>
        </div>
      </div>

      {annotations.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="font-serif text-lg text-foreground">暂无批注</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            开始阅读文章，为你喜欢的段落添加批注吧
          </p>
          <Link
            to="/gallery"
            className="mt-6 inline-block rounded-full bg-primary px-6 py-2 text-sm text-primary-foreground hover:opacity-90"
          >
            去阅读
          </Link>
        </div>
      ) : (
        <>
          {/* 筛选 */}
          {uniqueArticles.length > 1 && (
            <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setFilterArticle("all")}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm transition ${
                  filterArticle === "all"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                全部
              </button>
              {uniqueArticles.map((articleId) => (
                <button
                  key={articleId}
                  onClick={() => setFilterArticle(articleId)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-sm transition ${
                    filterArticle === articleId
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {annotations.find((a) => a.article_id === articleId)?.category || "文章"}
                </button>
              ))}
            </div>
          )}

          {/* 批注列表 */}
          <div className="space-y-4">
            {filteredAnnotations.map((annotation) => (
              <div key={annotation.id} className="rounded-3xl border border-border bg-card p-6">
                {/* 原文引用 */}
                {annotation.selected_text && (
                  <div className="mb-4 rounded-xl border-l-4 border-primary/30 bg-primary/5 p-4">
                    <p className="font-serif text-sm italic text-foreground/80">
                      "{annotation.selected_text}"
                    </p>
                  </div>
                )}

                {/* 批注内容 */}
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-sm text-foreground">
                          {annotation.user_name}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTime(annotation.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          {annotation.is_public ? (
                            <>
                              <Eye className="h-3 w-3 text-green-500" /> 公开
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3" /> 私密
                            </>
                          )}
                        </span>
                        <button
                          onClick={() => handleDelete(annotation.id)}
                          className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-foreground/85 whitespace-pre-wrap">
                      {annotation.content}
                    </p>
                  </div>
                </div>

                {/* 文章链接 */}
                <Link
                  to="/article/$id"
                  params={{ id: annotation.article_id }}
                  className="mt-4 flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition"
                >
                  <BookOpen className="h-3 w-3" />
                  查看原文
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </AppShell>
  );
}
