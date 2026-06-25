-- ============================================================
-- 溯光 Aetherlight · 知识库分类扩展（xirang 数据源）
-- 数据源：ruguoaaa/xirang（诗藏子集：诗集/词集/词话/诗话/对联/剧曲/楚辞/汉赋）
-- 接入契约：/api/ancient-books 扩展 source=xirang
-- 执行位置：Supabase Dashboard → SQL Editor
-- 注意：所有变更均幂等，可重复执行
-- ============================================================

-- 1. 扩展 knowledge_books.category CHECK 约束
-- 现有：'经部','史部','子部','集部','科技','艺术','笔记','蒙学','其他'
-- 新增：'诗话','词话','诗集','词集','楚辞','剧曲','对联','汉赋'

DO $do$
BEGIN
  -- 删除旧约束（如存在）
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'knowledge_books_category_check') THEN
    ALTER TABLE knowledge_books DROP CONSTRAINT knowledge_books_category_check;
  END IF;
  -- 加新约束
  ALTER TABLE knowledge_books
    ADD CONSTRAINT knowledge_books_category_check
    CHECK (category IN (
      '经部','史部','子部','集部','科技','艺术','笔记','蒙学','其他',
      '诗话','词话','诗集','词集','楚辞','剧曲','对联','汉赋'
    ));
END
$do$;

-- 2. 索引（按 xirang 来源快速查询）
CREATE INDEX IF NOT EXISTS idx_kb_source
  ON knowledge_books (source);

-- 3. 注释
COMMENT ON CONSTRAINT knowledge_books_category_check ON knowledge_books
  IS 'knowledge_books.category 枚举：经史子集 + xirang 8 个子集';
