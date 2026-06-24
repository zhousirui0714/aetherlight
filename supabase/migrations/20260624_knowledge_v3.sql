-- ============================================================
-- 溯光 Aetherlight · 知识长廊 v3
-- 重构: 15 中文分类 → 10 英文分类 + 2 级子类 + 全文/翻译/注释 + 知识图谱
-- ============================================================

-- 1. 先 DROP 旧约束（不然 UPDATE 会被 CHECK 卡住）
ALTER TABLE knowledge_articles DROP CONSTRAINT IF EXISTS knowledge_articles_category_v2_check;
ALTER TABLE knowledge_articles DROP CONSTRAINT IF EXISTS knowledge_articles_category_check;

-- 2. 迁移旧 category 数据到新英文 key
UPDATE knowledge_articles SET category = 'figures'    WHERE category = '人物';
UPDATE knowledge_articles SET category = 'poems'      WHERE category = '诗词';
UPDATE knowledge_articles SET category = 'classics'   WHERE category = '典籍';
UPDATE knowledge_articles SET category = 'festivals'  WHERE category IN ('节日','节气');
UPDATE knowledge_articles SET category = 'mythology'  WHERE category = '神话';
UPDATE knowledge_articles SET category = 'intangible' WHERE category IN ('非遗','艺术');
UPDATE knowledge_articles SET category = 'intangible' WHERE category = '民俗' AND id IN ('wedding','painting','paper-cut','kite');
UPDATE knowledge_articles SET category = 'lifestyle'  WHERE category = '民俗' AND id = 'tea';
UPDATE knowledge_articles SET category = 'lifestyle'  WHERE category = '民俗' AND id NOT IN ('wedding','painting','paper-cut','kite','tea');
UPDATE knowledge_articles SET category = 'artifacts'  WHERE category = '建筑';
UPDATE knowledge_articles SET category = 'lifestyle'  WHERE category IN ('饮食','服饰');
UPDATE knowledge_articles SET category = 'philosophy' WHERE category = '哲学';
UPDATE knowledge_articles SET category = 'technology' WHERE category IN ('科技','医学');

-- 兜底：把仍未匹配的归到 philosophy（理论类）
UPDATE knowledge_articles SET category = 'philosophy'
  WHERE category NOT IN ('figures','poems','classics','festivals','mythology',
                         'intangible','artifacts','lifestyle','philosophy','technology');

-- 3. 加 v3 CHECK 约束
DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'knowledge_articles_category_v3_check') THEN
    ALTER TABLE knowledge_articles
      ADD CONSTRAINT knowledge_articles_category_v3_check
      CHECK (category IN ('figures','poems','classics','festivals','mythology',
                          'intangible','artifacts','lifestyle','philosophy','technology'));
  END IF;
END
$do$;

-- 4. 新增字段
ALTER TABLE knowledge_articles
  ADD COLUMN IF NOT EXISTS sub_category    TEXT         DEFAULT '',
  ADD COLUMN IF NOT EXISTS full_text       TEXT,
  ADD COLUMN IF NOT EXISTS full_text_lang  TEXT         DEFAULT 'classical',
  ADD COLUMN IF NOT EXISTS view_count      INT          DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sort_weight     INT          DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cover_url       TEXT;

-- sub_category 索引
CREATE INDEX IF NOT EXISTS idx_articles_sub_category ON knowledge_articles(sub_category) WHERE sub_category <> '';

-- 5. 知识图谱关联表
CREATE TABLE IF NOT EXISTS knowledge_relations (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  from_article_id TEXT        NOT NULL,
  to_article_id   TEXT        NOT NULL,
  relation_type   TEXT        NOT NULL CHECK (relation_type IN (
                      'person_of','book_of','place_of','concept_of',
                      'event_of','poem_of','mentioned_in','related'
                   )),
  weight          INT         DEFAULT 1,
  description     TEXT        DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (from_article_id, to_article_id, relation_type)
);

CREATE INDEX IF NOT EXISTS idx_relations_from ON knowledge_relations(from_article_id);
CREATE INDEX IF NOT EXISTS idx_relations_to   ON knowledge_relations(to_article_id);
CREATE INDEX IF NOT EXISTS idx_relations_type ON knowledge_relations(relation_type);

ALTER TABLE knowledge_relations ENABLE ROW LEVEL SECURITY;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'knowledge_relations' AND policyname = 'knowledge_relations_public_read') THEN
    CREATE POLICY "knowledge_relations_public_read" ON knowledge_relations FOR SELECT USING (true);
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'knowledge_relations' AND policyname = 'knowledge_relations_service_write') THEN
    CREATE POLICY "knowledge_relations_service_write" ON knowledge_relations FOR ALL USING (auth.role() = 'service_role');
  END IF;
END
$do$;

-- 6. 扩展 ai_completions field 枚举（新增 translation/annotation）
DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_completions_field_check') THEN
    ALTER TABLE ai_completions DROP CONSTRAINT ai_completions_field_check;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_completions_field_v2_check') THEN
    ALTER TABLE ai_completions
      ADD CONSTRAINT ai_completions_field_v2_check
      CHECK (field IN ('history','influence','faq','translation','annotation'));
  END IF;
END
$do$;
