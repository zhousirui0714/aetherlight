// 执行 v3 migration - 整段一次性提交，避免 DO 块被切分
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REF = "ozshflujnxonhfwdtunp";
const PAT = process.env.SUPABASE_PAT ||
  readFileSync(join(process.cwd(), ".env"), "utf-8").match(/SUPABASE_PAT=(.+)/)?.[1]?.trim() || "";
if (!PAT) {
  console.error("❌ 缺少 SUPABASE_PAT");
  process.exit(1);
}

const SQL = readFileSync(join(process.cwd(), "supabase", "migrations", "20260624_knowledge_v3.sql"), "utf-8");

async function q(query: string, label: string) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${PAT}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const text = await r.text();
  console.log(`[${label}] HTTP ${r.status}`);
  if (!r.ok) {
    console.log(`[${label}] ERROR: ${text.substring(0, 600)}`);
    return false;
  }
  console.log(`[${label}] OK: ${text.substring(0, 150)}`);
  return true;
}

(async () => {
  // 整个 migration 作为单条 query 提交
  console.log("=== 提交 v3 migration (整段) ===");
  await q(SQL, "v3-migration");

  // 验证
  console.log("\n=== 验证 ===");
  await q(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'knowledge_articles' AND column_name IN
       ('sub_category','full_text','full_text_lang','view_count','sort_weight','cover_url')
     ORDER BY column_name`,
    "verify-new-columns"
  );
  await q(
    `SELECT conname FROM pg_constraint WHERE conname IN ('knowledge_articles_category_v2_check','knowledge_articles_category_v3_check')`,
    "verify-constraints"
  );
  await q(
    `SELECT table_name FROM information_schema.tables WHERE table_name = 'knowledge_relations'`,
    "verify-relations-table"
  );
  await q(
    `SELECT category, COUNT(*) AS n FROM knowledge_articles GROUP BY category ORDER BY category`,
    "verify-category-dist"
  );
})();

