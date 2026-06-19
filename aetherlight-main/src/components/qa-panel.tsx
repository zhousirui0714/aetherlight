import { useEffect, useRef, useState } from "react";
import { askQuestionStream, AskParams, QAStreamEvent } from "@/api/knowledge";
import { Send } from "lucide-react";

export default function QAQuestionsPanel() {
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Array<{ title: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  const controllerRef = useRef<{ cancel?: () => void } | null>(null);

  useEffect(() => {
    return () => {
      // cleanup if unmounted while streaming
      if (controllerRef.current?.cancel) controllerRef.current.cancel();
    };
  }, []);

  const submit = async (q: string) => {
    if (!q.trim() || streaming) return;
    setAnswer("");
    setSources([]);
    setError(null);
    setStreaming(true);

    const gen = askQuestionStream({ question: q } as AskParams);
    controllerRef.current = { cancel: () => { /* no-op for now */ } };

    try {
      for await (const ev of gen as AsyncGenerator<QAStreamEvent>) {
        if (ev.type === "retrieved") {
          setSources(ev.chunks.map((c) => ({ title: c.source })));
        } else if (ev.type === "delta") {
          setAnswer((s) => s + ev.content);
        } else if (ev.type === "done") {
          setStreaming(false);
        } else if (ev.type === "error") {
          setError(ev.message || "未知错误");
          setStreaming(false);
        }
      }
    } catch (err: any) {
      setError(err?.message || String(err));
      setStreaming(false);
    }
  };

  return (
    <div className="mb-6 rounded-2xl border border-border bg-background/30 p-4">
      <h3 className="mb-3 font-serif text-lg">知识问答（RAG）</h3>

      <div className="mb-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={2}
          placeholder="请输入问题，例如：'端午节的由来是什么？'"
          className="w-full resize-none rounded-md bg-card px-3 py-2 text-sm outline-none"
        />
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={() => { submit(input); setInput(""); }}
            disabled={streaming || !input.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-40"
          >
            <Send className="h-4 w-4" /> 提问
          </button>
          {streaming && <span className="text-sm text-muted-foreground">生成中…</span>}
          {error && <span className="text-sm text-destructive">{error}</span>}
        </div>
      </div>

      <div className="min-h-[80px] rounded-md border border-border bg-card p-3 text-sm whitespace-pre-wrap">
        {answer || <span className="text-muted-foreground">答案将实时展示在此处（流式）</span>}
      </div>

      {sources.length > 0 && (
        <div className="mt-3 text-xs text-muted-foreground">
          检索到来源：{sources.map((s) => s.title).join("；")}
        </div>
      )}
    </div>
  );
}
