import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
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
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  return { message: String(error) };
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires
// for those. So we look for the h3 error envelope after-the-fact and
// pull whatever globalThis-level error capture caught.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  const captured = consumeLastCapturedError();
  const capturedDetail = captured ? detailFromError(captured) : undefined;
  const isH3ErrorEnvelope =
    body.includes('"unhandled":true') || body.includes('"message":"HTTPError"');

  if (capturedDetail) {
    return new Response(renderErrorPage(capturedDetail), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
  if (isH3ErrorEnvelope) {
    return new Response(
      renderErrorPage({
        message:
          "h3 swallowed the original SSR error and replaced it with this generic envelope. " +
          "The real error message was lost when h3 wrapped the thrown value into an HTTPError. " +
          "The body that came back is below.",
        stack: body,
      }),
      {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      },
    );
  }
  return new Response(renderErrorPage({ message: body }), {
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
      const detail = detailFromError(error);
      console.error(error);
      return new Response(renderErrorPage(detail), {
        status: 500,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      });
    }
  },
};
