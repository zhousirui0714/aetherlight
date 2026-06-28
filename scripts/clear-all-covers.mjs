/**
 * 清空 DB 中所有 cover_url (回退到 SVG)
 * 用法: node scripts/clear-all-covers.mjs [--yes]
 */
import { readFileSync } from "node:fs";

const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96c2hmbHVqbnhvbmhmd2R0dW5wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTg1ODE1OCwiZXhwIjoyMDk3NDM0MTU4fQ.anOBfnv8KzPSnBl2XUKfCVsc3DlOuGGv-z4kIiT5O1c";
const URL = "https://ozshflujnxonhfwdtunp.supabase.co";

const args = process.argv.slice(2);
const SKIP_CONFIRM = args.includes("--yes");

if (!SKIP_CONFIRM) {
  console.log("⚠️  即将清空 knowledge_articles 表中所有 cover_url (回退 SVG)");
  console.log("   加 --yes 跳过此提示");
  process.exit(1);
}

const HEADERS = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

const r = await fetch(`${URL}/rest/v1/knowledge_articles?cover_url=not.is.null`, {
  method: "PATCH",
  headers: { ...HEADERS, Prefer: "return=minimal" },
  body: JSON.stringify({ cover_url: null }),
});
console.log("status:", r.status);

const r2 = await fetch(`${URL}/rest/v1/knowledge_articles?select=id&cover_url=not.is.null&limit=1`, {
  method: "HEAD",
  headers: { ...HEADERS, Prefer: "count=exact" },
});
console.log("剩余 cover_url 不为 null:", r2.headers.get("content-range"));
