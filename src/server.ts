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
  // h3 wraps thrown errors into H3Error. The original cause lives in .cause or
  // .data depending on h3 version. Walk down to find an Error with a stack.
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
      return normalized;
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
