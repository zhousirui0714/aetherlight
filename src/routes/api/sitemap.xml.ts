/**
 * /api/sitemap.xml
 * 全站 sitemap: 1966 篇文章 + 静态页
 * 缓存 1h, Vercel CDN edge cache
 */
import { createFileRoute } from "@tanstack/react-router";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const ENV = (() => {
  const env: Record<string, string> = {};
  for (const l of readFileSync(join(ROOT, ".env"), "utf-8").split("\n")) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && !l.startsWith("#")) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
})();

const SITE = "https://aetherlight.vercel.app";
const HEADERS = {
  apikey: ENV.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

// 静态页: 重要度 1.0 每日更新, 0.7 每周, 0.5 每月
const STATIC = [
  { loc: "/", priority: 1.0, freq: "daily" },
  { loc: "/gallery", priority: 0.9, freq: "daily" },
  { loc: "/heritage", priority: 0.9, freq: "weekly" },
  { loc: "/search", priority: 0.7, freq: "monthly" },
  { loc: "/journey", priority: 0.7, freq: "monthly" },
  { loc: "/favorites", priority: 0.5, freq: "monthly" },
  { loc: "/qa-square", priority: 0.6, freq: "daily" },
];

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const Route = createFileRoute("/api/sitemap/xml")({
  server: {
    handlers: {
      GET: async () => {
        // 拉所有文章的 id + updated_at
        const all: { id: string; updated_at: string; view_count: number }[] = [];
        let offset = 0;
        while (true) {
          const r = await fetch(
            `${ENV.SUPABASE_URL}/rest/v1/knowledge_articles?select=id,updated_at,view_count&limit=1000&offset=${offset}`,
            { headers: HEADERS }
          );
          if (!r.ok) break;
          const d = await r.json();
          all.push(...d);
          if (d.length < 1000) break;
          offset += 1000;
        }

        // 按 view_count 决定 priority: 热门 0.8 / 普通 0.6 / 长尾 0.5
        const max = Math.max(1, ...all.map((a) => a.view_count || 0));
        const lines: string[] = [];
        lines.push('<?xml version="1.0" encoding="UTF-8"?>');
        lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

        for (const s of STATIC) {
          lines.push("  <url>");
          lines.push(`    <loc>${SITE}${s.loc}</loc>`);
          lines.push(`    <changefreq>${s.freq}</changefreq>`);
          lines.push(`    <priority>${s.priority.toFixed(1)}</priority>`);
          lines.push("  </url>");
        }

        const now = new Date().toISOString().slice(0, 10);
        for (const a of all) {
          const v = a.view_count || 0;
          const p = v > max * 0.3 ? 0.8 : v > max * 0.1 ? 0.7 : 0.5;
          const lastmod = a.updated_at ? a.updated_at.slice(0, 10) : now;
          lines.push("  <url>");
          lines.push(`    <loc>${SITE}/article/${esc(a.id)}</loc>`);
          lines.push(`    <lastmod>${lastmod}</lastmod>`);
          lines.push(`    <changefreq>${p >= 0.8 ? "weekly" : "monthly"}</changefreq>`);
          lines.push(`    <priority>${p.toFixed(1)}</priority>`);
          lines.push("  </url>");
        }

        lines.push("</urlset>");

        return new Response(lines.join("\n"), {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
            "CDN-Cache-Control": "public, s-maxage=3600",
            "Vercel-CDN-Cache-Control": "public, s-maxage=3600",
          },
        });
      },
    },
  },
});
