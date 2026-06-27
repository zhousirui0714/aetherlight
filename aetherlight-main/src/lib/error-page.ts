export function renderErrorPage(detail?: { message: string; stack?: string }): string {
  // 暂时无条件展示 detail,方便调试;正式上线前再恢复成 SSR_ERROR_VERBOSE / 非生产 开关
  const detailHtml = detail
    ? `<details open style="margin-top:1.5rem;text-align:left;font:12px/1.5 ui-monospace,monospace;color:#374151;background:#fff;border:1px solid #e5e7eb;border-radius:0.5rem;padding:0.75rem;max-height:18rem;overflow:auto;white-space:pre-wrap;word-break:break-all"><summary style="cursor:pointer;color:#111;font-family:system-ui">Stack trace</summary>${escapeHtml(detail.message)}\n\n${escapeHtml(detail.stack ?? "")}</details>`
    : "";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fecaca; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .banner { position: fixed; top: 0; left: 0; right: 0; background: #dc2626; color: #fff; text-align: center; padding: 0.5rem; font: 700 14px/1.4 system-ui; letter-spacing: 0.5px; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
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
      <h1>This page didn't load</h1><p style="color:#dc2626;font:12px/1.4 ui-monospace,monospace;margin:-0.75rem 0 1.5rem">[debug marker: build v2026-06-27-r2]</p>
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
