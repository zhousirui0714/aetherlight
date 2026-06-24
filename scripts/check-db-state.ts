/**
 * 查 DB 当前 articles / relations 数量 + 9 条 cover_url 是否已写入
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const ENV_FILE = join(ROOT, ".env");

function loadEnv(): Record<string, string> {
  const content = readFileSync(ENV_FILE, "utf-8");
  const env: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && !line.startsWith("#")) {
      env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

const ENV = loadEnv();
const URL = ENV.SUPABASE_URL || ENV.VITE_SUPABASE_URL;
const KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;

async function count(table: string): Promise<number> {
  const res = await fetch(`${URL}/rest/v1/rpc/count_rows`, {
    method: "POST",
    headers: { apikey: KEY!, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ table_name: table }),
  });
  if (!res.ok) {
    // fallback: 用 HEAD with Prefer: count=exact
    const r2 = await fetch(`${URL}/rest/v1/${table}?select=id&limit=0`, {
      headers: { apikey: KEY!, Authorization: `Bearer ${KEY}`, Prefer: "count=exact" },
    });
    const cr = r2.headers.get("Content-Range") || "";
    const m = cr.match(/\/(\d+)/);
    return m ? parseInt(m[1], 10) : -1;
  }
  const j = await res.json();
  return j ?? -1;
}

async function main() {
  console.log("articles:", await count("knowledge_articles"));
  console.log("relations:", await count("knowledge_relations"));

  // 查 9 条 cover_url 是否写入
  const ids = ["libai","qinshihuang","kongzi","gugong","qin-shihuang-ling","dujiangyan","jingju","guqin","kunqu"];
  const filter = `(${ids.map(id => `id.eq.${id}`).join(",")})`;
  const res = await fetch(`${URL}/rest/v1/knowledge_articles?select=id,title,cover_url&or=(${filter})`, {
    headers: { apikey: KEY!, Authorization: `Bearer ${KEY}` },
  });
  const rows = await res.json();
  for (const r of rows) {
    const u = r.cover_url || "(空)";
    console.log(`${r.id} (${r.title}): cover_url=${u.startsWith("https://") ? "✓ " + u.slice(0,60) + "..." : u}`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
