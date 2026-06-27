// Captures the original Error out-of-band so server.ts can recover the stack
// when h3 has already swallowed the throw into a generic 500 Response.

let lastCapturedError: { error: unknown; at: number } | undefined;
const TTL_MS = 5_000;

function record(error: unknown) {
  lastCapturedError = { error, at: Date.now() };
}

// On Node, register process-level handlers so that errors thrown outside
// the TanStack Start middleware chain (e.g. during getEntries() import,
// async router setup, or any rejected promise that escapes the
// request handler) are still captured.
if (typeof process !== "undefined" && process.on) {
  process.on("uncaughtException", record);
  process.on("unhandledRejection", record);
}
// In browser-like runtimes (Deno, edge) we can also try globalThis.
if (typeof globalThis !== "undefined" && typeof (globalThis as any).addEventListener === "function") {
  (globalThis as any).addEventListener("error", (event: any) => record(event?.error ?? event));
  (globalThis as any).addEventListener("unhandledrejection", (event: any) => record(event?.reason));
}

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
