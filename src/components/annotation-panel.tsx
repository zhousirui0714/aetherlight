import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { saveAnnotation, getAnnotations, type Annotation } from "@/lib/annotation-storage";
import { MessageSquare, X, Loader2, Send, Eye, EyeOff, User, Heart } from "lucide-react";
import { toast } from "sonner";

interface AnnotationPanelProps {
  articleId: string;
  articleTitle: string;
  category: string;
}

export function AnnotationPanel({ articleId, articleTitle, category }: AnnotationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [newAnnotation, setNewAnnotation] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [userName, setUserName] = useState("访客");

  useEffect(() => {
    loadUserName();
    if (isOpen) {
      loadAnnotations();
    }
  }, [isOpen, articleId]);

  // 监听文本选择
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        setSelectedText(selection.toString().trim());
        setIsOpen(true);
        setShowForm(true);
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const loadUserName = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", user.id)
          .maybeSingle();
        
        if (profile?.nickname) {
          setUserName(profile.nickname);
        } else {
          setUserName(user.email?.split("@")[0] || "雅士");
        }
      }
    } catch {}
  };

  const loadAnnotations = async () => {
    setLoading(true);
    try {
      const data = await getAnnotations(articleId);
      setAnnotations(data);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newAnnotation.trim()) {
      toast("请输入批注内容");
      return;
    }

    setSubmitting(true);
    try {
      const annotation = await saveAnnotation({
        article_id: articleId,
        user_name: userName,
        content: newAnnotation,
        selected_text: selectedText || undefined,
        is_public: isPublic,
        category: articleTitle,
      });

      setAnnotations(prev => [annotation, ...prev]);
      setNewAnnotation("");
      setSelectedText("");
      setShowForm(false);
      toast.success("批注已保存");
    } catch (err) {
      console.error("Failed to save annotation:", err);
      toast("保存失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (hours < 1) return "刚刚";
    if (hours < 24) return `${hours} 小时前`;
    if (days < 7) return `${days} 天前`;
    return date.toLocaleDateString("zh-CN");
  };

  return (
    <>
      {/* 批注按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed right-6 bottom-24 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all ${
          isOpen
            ? "bg-primary text-primary-foreground"
            : "bg-card border border-border text-foreground hover:border-primary/40 hover:text-primary"
        }`}
      >
        {annotations.length > 0 ? (
          <div className="relative">
            <MessageSquare className="h-6 w-6" />
            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] text-accent-foreground">
              {annotations.length > 9 ? "9+" : annotations.length}
            </span>
          </div>
        ) : (
          <MessageSquare className="h-6 w-6" />
        )}
      </button>

      {/* 批注面板 */}
      {isOpen && (
        <div className="fixed right-6 bottom-40 z-40 w-80 max-h-[60vh] overflow-hidden rounded-3xl border border-border bg-background shadow-xl">
          {/* 头部 */}
          <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
            <div>
              <h3 className="font-serif text-sm text-foreground">批注</h3>
              <p className="text-xs text-muted-foreground">{annotations.length} 条批注</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1.5 hover:bg-secondary transition"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* 内容区 */}
          <div className="overflow-y-auto max-h-[calc(60vh-120px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : annotations.length === 0 && !showForm ? (
              <div className="py-12 text-center">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">暂无批注</p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  选择文字即可添加批注
                </p>
              </div>
            ) : (
              <div className="space-y-3 p-4">
                {/* 批注列表 */}
                {annotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    className="rounded-2xl border border-border bg-card p-3"
                  >
                    {annotation.selected_text && (
                      <p className="mb-2 text-xs italic text-muted-foreground/80 line-clamp-2">
                        "{annotation.selected_text}"
                      </p>
                    )}
                    <p className="text-sm text-foreground/85 whitespace-pre-wrap">
                      {annotation.content}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        {annotation.user_name}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {annotation.likes}
                        </span>
                        <span>{formatTime(annotation.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 添加批注表单 */}
          {showForm && (
            <div className="border-t border-border bg-card p-4">
              <p className="mb-2 text-xs text-muted-foreground">选中文本：</p>
              {selectedText && (
                <p className="mb-3 rounded-lg bg-secondary/50 p-2 text-xs italic text-foreground/80 line-clamp-2">
                  "{selectedText}"
                </p>
              )}
              <textarea
                value={newAnnotation}
                onChange={(e) => setNewAnnotation(e.target.value)}
                placeholder="写下你的批注..."
                rows={3}
                className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 placeholder:text-muted-foreground/70"
                autoFocus
              />
              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setSelectedText("");
                    setNewAnnotation("");
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground transition"
                >
                  取消
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPublic(!isPublic)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
                  >
                    {isPublic ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    {isPublic ? "公开" : "私密"}
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !newAnnotation.trim()}
                    className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Send className="h-3 w-3" />
                    )}
                    保存
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 添加按钮 */}
          {!showForm && (
            <div className="border-t border-border p-4">
              <button
                onClick={() => {
                  setShowForm(true);
                  toast("请先选择文章中的文字，然后再次点击添加批注");
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background py-2 text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition"
              >
                <MessageSquare className="h-4 w-4" />
                添加批注
              </button>
              <p className="mt-2 text-center text-[10px] text-muted-foreground/70">
                选择文字即可添加批注
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
