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

// Wrap console.error. h3 v2 calls console.error(error) at the very top
// of its error path (see _libs/h3+rou3+srvx.mjs around line 436) BEFORE
// it looks up config.onError, so this is the most reliable place to
// grab the original error before it is wrapped into a generic
// {"status":500,"unhandled":true,"message":"HTTPError"} envelope.
//
// We only act when the first arg is an actual Error instance (or
// something that looks like one) so we don't interfere with normal
// application logging.
const originalConsoleError = console.error.bind(console);
(console as any).error = (...args: unknown[]) => {
  for (const arg of args) {
    if (arg instanceof Error) {
      record(arg);
      break;
    }
  }
  return originalConsoleError(...args);
};
process.stdout.write("[console-error-hook] installed\n");

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
