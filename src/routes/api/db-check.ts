/**
 * /api/db-check?id=xxx&field=author
 * 查 DB 某条记录的某个字段真值，用于排查"显示 vs 数据"差异
 *
 * 例子: /api/db-check?id=qin-shihuang&field=author
 */
import { createFileRoute } from "@tanstack/react-router";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const ENV = (() => {
  const env: Record<string, string> = {};
  for (const line of readFileSync(join(ROOT, ".env"), "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && !line.startsWith("#")) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
})();

const HEADERS = {
  apikey: ENV.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

export const Route = createFileRoute("/api/db-check")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        const field = url.searchParams.get("field") || "author";
        if (!id) {
          return new Response(
            JSON.stringify({ error: "missing id (e.g. ?id=qin-shihuang)" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        const allowed = new Set([
          "id", "title", "author", "category", "cover_url", "excerpt",
          "body", "history", "influence", "faq", "dynasty", "era", "region",
          "related_people", "related_books", "related_events",
        ]);
        if (!allowed.has(field)) {
          return new Response(
            JSON.stringify({ error: `field '${field}' not allowed` }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        const r = await fetch(
          `${ENV.SUPABASE_URL}/rest/v1/knowledge_articles?id=eq.${encodeURIComponent(id)}&select=id,title,${field}`,
          { headers: HEADERS }
        );
        if (!r.ok) {
          return new Response(
            JSON.stringify({ error: `supabase ${r.status}`, body: await r.text() }),
            { status: 502, headers: { "Content-Type": "application/json" } }
          );
        }
        const rows = await r.json();
        if (rows.length === 0) {
          return new Response(
            JSON.stringify({ error: "not found", id }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }
        const row = rows[0];
        return new Response(
          JSON.stringify({
            id: row.id,
            title: row.title,
            field,
            value: row[field],
            isEmpty: row[field] === "" || row[field] === null,
            containsEditor: /溯光|编辑部|蜀光|水墨编辑部/.test(
              typeof row[field] === "string" ? row[field] : ""
            ),
            serverTime: new Date().toISOString(),
          }),
          {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store, no-cache, must-revalidate",
              "CDN-Cache-Control": "no-store",
              "Vercel-CDN-Cache-Control": "no-store",
            },
          }
        );
      },
    },
  },
});
