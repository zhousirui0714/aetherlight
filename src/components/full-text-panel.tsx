import { useState, useEffect, useMemo } from "react";
import { Loader2, BookOpen, Languages, BookText, Sparkles, Quote } from "lucide-react";
import { aiFillArticle } from "@/lib/knowledge-api";
import { toast } from "sonner";

interface VerseLine {
  original: string;
  modern: string;
}

interface AnnotationItem {
  term: string;
  meaning: string;
  source: string;
}

interface FullTextPanelProps {
  articleId: string;
  fullText?: string | null;
  title: string;
  category: string;
  body: string;
}

type TabKey = "text" | "translation" | "annotation";

/**
 * 全文 / 翻译 / 注释面板 — 新中式水墨风
 * - 诗词/典籍 (poems/classics) 优先显示
 * - 翻译/注释通过 AI 懒加载补全
 * - 宣纸底 + 印章标题 + 原文居中 + 译文左右双栏 + 注释加印章
 */
export function FullTextPanel({ articleId, fullText, title, category, body }: FullTextPanelProps) {
  const [tab, setTab] = useState<TabKey>("text");
  const [verseByVerse, setVerseByVerse] = useState<VerseLine[] | null>(null);
  const [overall, setOverall] = useState<string>("");
  const [annotations, setAnnotations] = useState<AnnotationItem[] | null>(null);
  const [loading, setLoading] = useState<"translation" | "annotation" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 切到翻译/注释 tab 时, 懒加载
  useEffect(() => {
    if (tab === "translation" && !verseByVerse && !loading) {
      loadTranslation();
    }
    if (tab === "annotation" && !annotations && !loading) {
      loadAnnotation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const loadTranslation = async () => {
    setLoading("translation");
    setError(null);
    try {
      const res = await aiFillArticle(articleId, ["translation"], {
        title,
        category,
        excerpt: "",
        body,
      });
      const filled = res.filled.translation;
      if (typeof filled === "string") {
        setOverall(filled);
      } else if (filled && typeof filled === "object") {
        setVerseByVerse(filled.verseByVerse || []);
        setOverall(filled.overall || "");
      }
    } catch (err: any) {
      console.error("[translation] failed:", err);
      setError("翻译生成失败，请稍后重试");
      toast("翻译生成失败");
    } finally {
      setLoading(null);
    }
  };

  const loadAnnotation = async () => {
    setLoading("annotation");
    setError(null);
    try {
      const res = await aiFillArticle(articleId, ["annotation"], {
        title,
        category,
        excerpt: "",
        body,
      });
      const filled = res.filled.annotation;
      if (Array.isArray(filled)) {
        setAnnotations(filled);
      } else if (typeof filled === "string") {
        const lines = filled.split("\n").filter((l) => l.trim());
        const items: AnnotationItem[] = lines.map((line) => {
          const m = line.match(/^(.+?)[:：](.+?)[【《](.+?)[】》]\s*$/);
          if (m) return { term: m[1].trim(), meaning: m[2].trim(), source: m[3].trim() };
          return { term: line, meaning: "", source: "" };
        });
        setAnnotations(items);
      }
    } catch (err: any) {
      console.error("[annotation] failed:", err);
      setError("注释生成失败，请稍后重试");
      toast("注释生成失败");
    } finally {
      setLoading(null);
    }
  };

  // 拆行：优先按 \n，其次按 句号/问号/感叹号/分号 切
  const fullTextLines = useMemo(() => {
    if (!fullText) return [];
    const byNewline = fullText.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    if (byNewline.length > 1) return byNewline;
    return fullText
      .split(/(?<=[。！？；])/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [fullText]);

  // 古风/非古风走两种布局
  const isLiterary = category === "poems" || category === "classics";

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[#D9CDB4] shadow-sm"
      style={{
        background:
          "linear-gradient(135deg, #F5F0E2 0%, #EFE6D2 45%, #F0E8D4 100%)",
      }}
    >
      {/* 宣纸纹理 + 极淡印章暗纹 */}
      <BgPaperTexture />
      <BgSealWatermark text={category === "poems" ? "诗" : category === "classics" ? "典" : "文"} />

      <div className="relative z-10 p-6 md:p-8">
        {/* 顶部标题栏：印章式 */}
        <HeaderTitle title={title} category={category} isLiterary={isLiterary} />

        {/* Tabs - 牙牌式 */}
        <div className="mt-5 mb-6 flex flex-wrap items-center gap-2 border-b border-[#D9CDB4]/60 pb-3">
          <TabButton active={tab === "text"} onClick={() => setTab("text")} icon={<BookOpen className="h-3.5 w-3.5" />} label="原文" />
          <TabButton active={tab === "translation"} onClick={() => setTab("translation")} icon={<Languages className="h-3.5 w-3.5" />} label="译注" badge="AI" />
          <TabButton active={tab === "annotation"} onClick={() => setTab("annotation")} icon={<BookText className="h-3.5 w-3.5" />} label="释义" badge="AI" />
          <span className="ml-auto flex items-center gap-1 text-[10px] tracking-widest text-[#8B7355]">
            <Sparkles className="h-3 w-3" /> 溯 · 译
          </span>
        </div>

        {/* content */}
        <div className="min-h-[180px]">
          {tab === "text" && (
            isLiterary ? (
              <LiteraryText title={title} lines={fullTextLines} />
            ) : (
              <PlainText lines={fullTextLines} />
            )
          )}

          {tab === "translation" && (
            <TranslationBlock
              loading={loading === "translation"}
              error={error}
              verseByVerse={verseByVerse}
              overall={overall}
              originalLines={fullTextLines}
            />
          )}

          {tab === "annotation" && (
            <AnnotationBlock
              loading={loading === "annotation"}
              error={error}
              annotations={annotations}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * 顶部标题栏
 * ============================================================ */
function HeaderTitle({
  title,
  category,
  isLiterary,
}: {
  title: string;
  category: string;
  isLiterary: boolean;
}) {
  const catLabel = useMemo(() => {
    const map: Record<string, string> = {
      poems: "诗词",
      classics: "典籍",
      figures: "人物",
      festivals: "节日",
      solarTerms: "节气",
      intangible: "非遗",
      artifacts: "器物",
      lifestyle: "民俗",
      technology: "科技",
      architecture: "建筑",
      mythology: "神话",
      art: "艺术",
      philosophy: "哲学",
      medicine: "医学",
      food: "饮食",
      clothing: "服饰",
    };
    return map[category] || "文录";
  }, [category]);

  return (
    <div className="relative flex items-center justify-center gap-3 py-2">
      {/* 左侧墨线 */}
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#8B7355]/40 to-[#8B7355]/60" />
      {/* 朱砂小印 */}
      <span className="flex items-center gap-2">
        <span className="inline-block h-4 w-4 rotate-3 border border-[#B53A2A] bg-[#B53A2A]/10">
          <span className="block h-full w-full rotate-[-3deg] text-center font-serif text-[10px] leading-4 text-[#B53A2A]">
            {isLiterary ? "古" : "文"}
          </span>
        </span>
        <h3 className="font-serif text-xl font-semibold tracking-[0.3em] text-[#3C2A1E]">
          全文 · 译注
        </h3>
        <span className="inline-block h-4 w-4 rotate-[-3deg] border border-[#B53A2A] bg-[#B53A2A]/10">
          <span className="block h-full w-full rotate-3 text-center font-serif text-[10px] leading-4 text-[#B53A2A]">
            印
          </span>
        </span>
      </span>
      {/* 右侧墨线 */}
      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-[#8B7355]/40 to-[#8B7355]/60" />
      {/* 分类副标 */}
      <span className="absolute -top-1 right-0 text-[10px] tracking-widest text-[#8B7355]">
        · {catLabel} · {title}
      </span>
    </div>
  );
}

/* ============================================================
 * Tabs - 牙牌式
 * ============================================================ */
function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center gap-1.5 rounded-sm border px-3 py-1.5 font-serif text-sm transition-all ${
        active
          ? "border-[#B53A2A]/60 bg-[#B53A2A]/8 text-[#3C2A1E] shadow-[0_1px_0_#B53A2A22]"
          : "border-[#D9CDB4] bg-transparent text-[#8B7355] hover:border-[#8B7355]/60 hover:text-[#3C2A1E]"
      }`}
    >
      {icon}
      <span className="tracking-wider">{label}</span>
      {badge && (
        <span className={`ml-0.5 rounded-sm px-1 text-[9px] tracking-widest ${
          active ? "bg-[#B53A2A] text-white" : "bg-[#8B7355]/15 text-[#8B7355]"
        }`}>
          {badge}
        </span>
      )}
      {active && (
        <span className="absolute -bottom-3 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-[#B53A2A]/60 bg-[#F5F0E2]" />
      )}
    </button>
  );
}

/* ============================================================
 * 古风原文（诗词/典籍）
 * ============================================================ */
function LiteraryText({ title, lines }: { title: string; lines: string[] }) {
  if (lines.length === 0) {
    return <EmptyHint text="该条目暂无全文内容。可在原文摘要中查阅核心信息。" />;
  }
  return (
    <div className="relative">
      {/* 居中竖式标题 */}
      <div className="mb-6 text-center">
        <h4 className="font-serif text-2xl font-semibold tracking-[0.5em] text-[#3C2A1E]">
          {title}
        </h4>
        <div className="mx-auto mt-2 h-px w-24 bg-[#8B7355]/50" />
      </div>

      {/* 诗句行 */}
      <div className="mx-auto max-w-2xl space-y-3 px-2">
        {lines.map((line, idx) => (
          <p
            key={idx}
            className="text-center font-serif text-lg leading-loose tracking-[0.3em] text-[#2C2C2C]"
          >
            {decorateLiteraryLine(line)}
          </p>
        ))}
      </div>

      {/* 落款 */}
      <div className="mt-8 flex items-center justify-end gap-2 pr-4">
        <span className="h-px w-12 bg-[#8B7355]/40" />
        <span className="font-serif text-xs tracking-widest text-[#8B7355]">—  溯光 录  —</span>
      </div>
    </div>
  );
}

function decorateLiteraryLine(line: string) {
  // 保留原始字符 + 句末加淡色小印
  return (
    <>
      <span>{line}</span>
      <span className="ml-1 inline-block align-baseline text-[10px] text-[#B53A2A]/40">·</span>
    </>
  );
}

/* ============================================================
 * 普通原文
 * ============================================================ */
function PlainText({ lines }: { lines: string[] }) {
  if (lines.length === 0) {
    return <EmptyHint text="该条目暂无全文内容。可在原文摘要中查阅核心信息。" />;
  }
  return (
    <div className="relative rounded-md border border-[#D9CDB4]/70 bg-[#FFFBF1]/60 p-5">
      <Quote className="absolute left-2 top-2 h-4 w-4 text-[#8B7355]/30" />
      <Quote className="absolute right-2 bottom-2 h-4 w-4 -scale-x-100 text-[#8B7355]/30" />
      <div className="space-y-3">
        {lines.map((line, idx) => (
          <p
            key={idx}
            className="text-center font-serif text-base leading-loose tracking-wider text-[#2C2C2C]/90 first-letter:text-lg first-letter:tracking-widest"
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
 * 翻译块
 * ============================================================ */
function TranslationBlock({
  loading,
  error,
  verseByVerse,
  overall,
  originalLines,
}: {
  loading: boolean;
  error: string | null;
  verseByVerse: VerseLine[] | null;
  overall: string;
  originalLines: string[];
}) {
  if (loading) {
    return (
      <LoadingBlock text="AI 译注生成中… 溯光正自千年前拾取… " />
    );
  }
  if (error) {
    return <p className="font-serif text-sm text-[#B53A2A]">{error}</p>;
  }

  // verseByVerse 模式：左原文 | 右译文 双栏
  if (verseByVerse && verseByVerse.length > 0) {
    return (
      <div className="space-y-5">
        <div className="relative grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr]">
          <ColumnHeader label="原 文" side="left" />
          <div className="hidden md:block w-px self-stretch bg-gradient-to-b from-transparent via-[#8B7355]/50 to-transparent" />
          <ColumnHeader label="译 注" side="right" />
          <div className="space-y-3">
            {verseByVerse.map((v, i) => (
              <p
                key={i}
                className="text-right font-serif text-base leading-loose tracking-[0.25em] text-[#2C2C2C]"
              >
                {v.original}
              </p>
            ))}
          </div>
          {/* 中间竖线 (md 以下隐藏) */}
          <div className="hidden md:block" />
          <div className="space-y-3 md:border-l md:border-[#D9CDB4] md:pl-5">
            {verseByVerse.map((v, i) => (
              <p
                key={i}
                className="font-serif text-base leading-loose text-[#3C2A1E]/85"
              >
                {v.modern}
              </p>
            ))}
          </div>
        </div>

        {/* 整体意境 — 朱砂栏 */}
        {overall && (
          <div className="relative mt-4 rounded-sm border-l-4 border-[#B53A2A]/60 bg-[#B53A2A]/5 p-4">
            <span className="absolute -left-2 -top-2 inline-block h-5 w-5 rotate-3 border border-[#B53A2A] bg-[#F5F0E2] text-center font-serif text-[10px] leading-5 text-[#B53A2A]">
              境
            </span>
            <p className="mb-1 text-[10px] tracking-[0.4em] text-[#B53A2A]">整体意境 · TOTAL MEANING</p>
            <p className="font-serif text-sm leading-loose text-[#3C2A1E]">{overall}</p>
          </div>
        )}
      </div>
    );
  }

  // 只有 overall 字符串
  if (overall) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-[#D9CDB4] bg-[#FFFBF1]/60 p-5">
          <p className="whitespace-pre-line font-serif text-base leading-loose text-[#3C2A1E]">
            {overall}
          </p>
        </div>
        {originalLines.length > 0 && (
          <details className="group rounded-md border border-[#D9CDB4]/70 bg-transparent p-3">
            <summary className="cursor-pointer font-serif text-xs tracking-widest text-[#8B7355] hover:text-[#3C2A1E]">
              ·  对照原文  ·
            </summary>
            <div className="mt-3 space-y-2 border-t border-[#D9CDB4]/60 pt-3">
              {originalLines.map((l, i) => (
                <p key={i} className="text-center font-serif text-sm leading-loose tracking-widest text-[#2C2C2C]/80">
                  {l}
                </p>
              ))}
            </div>
          </details>
        )}
      </div>
    );
  }

  return <EmptyHint text="暂无翻译。可点击上方「译注」tab 由 AI 生成。" />;
}

function ColumnHeader({ label, side }: { label: string; side: "left" | "right" }) {
  return (
    <div className={`flex items-center gap-2 ${side === "right" ? "md:pl-5" : ""}`}>
      <span className="h-px flex-1 bg-[#8B7355]/40" />
      <span className="font-serif text-[10px] tracking-[0.4em] text-[#8B7355]">{label}</span>
      <span className="h-px w-3 bg-[#8B7355]/40" />
    </div>
  );
}

/* ============================================================
 * 注释块 - 印章式条目
 * ============================================================ */
function AnnotationBlock({
  loading,
  error,
  annotations,
}: {
  loading: boolean;
  error: string | null;
  annotations: AnnotationItem[] | null;
}) {
  if (loading) {
    return <LoadingBlock text="AI 注释生成中… 古人辞章正自卷帙间醒来… " />;
  }
  if (error) {
    return <p className="font-serif text-sm text-[#B53A2A]">{error}</p>;
  }
  if (!annotations || annotations.length === 0) {
    return <EmptyHint text="暂无释义。可点击上方「释义」tab 由 AI 生成。" />;
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {annotations.map((a, idx) => (
        <div
          key={idx}
          className="group relative rounded-md border border-[#D9CDB4] bg-[#FFFBF1]/70 p-4 transition-all hover:border-[#8B7355]/60 hover:shadow-sm"
        >
          {/* 印章式词条 */}
          <div className="mb-2 flex items-start gap-2">
            <span className="inline-flex shrink-0 items-center justify-center border border-[#B53A2A] bg-[#B53A2A]/8 px-2 py-0.5 font-serif text-sm font-semibold tracking-widest text-[#B53A2A]">
              {a.term}
            </span>
            {a.source && (
              <span className="rounded-sm border border-[#8B7355]/40 bg-transparent px-1.5 py-0.5 text-[10px] tracking-widest text-[#8B7355]">
                出自《{a.source}》
              </span>
            )}
          </div>

          {/* 释义正文 */}
          {a.meaning && (
            <p className="font-serif text-sm leading-loose text-[#3C2A1E]/85">
              {a.meaning}
            </p>
          )}

          {/* 编号水印 */}
          <span className="absolute bottom-1 right-2 font-serif text-[10px] text-[#8B7355]/30">
            · {String(idx + 1).padStart(2, "0")}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
 * 公共小组件
 * ============================================================ */
function EmptyHint({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-10">
      <p className="font-serif text-sm italic text-[#8B7355]">{text}</p>
    </div>
  );
}

function LoadingBlock({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center py-10">
      <Loader2 className="h-5 w-5 animate-spin text-[#8B7355]" />
      <p className="mt-3 font-serif text-xs tracking-widest text-[#8B7355]">{text}</p>
    </div>
  );
}

/* ============================================================
 * 背景纹理 - 宣纸
 * ============================================================ */
function BgPaperTexture() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.18]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <filter id="paper-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" />
        <feColorMatrix
          values="0 0 0 0 0.55
                  0 0 0 0 0.45
                  0 0 0 0 0.35
                  0 0 0 0.15 0"
        />
      </filter>
      <rect width="100%" height="100%" filter="url(#paper-grain)" />
    </svg>
  );
}

/* ============================================================
 * 背景印章暗纹
 * ============================================================ */
function BgSealWatermark({ text }: { text: string }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -right-6 -top-4 z-0 select-none text-[120px] font-serif font-bold text-[#B53A2A] opacity-[0.05]"
      style={{ writingMode: "vertical-rl", letterSpacing: "0.1em" }}
    >
      {text}
    </span>
  );
}
