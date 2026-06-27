type ErrorDetail = {
  message: string;
  stack?: string;
  name?: string;
  code?: string;
  cause?: unknown;
  h3Body?: string;
};

export function renderErrorPage(detail?: ErrorDetail): string {
  const detailHtml = detail
    ? `<details open style="margin-top:2rem;padding:1rem;background:#fef2f2;border:1px solid #fca5a5;border-radius:0.5rem;color:#7f1d1d;font-family:ui-monospace,monospace;font-size:13px;line-height:1.5;text-align:left;white-space:pre-wrap;word-break:break-word"><summary style="cursor:pointer;font-weight:600;font-family:system-ui;font-size:15px;color:#111">🚨 SSR error details (click to collapse)</summary><div style="margin-top:0.75rem"><strong>Message:</strong>\n${escapeHtml(detail.message)}</div>${detail.name ? `<div style="margin-top:0.5rem"><strong>Name:</strong>\n${escapeHtml(detail.name)}</div>` : ""}${detail.code ? `<div style="margin-top:0.5rem"><strong>Code:</strong>\n${escapeHtml(detail.code)}</div>` : ""}${detail.stack ? `<div style="margin-top:0.5rem"><strong>Stack:</strong>\n${escapeHtml(detail.stack)}</div>` : ""}${detail.cause !== undefined ? `<div style="margin-top:0.5rem"><strong>Cause:</strong>\n${escapeHtml(stringifyCause(detail.cause))}</div>` : ""}${detail.h3Body ? `<div style="margin-top:0.5rem"><strong>h3 response body:</strong>\n${escapeHtml(detail.h3Body)}</div>` : ""}</details>`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 32rem; width: 100%; text-align: center; padding: 2rem; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #4b5563; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #111; color: #fff; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing or head back home.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
      ${detailHtml}
    </div>
  </body>
</html>`;
}

function stringifyCause(cause: unknown): string {
  if (cause instanceof Error) {
    return `${cause.name}: ${cause.message}${cause.stack ? "\n" + cause.stack : ""}`;
  }
  try {
    return JSON.stringify(cause, null, 2);
  } catch {
    return String(cause);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
