/**
 * 扩展 knowledge_relations.relation_type 约束 (新增 work_of / teacher_of)
 * 通过 Supabase Management API + PAT 跑 SQL
 *
 * 运行: npx tsx scripts/extend-relation-types.ts
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
const PAT = ENV.SUPABASE_PAT;
const REF = ENV.SUPABASE_PROJECT_REF || URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!PAT || !REF) {
  console.error("❌ SUPABASE_PAT / SUPABASE_PROJECT_REF 缺失");
  process.exit(1);
}

const SQL = `
-- 1) DROP 旧 CHECK
ALTER TABLE knowledge_relations DROP CONSTRAINT IF EXISTS knowledge_relations_relation_type_check;

-- 2) ADD 新 CHECK (含 work_of, teacher_of)
ALTER TABLE knowledge_relations
  ADD CONSTRAINT knowledge_relations_relation_type_check
  CHECK (relation_type IN (
    'person_of','book_of','place_of','concept_of',
    'event_of','poem_of','mentioned_in','related',
    'work_of','teacher_of'
  ));
`;

async function main() {
  console.log("🔧 扩展 knowledge_relations.relation_type 约束...");

  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: SQL }),
  });

  console.log("   status:", res.status);
  const text = await res.text();
  console.log("   body:", text.slice(0, 500));

  if (!res.ok) process.exit(1);
  console.log("   ✓ done");
}

main().catch((err) => {
  console.error("❌ 失败:", err);
  process.exit(1);
});
