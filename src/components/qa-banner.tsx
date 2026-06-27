import { Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight } from "lucide-react";

export function QABanner() {
  return (
    <section className="mt-24">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-8 py-10 md:px-14 md:py-12">
        <div aria-hidden className="absolute inset-0 opacity-60" style={{
          background:
            "radial-gradient(circle at 10% 50%, color-mix(in oklab, var(--color-cinnabar) 14%, transparent), transparent 45%), radial-gradient(circle at 90% 50%, color-mix(in oklab, var(--color-bronze) 14%, transparent), transparent 45%)",
        }} />
        <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-serif text-2xl text-foreground md:text-3xl">有问必答 · 溯源问道</h3>
              <p className="mt-1.5 text-sm text-muted-foreground md:text-base">
                诗词、节气、典籍、人物…向 AI 雅士请教，每一答皆有出处可循。
              </p>
            </div>
          </div>
          <Link
            to="/chat"
            className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-serif text-sm tracking-[0.25em] text-primary-foreground transition hover:opacity-90"
          >
            去提问
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
