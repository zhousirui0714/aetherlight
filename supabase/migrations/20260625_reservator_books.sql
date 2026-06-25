-- ============================================================
-- 溯光 Aetherlight · 站内典籍原文库（Reservator）
-- 数据源：tanpero/Reservator（35 部古籍 Markdown）
-- 接入契约：/api/ancient-books Reservator 兜底扩展 v1.1（数据落 Supabase）
-- 执行位置：Supabase Dashboard → SQL Editor
-- 注意：所有变更均幂等，可重复执行
-- ============================================================

-- 1. 典籍主表
CREATE TABLE IF NOT EXISTS knowledge_books (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  TEXT        UNIQUE NOT NULL,
  title                 TEXT        NOT NULL,
  author                TEXT,
  dynasty               TEXT        NOT NULL,
  category              TEXT        NOT NULL,
  brief                 TEXT        NOT NULL DEFAULT '',
  source                TEXT        NOT NULL DEFAULT 'Reservator (tanpero/Reservator)',
  has_unresolved_chars  BOOLEAN     NOT NULL DEFAULT false,
  chapter_count         INTEGER     NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. 典籍章节表
CREATE TABLE IF NOT EXISTS knowledge_book_chapters (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  book_slug             TEXT        NOT NULL,
  urn                   TEXT        NOT NULL,
  title                 TEXT        NOT NULL,
  paragraphs            JSONB       NOT NULL DEFAULT '[]'::jsonb,
  has_unresolved_chars  BOOLEAN     NOT NULL DEFAULT false,
  sort_order            INTEGER     NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT knowledge_book_chapters_book_slug_fkey
    FOREIGN KEY (book_slug) REFERENCES knowledge_books(slug) ON DELETE CASCADE,
  CONSTRAINT knowledge_book_chapters_slug_urn_unique UNIQUE (book_slug, urn)
);

-- 3. 索引
CREATE INDEX IF NOT EXISTS idx_kb_chapters_book_sort
  ON knowledge_book_chapters (book_slug, sort_order);

CREATE INDEX IF NOT EXISTS idx_kb_chapters_unresolved
  ON knowledge_book_chapters (book_slug)
  WHERE has_unresolved_chars = true;

-- 4. 分类 CHECK 约束（按契约 §2 ReservatorBook.category 枚举）
DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'knowledge_books_category_check') THEN
    ALTER TABLE knowledge_books
      ADD CONSTRAINT knowledge_books_category_check
      CHECK (category IN ('经部','史部','子部','集部','科技','艺术','笔记','蒙学','其他'));
  END IF;
END
$do$;

-- 5. RLS（按 project_memory 硬约束：所有 user-facing 表启用 RLS，public read）
ALTER TABLE knowledge_books         ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_book_chapters  ENABLE ROW LEVEL SECURITY;

-- 6. RLS policies（条件检查避免重复）
DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read knowledge_books') THEN
    CREATE POLICY "Public read knowledge_books" ON knowledge_books
      FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read knowledge_book_chapters') THEN
    CREATE POLICY "Public read knowledge_book_chapters" ON knowledge_book_chapters
      FOR SELECT USING (true);
  END IF;
  -- write：仅 service_role 可写（管理脚本走 service key）
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role write knowledge_books') THEN
    CREATE POLICY "Service role write knowledge_books" ON knowledge_books
      FOR ALL USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role write knowledge_book_chapters') THEN
    CREATE POLICY "Service role write knowledge_book_chapters" ON knowledge_book_chapters
      FOR ALL USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END
$do$;

-- 7. updated_at 触发器
DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_kb_updated_at') THEN
    CREATE TRIGGER trg_kb_updated_at
      BEFORE UPDATE ON knowledge_books
      FOR EACH ROW EXECUTE FUNCTION moddatetime (updated_at);
  END IF;
END
$do$;

-- 8. 注释（方便 Supabase Dashboard 查看）
COMMENT ON TABLE  knowledge_books                  IS '站内典籍主表 - Reservator 数据源';
COMMENT ON TABLE  knowledge_book_chapters          IS '站内典籍章节表 - 段落以 JSONB 数组存储';
COMMENT ON COLUMN knowledge_books.slug             IS 'URL-safe 标识（如 chajing / zhuangzi）';
COMMENT ON COLUMN knowledge_books.has_unresolved_chars IS '是否有未修复的 ((部件1部件2)) 占位符';
COMMENT ON COLUMN knowledge_books.chapter_count    IS '冗余字段：章节总数（与子表一致）';
COMMENT ON COLUMN knowledge_book_chapters.urn      IS '卷次唯一标识：{book_slug}::{chapter_slug}';
COMMENT ON COLUMN knowledge_book_chapters.paragraphs IS '段落数组 JSONB（修复占位符后）';
COMMENT ON COLUMN knowledge_book_chapters.sort_order IS '章节顺序（按 H2 在 md 中出现顺序）';
