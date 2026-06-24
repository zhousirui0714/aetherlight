/**
 * 通过 Supabase Management API + PAT 跑 TRUNCATE 强制清空 relations
 *
 * 运行: npx tsx scripts/clear-relations-sql.ts
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
const PAT = ENV.SUPABASE_PAT;
const REF = ENV.SUPABASE_PROJECT_REF || URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!PAT || !REF) {
  console.error("❌ SUPABASE_PAT / SUPABASE_PROJECT_REF 缺失");
  process.exit(1);
}

async function main() {
  console.log("🗑️  TRUNCATE knowledge_relations (走 Management API + PAT)...");

  // 先 count 确认
  const c1 = await fetch(`${URL}/rest/v1/knowledge_relations?select=id&limit=0`, {
    headers: { apikey: KEY!, Authorization: `Bearer ${KEY}`, Prefer: "count=exact" },
  });
  const before = c1.headers.get("Content-Range")?.split("/")[1] ?? "?";
  console.log(`   当前 relations: ${before}`);

  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: "TRUNCATE TABLE knowledge_relations;" }),
  });

  console.log("   status:", res.status);
  const text = await res.text();
  console.log("   body:", text.slice(0, 500));

  if (!res.ok) process.exit(1);
  console.log("   ✓ TRUNCATE done");

  // 再 count 验证
  const c2 = await fetch(`${URL}/rest/v1/knowledge_relations?select=id&limit=0`, {
    headers: { apikey: KEY!, Authorization: `Bearer ${KEY}`, Prefer: "count=exact" },
  });
  const after = c2.headers.get("Content-Range")?.split("/")[1] ?? "?";
  console.log(`   剩余 relations: ${after}`);
}

main().catch((err) => {
  console.error("❌ 失败:", err);
  process.exit(1);
});
