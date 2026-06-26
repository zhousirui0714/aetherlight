-- ================================================================
-- 溯光 Aetherlight - DB 性能优化索引
-- 在 Supabase SQL Editor 跑一次即可 (无破坏性)
-- 预计耗时: 30s-2min
-- ================================================================

-- 1) category B-tree 索引
CREATE INDEX IF NOT EXISTS idx_articles_category
  ON knowledge_articles (category);

-- 2) category + view_count 复合索引
CREATE INDEX IF NOT EXISTS idx_articles_category_view
  ON knowledge_articles (category, view_count DESC NULLS LAST);

-- 3) view_count desc 索引
CREATE INDEX IF NOT EXISTS idx_articles_view_count
  ON knowledge_articles (view_count DESC NULLS LAST);

-- 4) updated_at desc 索引
CREATE INDEX IF NOT EXISTS idx_articles_updated_at
  ON knowledge_articles (updated_at DESC NULLS LAST);

-- 5) 关系表外键索引 (提升 JOIN 性能)
CREATE INDEX IF NOT EXISTS idx_relations_from
  ON knowledge_relations (from_article_id);
CREATE INDEX IF NOT EXISTS idx_relations_to
  ON knowledge_relations (to_article_id);
CREATE INDEX IF NOT EXISTS idx_relations_type
  ON knowledge_relations (relation_type);

-- 6) 简单全文搜索 (title trigram 模糊匹配, 不依赖 zhparser)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_articles_title_trgm
  ON knowledge_articles USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_articles_excerpt_trgm
  ON knowledge_articles USING GIN (coalesce(excerpt, '') gin_trgm_ops);

-- 7) cover_url 索引 (过滤有图/无图)
CREATE INDEX IF NOT EXISTS idx_articles_has_cover
  ON knowledge_articles ((cover_url IS NOT NULL));

-- 8) created_at 索引 (按时间排序)
CREATE INDEX IF NOT EXISTS idx_articles_created_at
  ON knowledge_articles (created_at DESC NULLS LAST);

-- 9) 简单 GIN tsvector (英文/中文混合, 不需要 zhparser)
ALTER TABLE knowledge_articles
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(excerpt, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(body, '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_articles_search_tsv
  ON knowledge_articles USING GIN (search_tsv);

-- 10) ANALYZE 让查询规划器拿到最新统计
ANALYZE knowledge_articles;
ANALYZE knowledge_relations;

-- ================================================================
-- 使用示例 (前端):
--
-- 全文搜索 (按相关度排):
-- SELECT id, title, excerpt, ts_rank(search_tsv, plainto_tsquery('simple', '李白')) as rank
-- FROM knowledge_articles
-- WHERE search_tsv @@ plainto_tsquery('simple', '李白')
-- ORDER BY rank DESC LIMIT 20;
--
-- 标题模糊 (含 trigram, 处理错别字):
-- SELECT id, title FROM knowledge_articles
-- WHERE title ILIKE '%李白%' OR title % '李白'
-- ORDER BY similarity(title, '李白') DESC LIMIT 10;
-- ================================================================
