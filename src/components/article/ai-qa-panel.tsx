import { useState, useRef, useEffect } from "react";
import { SectionHeading } from "./section-heading";
import { MessageCircle, Send, Loader2, Sparkles, User } from "lucide-react";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

interface AiQAPanelProps {
  articleId: string;
  articleTitle: string;
  articleExcerpt: string;
  articleCategory: string;
  /** 知识图谱的 context（可选） */
  context?: string;
  accent?: string;
  /** 预设问题 */
  presetQuestions?: string[];
}

/**
 * 详情页 AI 问答 — 流式调用 /api/chat (Qwen)
 * - 不需要 chat UI 的复杂度，但有 RAG 能力
 * - 失败降级到普通提示
 */
export function AiQAPanel({
  articleId,
  articleTitle,
  articleExcerpt,
  articleCategory,
  context,
  accent = "var(--color-cinnabar)",
  presetQuestions,
}: AiQAPanelProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // 默认预设问题
  const defaultPresets: Record<string, string[]> = {
    figures: [
      `${articleTitle} 最著名的代表作是？`,
      `${articleTitle} 对后世有什么影响？`,
      `${articleTitle} 与谁齐名？`,
    ],
    poems: [
      `请赏析这首作品`,
      `${articleTitle} 的创作背景是什么？`,
      `作者还有哪些类似作品？`,
    ],
    classics: [
      `${articleTitle} 的核心思想是什么？`,
      `如何理解 ${articleTitle} 的开篇？`,
      `${articleTitle} 与其他经典的关系？`,
    ],
    festivals: [
      `${articleTitle} 的来历与传说？`,
      `${articleTitle} 有哪些传统习俗？`,
      `${articleTitle} 的饮食文化？`,
    ],
    mythology: [
      `${articleTitle} 的故事梗概？`,
      `${articleTitle} 中主要人物？`,
      `${articleTitle} 的象征意义？`,
    ],
    intangible: [
      `${articleTitle} 的工艺特点？`,
      `${articleTitle} 的代表传承人？`,
      `${articleTitle} 的现状？`,
    ],
    artifacts: [
      `${articleTitle} 的建筑结构？`,
      `${articleTitle} 的历史沿革？`,
      `${articleTitle} 的文化地位？`,
    ],
    lifestyle: [
      `${articleTitle} 的起源？`,
      `${articleTitle} 在不同地区的差异？`,
      `现代如何体验 ${articleTitle}？`,
    ],
    philosophy: [
      `${articleTitle} 的核心思想？`,
      `${articleTitle} 与其他流派对比？`,
      `${articleTitle} 的现实应用？`,
    ],
    technology: [
      `${articleTitle} 的工作原理？`,
      `${articleTitle} 的发明者？`,
      `${articleTitle} 对世界的影响？`,
    ],
  };
  const presets = presetQuestions || defaultPresets[articleCategory] || [
    `请介绍 ${articleTitle}`,
    `${articleTitle} 有哪些亮点？`,
    `${articleTitle} 的相关知识？`,
  ];

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMsg = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      // 复用现有 /api/chat 流式接口
      const ctxText = context || articleExcerpt;
      const fullQuestion = `关于「${articleTitle}」（${articleCategory}）：${text}\n\n相关背景：${ctxText?.slice(0, 300) || ""}`;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { id: "1", role: "user", parts: [{ type: "text", text: fullQuestion }] },
          ],
        }),
      });
      if (!res.ok || !res.body) throw new Error("chat failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulated = "";
      // 初始化一个空 assistant 消息
      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      let firstChunk = true;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // 兼容 Vercel AI SDK 的 data: 流
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("0:")) {
            // text delta
            const text = JSON.parse(line.slice(2));
            accumulated += text;
            if (firstChunk) {
              setMessages((m) => {
                const arr = [...m];
                if (arr[arr.length - 1]?.role === "assistant") {
                  arr[arr.length - 1] = { role: "assistant", content: accumulated };
                }
                return arr;
              });
              firstChunk = false;
            } else {
              setMessages((m) => {
                const arr = [...m];
                if (arr[arr.length - 1]?.role === "assistant") {
                  arr[arr.length - 1] = { role: "assistant", content: accumulated };
                }
                return arr;
              });
            }
          }
        }
      }
      if (!accumulated) {
        throw new Error("empty response");
      }
    } catch (err) {
      // 失败：给出友好降级
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `（AI 暂不可用）关于「${articleTitle}」，建议参考知识图谱中的关联条目，或前往「深入了解」与 AI 雅士对话。`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mb-8">
      <SectionHeading
        icon={MessageCircle}
        title="AI 问答"
        subtitle="ASK AI"
        watermark="问"
        accent={accent}
        trailing={
          <span className="font-serif text-[10px] tracking-widest text-muted-foreground">
            基于 {articleCategory}
          </span>
        }
      />
      <div
        className="rounded-2xl border border-border bg-card"
        style={{ minHeight: 200 }}
      >
        {/* 消息列表 */}
        <div
          ref={scrollerRef}
          className="max-h-[400px] space-y-3 overflow-y-auto p-5"
        >
          {messages.length === 0 ? (
            <div className="py-6 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-muted-foreground/30" />
              <p className="mt-2 font-serif text-sm text-muted-foreground">
                向 AI 雅士请教关于「{articleTitle}」的问题
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {presets.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => send(q)}
                    disabled={loading}
                    className="rounded-full border border-border bg-background px-3 py-1.5 font-serif text-xs text-muted-foreground transition hover:border-foreground/30 hover:text-foreground disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2.5 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <span
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ background: accent }}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 font-serif text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-foreground/90 text-background"
                      : "bg-secondary/60 text-foreground"
                  }`}
                >
                  {msg.content || (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>AI 正在回答…</span>
                    </span>
                  )}
                </div>
                {msg.role === "user" && (
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
            ))
          )}
        </div>
        {/* 输入区 */}
        <div className="flex items-center gap-2 border-t border-border p-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder={`向 AI 雅士请教关于「${articleTitle}」…`}
            disabled={loading}
            className="flex-1 rounded-full border border-border bg-background px-4 py-2 font-serif text-sm outline-none transition focus:border-foreground/40"
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
            style={{ background: accent }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </section>
  );
}
