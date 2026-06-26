import { SectionHeading } from "./section-heading";
import { GitBranch } from "lucide-react";

export interface ProcessStep {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  /** 高亮 — 当前文章在流程中的位置 */
  highlight?: boolean;
}

interface ProcessFlowProps {
  steps: ProcessStep[];
  title?: string;
  accent?: string;
  watermark?: string;
  /** 横向 (default) / 纵向 (vertical) */
  direction?: "horizontal" | "vertical";
}

/**
 * 工艺/思想/原理 流程图
 * - 横向：适合工艺步骤、阅读顺序
 * - 纵向：适合层层递进思想
 */
export function ProcessFlow({
  steps,
  title = "流程",
  accent = "var(--color-cinnabar)",
  watermark = "序",
  direction = "horizontal",
}: ProcessFlowProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <section className="mb-8">
      <SectionHeading icon={GitBranch} title={title} watermark={watermark} accent={accent} />
      {direction === "horizontal" ? (
        <div className="relative overflow-x-auto pb-2">
          <div className="flex min-w-max items-stretch gap-3">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-stretch">
                <div
                  className={`group relative w-44 rounded-xl border p-4 transition-all ${
                    step.highlight
                      ? "shadow-md"
                      : "border-border hover:border-foreground/20"
                  }`}
                  style={
                    step.highlight
                      ? {
                          borderColor: accent,
                          background: `color-mix(in oklab, ${accent} 6%, var(--color-card))`,
                        }
                      : undefined
                  }
                >
                  {/* 编号章 */}
                  <span
                    className="absolute -left-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-serif font-bold"
                    style={{
                      borderColor: accent,
                      background: step.highlight ? accent : "var(--color-paper)",
                      color: step.highlight ? "white" : accent,
                    }}
                  >
                    {idx + 1}
                  </span>
                  {step.icon && (
                    <div className="mb-2 flex h-7 items-center gap-1" style={{ color: accent }}>
                      {step.icon}
                    </div>
                  )}
                  <h4 className="font-serif text-sm font-semibold leading-snug text-foreground">
                    {step.title}
                  </h4>
                  {step.description && (
                    <p className="mt-1.5 font-serif text-xs leading-relaxed text-foreground/70">
                      {step.description}
                    </p>
                  )}
                </div>
                {/* 连接箭头 */}
                {idx < steps.length - 1 && (
                  <div className="flex items-center px-1">
                    <span
                      className="block h-px w-6"
                      style={{ background: `color-mix(in oklab, ${accent} 50%, transparent)` }}
                    />
                    <span
                      className="font-serif text-sm"
                      style={{ color: `color-mix(in oklab, ${accent} 70%, transparent)` }}
                    >
                      ▸
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {steps.map((step, idx) => (
            <div key={idx} className="flex gap-3">
              <div className="flex flex-col items-center pt-1">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-serif font-bold"
                  style={{
                    borderColor: accent,
                    background: step.highlight ? accent : "var(--color-paper)",
                    color: step.highlight ? "white" : accent,
                  }}
                >
                  {idx + 1}
                </span>
                {idx < steps.length - 1 && (
                  <span
                    className="mt-1 h-full w-px"
                    style={{ background: `color-mix(in oklab, ${accent} 30%, transparent)`, minHeight: "20px" }}
                  />
                )}
              </div>
              <div
                className={`flex-1 rounded-lg border p-3 transition ${
                  step.highlight ? "shadow-sm" : "border-border"
                }`}
                style={
                  step.highlight
                    ? { borderColor: accent, background: `color-mix(in oklab, ${accent} 5%, var(--color-card))` }
                    : undefined
                }
              >
                <h4 className="font-serif text-sm font-semibold text-foreground">{step.title}</h4>
                {step.description && (
                  <p className="mt-1 font-serif text-sm leading-relaxed text-foreground/75">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
