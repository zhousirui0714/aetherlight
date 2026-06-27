import "./lib/error-capture";
import { consumeLastCapturedError, recordError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

function detailFromError(error: unknown): { message: string; stack?: string } {
  const e = error as any;
  const candidates = [
    e,
    e?.cause,
    e?.data,
    e?.data?.cause,
    e?.data?.data,
    e?.reason,
    e?.error,
  ];
  for (const c of candidates) {
    if (c instanceof Error && c.stack) {
      return { message: c.message, stack: c.stack };
    }
  }
  for (const c of candidates) {
    if (c && typeof c === "object" && c.message) {
      return { message: String(c.message) };
    }
  }
  if (typeof error === "string") return { message: error };
  return { message: JSON.stringify(error).slice(0, 500) };
}

async function normalizeCatastrophicSsrResponse(
  response: Response,
  requestId: string,
): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  const captured = consumeLastCapturedError();
  const capturedDetail = captured ? detailFromError(captured) : undefined;
  // Verbose: log the full h3 errorResponse body so Vercel function logs
  // capture every detail (Vercel surfaces these in the Functions tab).
  console.error(
    `[SSR ${requestId}] 5xx JSON response from handler.fetch:\n` +
      `--- status: ${response.status}\n` +
      `--- body: ${body}\n` +
      `--- captured: ${capturedDetail ? JSON.stringify(capturedDetail) : "<none>"}\n` +
      `--- raw captured: ${captured ? String(captured) : "<none>"}`,
  );
  const detail = capturedDetail ?? {
    message: "h3 swallowed SSR error: " + body,
  };
  return new Response(renderErrorPage(detail), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const requestId = Math.random().toString(36).slice(2, 8);
    console.error(
      `[SSR ${requestId}] incoming:`,
      request.method,
      new URL(request.url).pathname,
    );
    let handler: ServerEntry;
    try {
      handler = await getServerEntry();
    } catch (importErr) {
      recordError(importErr);
      const detail = detailFromError(importErr);
      console.error(
        `[SSR ${requestId}] import server-entry failed:`,
        detail.message,
        detail.stack,
        "\nraw:",
        importErr,
      );
      return new Response(renderErrorPage(detail), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
    try {
      const response = await handler.fetch(request, env, ctx);
      console.error(
        `[SSR ${requestId}] handler returned status=${response.status} content-type=${response.headers.get("content-type")}`,
      );
      const normalized = await normalizeCatastrophicSsrResponse(
        response,
        requestId,
      );
      if (normalized !== response) {
        console.error(`[SSR ${requestId}] normalized 5xx JSON -> HTML error page`);
      }
      return normalized;
    } catch (error) {
      recordError(error);
      const detail = detailFromError(error);
      console.error(
        `[SSR ${requestId} outer catch]`,
        detail.message,
        detail.stack,
        "\nraw:",
        error,
      );
      return new Response(renderErrorPage(detail), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
