import { SectionHeading } from "./section-heading";
import { BookMarked } from "lucide-react";

interface ReferencesBlockProps {
  sources: string[];
  title?: string;
  accent?: string;
  watermark?: string;
}

/**
 * 参考来源 — 列出引用文献
 */
export function ReferencesBlock({
  sources,
  title = "参考来源",
  accent = "var(--color-cinnabar)",
  watermark = "源",
}: ReferencesBlockProps) {
  if (!sources || sources.length === 0) return null;
  return (
    <section className="mb-8">
      <SectionHeading icon={BookMarked} title={title} watermark={watermark} accent={accent} />
      <div className="rounded-xl border border-border bg-card/60 p-5">
        <ol className="space-y-2.5">
          {sources.map((s, i) => (
            <li
              key={i}
              className="flex items-start gap-3 font-serif text-sm leading-relaxed text-foreground/80"
            >
              <span
                aria-hidden
                className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm font-serif text-[10px] font-bold text-white"
                style={{ background: accent }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
