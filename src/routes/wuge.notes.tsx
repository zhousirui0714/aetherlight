import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { NotebookPen, Search, X, Trash2, Loader2, Sparkles, Download, Edit3, Save, Calendar, Filter, BookOpen, Check, X as XIcon } from "lucide-react";
import { getMyAnnotations, deleteAnnotation, type Annotation } from "@/lib/annotation-storage";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/wuge/notes")({
  head: () => ({ meta: [{ title: "我的笔记 · 吾阁" }] }),
  component: NotesPage,
});

function NotesPage() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [aiOrganizing, setAiOrganizing] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [filterArticle, setFilterArticle] = useState<string>("all");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getMyAnnotations();
      setNotes(data);
    } finally {
      setLoading(false);
    }
  };

  const uniqueArticles = useMemo(() => {
    const map = new Map<string, string>();
    notes.forEach((n) => { if (!map.has(n.article_id)) map.set(n.article_id, n.article_id); });
    return Array.from(map.entries());
  }, [notes]);

  const filtered = useMemo(() => {
    let list = notes;
    if (filterArticle !== "all") list = list.filter((n) => n.article_id === filterArticle);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (n) =>
          n.content.toLowerCase().includes(q) ||
          (n.selected_text ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [notes, search, filterArticle]);

  const handleDelete = async (id: string) => {
    await deleteAnnotation(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    toast("已删除笔记");
  };

  const handleEdit = (note: Annotation) => {
    setEditingId(note.id);
    setEditingContent(note.content);
  };

  const handleSave = async () => {
    if (!editingId) return;
    // 本地编辑: 直接更新本地列表 (annotation-storage 也支持 updateAnnotation)
    setNotes((prev) => prev.map((n) => n.id === editingId ? { ...n, content: editingContent, updated_at: new Date().toISOString() } : n));
    setEditingId(null);
    setEditingContent("");
    toast("已保存");
  };

  const handleAiOrganize = async () => {
    if (notes.length === 0) {
      toast("暂无笔记可整理");
      return;
    }
    setAiOrganizing(true);
    setAiResult(null);
    try {
      const corpus = notes.map((n, i) => `【${i + 1}】${n.selected_text ? `原文: ${n.selected_text}\n感悟: ` : ""}${n.content}`).join("\n\n");
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              id: "user-1",
              role: "user",
              parts: [{ type: "text", text: `请把我以下文化阅读笔记整理归纳为几大主题(每主题一段),并提炼核心感悟。语气古雅,符合"溯光"中国传统文化调性。\n\n笔记原文:\n${corpus.slice(0, 3000)}` }],
            },
          ],
        }),
      });
      if (!res.ok) throw new Error("AI 整理失败");
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // 提取文本(略简化: 直接 append, 有 SSE 噪声也无所谓)
        full += chunk.replace(/^data: /gm, "").replace(/^\n+/, "").replace(/"\}\n\n$/g, "");
      }
      setAiResult(full || "（AI 未返回内容，请稍后再试）");
    } catch (e) {
      toast.error("AI 整理失败,请稍后再试");
    } finally {
      setAiOrganizing(false);
    }
  };

  const handleExport = () => {
    if (notes.length === 0) {
      toast("暂无可导出的笔记");
      return;
    }
    const md = notes.map((n) => {
      const date = new Date(n.created_at).toLocaleString("zh-CN");
      return `## ${date}\n\n${n.selected_text ? `> ${n.selected_text}\n\n` : ""}${n.content}\n\n---\n`;
    }).join("\n");
    const header = `# 吾阁 · 笔记集\n\n导出时间: ${new Date().toLocaleString("zh-CN")}\n共 ${notes.length} 则\n\n---\n\n`;
    const blob = new Blob([header + md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wuge-notes-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast("已导出为 Markdown");
  };

  return (
    <div className="space-y-6">
      {/* 标题 + 操作 */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-serif text-xs tracking-[0.4em] text-cinnabar/70">MY NOTES</div>
          <h2 className="mt-2 font-serif text-3xl tracking-[0.2em] text-foreground">我的笔记</h2>
          <p className="mt-2 font-serif text-sm text-foreground/55">
            共 {notes.length} 则 · 记录阅读中的感悟与摘录
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleAiOrganize}
            disabled={aiOrganizing || notes.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-cinnabar/30 bg-cinnabar/5 px-4 py-1.5 font-serif text-xs tracking-[0.3em] text-cinnabar transition hover:bg-cinnabar/10 disabled:opacity-50"
          >
            {aiOrganizing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {aiOrganizing ? "整理中…" : "AI 整理"}
          </button>
          <button
            onClick={handleExport}
            disabled={notes.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-cinnabar/30 px-4 py-1.5 font-serif text-xs tracking-[0.3em] text-cinnabar transition hover:bg-cinnabar/5 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            导 出
          </button>
        </div>
      </div>

      {/* AI 整理结果 */}
      {aiResult && (
        <div className="relative overflow-hidden rounded-sm border border-cinnabar/30 bg-gradient-to-br from-cinnabar/5 to-transparent p-5">
          <button
            onClick={() => setAiResult(null)}
            className="absolute right-3 top-3 rounded-full p-1 text-foreground/40 hover:bg-cinnabar/10 hover:text-cinnabar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <div className="mb-2 flex items-center gap-2 font-serif text-xs tracking-[0.3em] text-cinnabar">
            <Sparkles className="h-3.5 w-3.5" /> AI 雅 士 整 理
          </div>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap font-serif text-sm leading-loose text-foreground/85">
            {aiResult}
          </div>
        </div>
      )}

      {/* 筛选 + 搜索 */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="h-3.5 w-3.5 shrink-0 text-foreground/40" />
          <button
            onClick={() => setFilterArticle("all")}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 font-serif text-xs tracking-[0.2em] transition",
              filterArticle === "all"
                ? "border-cinnabar bg-cinnabar text-[#faf5e8]"
                : "border-cinnabar/25 text-foreground/70 hover:border-cinnabar/50 hover:text-cinnabar",
            )}
          >
            全部 ({notes.length})
          </button>
          {uniqueArticles.map(([aid]) => (
            <button
              key={aid}
              onClick={() => setFilterArticle(aid)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 font-serif text-xs tracking-[0.2em] transition",
                filterArticle === aid
                  ? "border-cinnabar bg-cinnabar text-[#faf5e8]"
                  : "border-cinnabar/25 text-foreground/70 hover:border-cinnabar/50 hover:text-cinnabar",
              )}
            >
              {aid.slice(0, 12)}…
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索笔记..."
            className="w-full rounded-full border border-cinnabar/20 bg-[#faf6ec]/80 py-1.5 pl-8 pr-8 font-serif text-xs text-foreground placeholder:text-foreground/40 focus:border-cinnabar/50 focus:outline-none dark:bg-[#3a3024]/60"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* 笔记列表 */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-cinnabar" />
          <p className="mt-3 font-serif text-sm text-foreground/50">展开笔记…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-sm border border-cinnabar/20 bg-cinnabar/5">
            <NotebookPen className="h-7 w-7 text-cinnabar/40" strokeWidth={1.5} />
          </div>
          <h3 className="font-serif text-lg text-foreground">
            {search ? "未搜到相关笔记" : "暂无笔记"}
          </h3>
          <p className="font-serif text-sm text-foreground/55">
            {search ? "换个关键词试试" : "阅读文章时为喜欢的段落添加批注,感悟自然积累"}
          </p>
          {!search && (
            <button
              onClick={() => navigate({ to: "/gallery" })}
              className="mt-4 rounded-full border border-cinnabar/30 bg-cinnabar/5 px-6 py-2 font-serif text-sm tracking-[0.3em] text-cinnabar hover:bg-cinnabar/10"
            >
              去 阅 读
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((note) => (
            <article
              key={note.id}
              className="group relative rounded-sm border border-cinnabar/15 bg-[#faf6ec]/80 p-5 transition hover:border-cinnabar/30 dark:bg-[#3a3024]/60"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px] font-serif tracking-[0.2em] text-foreground/40">
                <Calendar className="h-3 w-3" />
                <span>{new Date(note.created_at).toLocaleString("zh-CN")}</span>
                <span className="text-foreground/20">·</span>
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {note.article_id.slice(0, 16)}
                </span>
                {note.category && note.category !== "general" && (
                  <>
                    <span className="text-foreground/20">·</span>
                    <span className="rounded-sm bg-cinnabar/10 px-1.5 py-0.5 text-cinnabar/80">{note.category}</span>
                  </>
                )}
                <div className="ml-auto flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                  {editingId === note.id ? (
                    <>
                      <button onClick={handleSave} className="rounded-full p-1.5 text-cinnabar hover:bg-cinnabar/10" title="保存">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="rounded-full p-1.5 text-foreground/40 hover:bg-secondary" title="取消">
                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEdit(note)} className="rounded-full p-1.5 text-foreground/40 hover:bg-cinnabar/10 hover:text-cinnabar" title="编辑">
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(note.id)} className="rounded-full p-1.5 text-foreground/40 hover:bg-cinnabar/10 hover:text-cinnabar" title="删除">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              {note.selected_text && (
                <blockquote className="mb-2 border-l-2 border-cinnabar/40 bg-cinnabar/5 px-3 py-1.5 font-serif text-xs italic leading-relaxed text-foreground/70">
                  {note.selected_text}
                </blockquote>
              )}
              {editingId === note.id ? (
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className="w-full resize-none rounded-sm border border-cinnabar/30 bg-background/50 p-3 font-serif text-sm leading-loose text-foreground focus:outline-none"
                  rows={4}
                />
              ) : (
                <p className="whitespace-pre-wrap font-serif text-sm leading-loose text-foreground/90">
                  {note.content}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
