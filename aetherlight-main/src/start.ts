import { createStart, createMiddleware } from "@tanstack/react-start";
import { renderErrorPage } from "./lib/error-page";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(
      "[SSR FATAL]\nname:", (error as any)?.name,
      "\nmessage:", (error as any)?.message,
      "\nstack:\n", (error as any)?.stack,
      "\nraw:", error,
    );
    const detail = error instanceof Error
      ? { message: error.message, stack: error.stack }
      : { message: String(error) };
    return new Response(renderErrorPage(detail), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// NOTE: `attachSupabaseAuth` removed from functionMiddleware. It is
// declared as `.client()` so it never runs on the server, but the
// top-level import pulls in `@/integrations/supabase/client` which
// is a Proxy that throws when the Supabase env vars are missing.
// On Vercel, this can turn into a 500 on every request. The
// supabase-js client attaches the bearer token itself when a
// session exists, so the server-side middleware is not needed.

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware],
}));
