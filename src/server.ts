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
  // h3 wraps thrown errors into H3Error (a.k.a. HTTPError). The original cause
  // is on `.cause` (h3 v1) or `.data`/`reason` depending on version.
  const e = error as any;
  const original = e?.cause ?? e?.data?.cause ?? e?.data ?? e;
  if (original instanceof Error) {
    return { message: original.message, stack: original.stack };
  }
  if (original && typeof original === "object") {
    return { message: JSON.stringify(original) };
  }
  return { message: String(error) };
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
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      recordError(error); // make sure the error is captured even on this code path
      const detail = detailFromError(error);
      console.error("[SSR outer catch]", detail.message, detail.stack);
      return new Response(renderErrorPage(detail), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
