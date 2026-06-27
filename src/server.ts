import { consumeLastCapturedError, recordError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;
let serverEntryImportError: unknown = undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (serverEntryImportError) throw serverEntryImportError;
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry")
      .then((m) => (m.default ?? m) as ServerEntry)
      .catch((err) => {
        serverEntryPromise = undefined;
        serverEntryImportError = err;
        throw err;
      });
  }
  return serverEntryPromise;
}

function detailFromError(error: unknown): { message: string; stack?: string; name?: string; code?: string; cause?: unknown } {
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
    if (c instanceof Error) {
      const out: { message: string; stack?: string; name?: string; code?: string; cause?: unknown } = {
        message: c.message,
        name: c.name,
        stack: c.stack,
      };
      const code = (c as any).code;
      if (typeof code === "string") out.code = code;
      if (c.cause) out.cause = c.cause;
      return out;
    }
  }
  for (const c of candidates) {
    if (c && typeof c === "object") {
      const obj = c as any;
      return {
        message: obj.message ? String(obj.message) : JSON.stringify(c).slice(0, 500),
        name: obj.name,
        code: obj.code,
        cause: obj.cause,
      };
    }
  }
  if (typeof error === "string") return { message: error };
  return { message: JSON.stringify(error).slice(0, 500) };
}

// Aggressive wrapper: if the handler returns a 5xx response with
// `application/json` body that looks like h3's errorResponse, we have
// no way to read the original error (h3 already wrapped and discarded
// it). But we can dump the FULL response body to the HTML page so
// the user can see exactly what h3 produced.
async function normalize5xx(response: Response, requestId: string): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  if (!isJson) return response;
  const body = await response.clone().text();
  const captured = consumeLastCapturedError();
  const capturedDetail = captured ? detailFromError(captured) : undefined;
  const isH3ErrorEnvelope =
    body.includes('"unhandled":true') || body.includes('"message":"HTTPError"');
  console.error(
    `[SSR ${requestId}] 5xx ${response.status} ${contentType} ` +
      `body.length=${body.length} isH3ErrorEnvelope=${isH3ErrorEnvelope} ` +
      `captured=${capturedDetail ? JSON.stringify(capturedDetail).slice(0, 200) : "<none>"}`,
  );
  console.error(`[SSR ${requestId}] h3 body: ${body}`);
  if (capturedDetail) {
    return new Response(renderErrorPage(capturedDetail), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
  // Build a synthetic error from the h3 envelope itself, then dump
  // the full body alongside it so we have the most possible context.
  const detail = isH3ErrorEnvelope
    ? {
        message: "h3 swallowed the original SSR error and replaced it with this generic envelope. The real error message was lost when h3 wrapped the thrown value into an HTTPError. The body that came back is below.",
        ...{ h3Body: body },
      }
    : { message: body };
  return new Response(renderErrorPage(detail), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const requestId = Math.random().toString(36).slice(2, 8);
    console.error(
      `[SSR ${requestId}] incoming ${request.method} ${new URL(request.url).pathname}`,
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
      return await normalize5xx(response, requestId);
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
