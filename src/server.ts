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

// Intercept the response stream so we can capture errors that happen
// during streaming (which happen AFTER the middleware chain has already
// returned a response). We replace the stream with one that catches
// errors in pull() and converts them into a fresh error-page response.
function wrapStreamForErrorCapture(response: Response, label: string): Response {
  if (!response.body) return response;
  const originalBody = response.body;
  const reader = originalBody.getReader();
  const stream = new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        controller.enqueue(value);
      } catch (err) {
        recordError(err);
        const detail = detailFromError(err);
        console.error(`[SSR ${label} stream pull error]`, detail.message, detail.stack, "\nraw:", err);
        try {
          controller.close();
        } catch {}
        // We can't replace the response here, so re-throw — h3 will turn it
          // into its own 500, but at least the console.error captures the cause.
        throw err;
      }
    },
    cancel(reason) {
      reader.cancel(reason).catch(() => {});
    },
  });
  return new Response(stream, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  const captured = consumeLastCapturedError();
  const detail = captured
    ? detailFromError(captured)
    : { message: "h3 swallowed SSR error: " + body };
  console.error("[SSR normalized]", detail.message, (detail as any).stack);
  return new Response(renderErrorPage(detail), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const requestId = Math.random().toString(36).slice(2, 8);
    console.error(`[SSR ${requestId}] incoming:`, request.method, new URL(request.url).pathname);
    try {
      const handler = await getServerEntry();
      console.error(`[SSR ${requestId}] got handler, calling fetch`);
      const response = await handler.fetch(request, env, ctx);
      console.error(`[SSR ${requestId}] handler returned status=${response.status}`);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      if (normalized !== response) {
        console.error(`[SSR ${requestId}] normalized to error page`);
      }
      return wrapStreamForErrorCapture(normalized, requestId);
    } catch (error) {
      recordError(error);
      const detail = detailFromError(error);
      console.error(`[SSR ${requestId} outer catch]`, detail.message, detail.stack, "\nraw:", error);
      return new Response(renderErrorPage(detail), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
