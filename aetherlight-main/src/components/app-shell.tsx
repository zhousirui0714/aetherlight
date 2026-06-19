import type { ReactNode } from "react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

interface Props {
  children: ReactNode;
  /** if true, children render full width (with own container); otherwise wrapped in 1200px container */
  fullBleed?: boolean;
  /** legacy props (ignored) */
  title?: string;
  showSearch?: boolean;
}

export function AppShell({ children, fullBleed = false }: Props) {
  return (
    <div className="flex min-h-screen flex-col paper-texture">
      <SiteHeader />
      <main className="flex-1">
        {fullBleed ? children : (
          <div className="mx-auto w-full max-w-[1200px] px-6 py-10">{children}</div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
