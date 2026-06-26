/**
 * Supabase schema migration: 添加 cover_prompt 字段
 * 用于记录生图 prompt, 便于审计/重生成
 *
 * 用法: node scripts/migration-add-cover-prompt.mjs
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const ENV = (() => {
  const env = {};
  for (const line of readFileSync(join(ROOT, ".env"), "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && !line.startsWith("#")) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
})();

const SQL = `
ALTER TABLE knowledge_articles
  ADD COLUMN IF NOT EXISTS cover_prompt TEXT,
  ADD COLUMN IF NOT EXISTS cover_consistency_score REAL,
  ADD COLUMN IF NOT EXISTS cover_checked_at TIMESTAMPTZ;
`;

console.log("🔧 提交 SQL 迁移...");
const r = await fetch(`${ENV.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
  method: "POST",
  headers: {
    apikey: ENV.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query: SQL }),
});

if (r.ok) {
  console.log("✅ 迁移完成");
} else {
  // exec_sql 是 pg admin 权限, 一般不可用; 改用 pg meta / 直接 SQL 不行
  // 这里用 information_schema 查询校验
  const check = await fetch(
    `${ENV.SUPABASE_URL}/rest/v1/knowledge_articles?select=cover_prompt&limit=1`,
    {
      headers: {
        apikey: ENV.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );
  if (check.status === 400 && (await check.text()).includes("cover_prompt")) {
    console.log("❌ 字段不存在, 请在 Supabase Dashboard SQL Editor 中执行以下 SQL:\n");
    console.log(SQL);
    console.log("\nDashboard: https://supabase.com/dashboard/project/ozshflujnxonhfwdtunp/sql/new");
    process.exit(1);
  } else if (check.ok) {
    console.log("✅ 字段已存在, 无需迁移");
  } else {
    console.log("⚠️ 无法自动执行, 请在 Dashboard 手动执行以下 SQL:\n", SQL);
  }
}
