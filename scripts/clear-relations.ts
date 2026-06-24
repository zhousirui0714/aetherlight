/**
 * 清空 knowledge_relations 表 (用于关系批量重置)
 * 通过 supabase-js DELETE 调用 (service_role key 绕过 RLS)
 *
 * 运行: npx tsx scripts/clear-relations.ts
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

if (!URL || !KEY) {
  console.error("❌ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 缺失");
  process.exit(1);
}

async function main() {
  console.log("🗑️  清空 knowledge_relations 表...");

  // 用 PostgREST DELETE (不传 filter 即全删)
  // supabase-js 等价: .from("knowledge_relations").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  // 但因为表 id 不一定存在，用 lt("from_article_id", "zzzzzz") 兜底
  const res = await fetch(`${URL}/rest/v1/knowledge_relations?from_article_id=lt.zzzzzzzz`, {
    method: "DELETE",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=count",
    },
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("❌ 清空失败:", err.slice(0, 500));
    process.exit(1);
  }

  const range = res.headers.get("Content-Range");
  console.log(`   ✓ 删除了 ${range || "?"} 行`);
}

main().catch((err) => {
  console.error("❌ 失败:", err);
  process.exit(1);
});
