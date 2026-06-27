// Captures the original Error out-of-band so server.ts can recover the stack
// when h3 has already swallowed the throw into a generic 500 Response.

let lastCapturedError: { error: unknown; at: number } | undefined;
const TTL_MS = 30_000; // long enough to span SSR + middleware roundtrip

function record(error: unknown) {
  lastCapturedError = { error, at: Date.now() };
  // Also push to Vercel Function Logs so the user can grep for the
  // original message even when consumeLastCapturedError loses the
  // race against h3's envelope.
  try {
    const err = error as any;
    process.stdout.write(
      `[captured-error] ${err?.name ?? "Error"}: ${err?.message ?? String(error)}\n` +
        (err?.stack ? `${err.stack}\n` : ""),
    );
  } catch {
    // ignore stdout failures
  }
}

// On Node, register process-level handlers so that errors thrown outside
// the TanStack Start middleware chain (e.g. during getEntries() import,
// async router setup, or any rejected promise that escapes the
// request handler) are still captured.
if (typeof process !== "undefined" && process.on) {
  process.on("uncaughtException", record);
  process.on("unhandledRejection", record);
}
if (typeof globalThis !== "undefined" && typeof (globalThis as any).addEventListener === "function") {
  (globalThis as any).addEventListener("error", (event: any) => record(event?.error ?? event));
  (globalThis as any).addEventListener("unhandledrejection", (event: any) => record(event?.reason));
}

// Monkey-patch h3's onError. h3 catches errors thrown inside the route
// handler in a try/catch and converts them into a {"status":500,
// "unhandled":true,"message":"HTTPError"} Response. The original error
// is never re-thrown, so process.on('uncaughtException') never sees it
// and our middleware try/catch only sees a normal 500 Response.
//
// Nitro exposes the h3 app instance at globalThis.__nitro__.default.h3
// (set in node_modules/nitro/dist/runtime/internal/app.mjs). We grab
// it here, before any request is handled, and wrap its onError so the
// real error message is preserved.
function installH3OnErrorHook(): void {
  const g = globalThis as any;
  // Poll briefly: ssr.mjs (this file) is loaded as a lazy service from
  // index.mjs, so __nitro__ may not be set yet on the very first cold
  // start. We retry for up to 3 seconds.
  const deadline = Date.now() + 3_000;
  const tryInstall = () => {
    const nitroApp = g.__nitro__?.default;
    const h3 = nitroApp?.h3;
    if (!h3) {
      if (Date.now() < deadline) setTimeout(tryInstall, 50);
      return;
    }
    // h3 stores the handler in `h3.config.onError` (see h3 source).
    // We also try `h3._onError` as a fallback for older h3 versions.
    const configObj: any = h3.config ?? h3;
    const original = configObj.onError ?? h3._onError;
    const wrapped = (error: unknown, event: unknown) => {
      record(error);
      return typeof original === "function" ? original(error, event) : undefined;
    };
    try {
      configObj.onError = wrapped;
    } catch {
      // config may be a getter-only object; try the alternate slot
      try {
        h3._onError = wrapped;
      } catch {
        process.stdout.write(
          "[h3-hook] could not override onError — falling back to log only\n",
        );
      }
    }
    process.stdout.write("[h3-hook] installed onError capture\n");
  };
  tryInstall();
}
installH3OnErrorHook();

export function consumeLastCapturedError(): unknown {
  if (!lastCapturedError) return undefined;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = undefined;
    return undefined;
  }
  const { error } = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}
