-- ============================================================
-- 溯光 Aetherlight · 知识长廊重构 v1.0
-- 目标：扩展 knowledge_articles 字段 + 新增 ai_completions 缓存表
-- 执行位置：Supabase Dashboard → SQL Editor
-- 注意：所有变更均幂等，可重复执行
-- ============================================================

-- 1. 扩展 knowledge_articles
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
  ADD COLUMN IF NOT EXISTS ai_status         JSONB        DEFAULT '{"history":"pending","influence":"pending","faq":"pending"}'::jsonb,
  ADD COLUMN IF NOT EXISTS era               TEXT         DEFAULT '',
  ADD COLUMN IF NOT EXISTS dynasty           TEXT         DEFAULT '',
  ADD COLUMN IF NOT EXISTS region            TEXT         DEFAULT '';

-- 2. 放宽 category check 约束（旧约束可能只允许 7 个分类）
ALTER TABLE knowledge_articles DROP CONSTRAINT IF EXISTS knowledge_articles_category_check;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'knowledge_articles_category_v2_check'
  ) THEN
    ALTER TABLE knowledge_articles
      ADD CONSTRAINT knowledge_articles_category_v2_check
      CHECK (category IN ('节气','节日','诗词','典籍','非遗','民俗','人物','建筑','神话','艺术','哲学','医学','科技','饮食','服饰'));
  END IF;
END$$;

-- 3. 新增 AI 补全缓存表
CREATE TABLE IF NOT EXISTS ai_completions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id      UUID        NOT NULL REFERENCES knowledge_articles(id) ON DELETE CASCADE,
  field           TEXT        NOT NULL CHECK (field IN ('history','influence','faq')),
  content         JSONB       NOT NULL,
  model           TEXT        NOT NULL DEFAULT 'qwen',
  tokens_used     INT         DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (article_id, field)
);

CREATE INDEX IF NOT EXISTS idx_ai_completions_article ON ai_completions(article_id);
CREATE INDEX IF NOT EXISTS idx_ai_completions_field   ON ai_completions(field);

ALTER TABLE ai_completions ENABLE ROW LEVEL SECURITY;

-- 公开读（缓存对所有人可见，避免重复 LLM 调用）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_completions' AND policyname = 'ai_completions_public_read'
  ) THEN
    CREATE POLICY "ai_completions_public_read"
      ON ai_completions FOR SELECT USING (true);
  END IF;
END$$;

-- 服务角色可写
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_completions' AND policyname = 'ai_completions_service_write'
  ) THEN
    CREATE POLICY "ai_completions_service_write"
      ON ai_completions FOR ALL USING (auth.role() = 'service_role');
  END IF;
END$$;

-- 4. 业务索引（加速按分类/朝代筛选）
CREATE INDEX IF NOT EXISTS idx_articles_dynasty ON knowledge_articles(dynasty) WHERE dynasty <> '';
CREATE INDEX IF NOT EXISTS idx_articles_era     ON knowledge_articles(era)     WHERE era     <> '';
