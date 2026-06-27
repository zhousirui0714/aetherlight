import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { trackEvent } from "@/lib/journey-storage";

interface Props {
  articleId: string;
  /** 已知字段, 用于即时计算完整度, 避免拉 API */
  known?: {
    hasCover?: boolean;
    hasExcerpt?: boolean;
    hasBody?: boolean;
    hasHistory?: boolean;
    hasInfluence?: boolean;
    hasFaq?: boolean;
    hasRelatedPeople?: boolean;
  };
  /** 当 known 缺失时, 客户端 fetch 完整度 */
  fetchOnMount?: boolean;
}

const FIELDS = [
  { key: "hasCover", label: "封面" },
  { key: "hasExcerpt", label: "摘要" },
  { key: "hasBody", label: "正文" },
  { key: "hasHistory", label: "历史" },
  { key: "hasInfluence", label: "影响" },
  { key: "hasFaq", label: "问答" },
  { key: "hasRelatedPeople", label: "人物" },
] as const;

/**
 * 内容完整度徽章
 * - A: ≥90% (绿)
 * - B: 70-89% (蓝)
 * - C: 50-69% (黄)
 * - D: <50% (红)
 * 点击可下钻展开详情
 */
export function CompletenessBadge({ articleId, known, fetchOnMount = true }: Props) {
  const [detected, setDetected] = useState<typeof known>(known);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (known || !fetchOnMount) return;
    // 拉 audit-content.json 客户端版 (按需)
    fetch("/api/content-audit?id=" + articleId)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.present) setDetected(d.present);
      })
      .catch(() => {});
  }, [articleId, known, fetchOnMount]);

  if (!detected) return null;

  const filled = FIELDS.filter((f) => detected[f.key as keyof typeof detected]).length;
  const total = FIELDS.length;
  const pct = Math.round((filled / total) * 100);
  const grade: "A" | "B" | "C" | "D" =
    pct >= 90 ? "A" : pct >= 70 ? "B" : pct >= 50 ? "C" : "D";
  const color = {
    A: "bg-emerald-100 text-emerald-800 border-emerald-300",
    B: "bg-sky-100 text-sky-800 border-sky-300",
    C: "bg-amber-100 text-amber-800 border-amber-300",
    D: "bg-rose-100 text-rose-800 border-rose-300",
  }[grade];

  const handleClick = () => {
    setOpen((o) => !o);
    trackEvent({
      type: "completeness_badge_click",
      articleId,
      grade,
      pct,
    });
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium tracking-wider transition hover:opacity-80 ${color}`}
        title={`内容完整度 ${pct}%`}
      >
        {pct === 100 ? (
          <CheckCircle2 className="h-3 w-3" />
        ) : pct < 50 ? (
          <AlertCircle className="h-3 w-3" />
        ) : (
          <Sparkles className="h-3 w-3" />
        )}
        <span>完整度 {grade} · {filled}/{total}</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1.5 w-60 rounded-lg border border-border bg-card p-3 text-xs shadow-lg">
          <div className="mb-2 font-serif text-sm text-foreground">内容完整度 {pct}%</div>
          <ul className="space-y-1">
            {FIELDS.map((f) => {
              const ok = detected[f.key as keyof typeof detected];
              return (
                <li key={f.key} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{f.label}</span>
                  {ok ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <span className="text-rose-600">缺</span>
                  )}
                </li>
              );
            })}
          </ul>
          {pct < 90 && (
            <a
              href={`/chat?q=请补充「` + (typeof window !== "undefined" ? document.title : "") + `」缺失字段`}
              className="mt-3 block rounded-md bg-primary/10 px-2 py-1.5 text-center text-[10px] text-primary hover:bg-primary/20"
            >
              帮忙补全 →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
