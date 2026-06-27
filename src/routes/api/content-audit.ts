/**
 * /api/content-audit?id=xxx
 * 返回指定文章的字段完整度 (用于前端徽章)
 */
import { createFileRoute } from "@tanstack/react-router";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const AUDIT_JSON = join(process.cwd(), "scripts", "audit-content.json");

export const Route = createFileRoute("/api/content-audit")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        if (!id) return new Response(JSON.stringify({ error: "missing id" }), { status: 400, headers: { "Content-Type": "application/json" } });

        if (!existsSync(AUDIT_JSON)) {
          return new Response(JSON.stringify({ error: "audit not run" }), { status: 503, headers: { "Content-Type": "application/json" } });
        }
        const audit = JSON.parse(readFileSync(AUDIT_JSON, "utf-8"));
        const rec = audit.records.find((r) => r.id === id);
        if (!rec) {
          return new Response(JSON.stringify({ present: null, message: "not in audit" }), { headers: { "Content-Type": "application/json" } });
        }
        // 把 missing 字段的剩余都视为 false, 其他为 true
        const missing = (rec.missing_fields || "").split("|").filter(Boolean);
        const present = {
          hasCover: !missing.includes("cover_file") && !missing.includes("cover_url"),
          hasExcerpt: !missing.includes("excerpt"),
          hasBody: !missing.includes("body"),
          hasHistory: !missing.includes("history"),
          hasInfluence: !missing.includes("influence"),
          hasFaq: !missing.includes("faq"),
          hasRelatedPeople: !missing.includes("related_people"),
        };
        return new Response(JSON.stringify({ present, grade: rec.grade, completeness: rec.completeness }), {
          headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=600" },
        });
      },
    },
  },
});
