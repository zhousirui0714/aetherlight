import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { recordError } from "./lib/error-capture";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    // IMPORTANT: never re-throw, otherwise h3 wraps the original error into
    // HTTPError with no stack trace. Always render the error page directly.
    recordError(error);
    const detail =
      error instanceof Error
        ? { message: error.message, stack: error.stack }
        : { message: String(error) };
    // Verbose log so Vercel function logs capture the full original error.
    console.error("[SSR FATAL]\nname:", (error as any)?.name, "\nmessage:", detail.message, "\nstack:\n", detail.stack, "\nraw:", error);
    return new Response(renderErrorPage(detail), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware],
}));
