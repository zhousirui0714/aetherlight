// 用 Supabase Management API + PAT 远程执行 DDL
import { readFileSync } from "node:fs";
import { join } from "node:path";

const PROJECT_REF = "ozshflujnxonhfwdtunp";
// PAT 从环境变量读，避免提交到 Git
const PAT = process.env.SUPABASE_PAT || readFileSync(join(process.cwd(), ".env"), "utf-8")
  .match(/SUPABASE_PAT=(.+)/)?.[1]?.trim() || "";
if (!PAT) {
  console.error("❌ 缺少 SUPABASE_PAT 环境变量或 .env 里的 SUPABASE_PAT=xxx");
  process.exit(1);
}

const MIGRATION_SQL = `
ALTER TABLE knowledge_articles
  ADD COLUMN IF NOT EXISTS history           TEXT         DEFAULT '',
  ADD COLUMN IF NOT EXISTS influence         TEXT         DEFAULT '',
  ADD COLUMN IF NOT EXISTS body_extended     TEXT         DEFAULT '',
  ADD COLUMN IF NOT EXISTS related_people    JSONB        DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS related_books     JSONB        DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS related_events    JSONB        DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS related_poems     JSONB        DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS related_articles  JSONB        DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS faq               JSONB        DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS era               TEXT         DEFAULT '',
  ADD COLUMN IF NOT EXISTS dynasty           TEXT         DEFAULT '',
  ADD COLUMN IF NOT EXISTS region            TEXT         DEFAULT '';

ALTER TABLE knowledge_articles DROP CONSTRAINT IF EXISTS knowledge_articles_category_check;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'knowledge_articles_category_v2_check') THEN
    ALTER TABLE knowledge_articles
      ADD CONSTRAINT knowledge_articles_category_v2_check
      CHECK (category IN ('节气','节日','诗词','典籍','非遗','民俗','人物','建筑','神话','艺术','哲学','医学','科技','饮食','服饰'));
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS ai_completions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id  TEXT NOT NULL,
  field       TEXT NOT NULL CHECK (field IN ('history','influence','faq')),
  content     JSONB NOT NULL,
  model       TEXT NOT NULL DEFAULT 'qwen',
  tokens_used INT DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (article_id, field)
);
ALTER TABLE ai_completions ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_completions' AND policyname = 'ai_completions_public_read') THEN
    CREATE POLICY "ai_completions_public_read" ON ai_completions FOR SELECT USING (true);
  END IF;
END$$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_completions' AND policyname = 'ai_completions_service_write') THEN
    CREATE POLICY "ai_completions_service_write" ON ai_completions FOR ALL USING (auth.role() = 'service_role');
  END IF;
END$$;
CREATE INDEX IF NOT EXISTS idx_ai_completions_article ON ai_completions(article_id);
CREATE INDEX IF NOT EXISTS idx_ai_completions_field   ON ai_completions(field);
CREATE INDEX IF NOT EXISTS idx_articles_dynasty ON knowledge_articles(dynasty) WHERE dynasty <> '';
CREATE INDEX IF NOT EXISTS idx_articles_era     ON knowledge_articles(era)     WHERE era     <> '';
`.trim();

async function runSql(query: string, label: string) {
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;
  console.log(`\n[${label}] POST ${url}`);
  const r = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  const text = await r.text();
  console.log(`[${label}] HTTP ${r.status}`);
  if (!r.ok) {
    console.log(`[${label}] ERROR: ${text.substring(0, 500)}`);
    return false;
  }
  console.log(`[${label}] OK: ${text.substring(0, 200)}`);
  return true;
}

(async () => {
  // 1. 试个最简单的查询验证 token
  const ok = await runSql("SELECT 1 as ok, current_database() as db", "verify-token");
  if (!ok) {
    console.log("\n❌ Token 无效或 API 不通，放弃。");
    return;
  }

  // 2. 跑 migration
  const mig = await runSql(MIGRATION_SQL, "migration");
  if (!mig) {
    console.log("\n❌ Migration 失败。");
    return;
  }

  // 3. 验证结果
  await runSql(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'knowledge_articles' AND column_name IN ('history','related_people','faq') ORDER BY column_name`,
    "verify-columns"
  );
  await runSql(
    `SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'knowledge_articles_category_v2_check'`,
    "verify-constraint"
  );
  await runSql(
    `SELECT COUNT(*) AS cnt FROM knowledge_articles`,
    "verify-count"
  );
})();
