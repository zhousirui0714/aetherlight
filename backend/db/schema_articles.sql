-- ============================================================
-- 知识长廊相关表（补充到 backend/db/schema.sql 中执行）
-- ============================================================

-- 知识条目主表
CREATE TABLE IF NOT EXISTS knowledge_articles (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT        NOT NULL,
    category    TEXT        NOT NULL CHECK (category IN ('节气','节日','诗词','典籍','非遗','民俗','人物')),
    excerpt     TEXT        NOT NULL,
    body        TEXT        NOT NULL DEFAULT '',
    cover       TEXT,   -- emoji 或图片 URL
    source      TEXT        NOT NULL DEFAULT '',
    author      TEXT        NOT NULL DEFAULT '匿名',
    tags        TEXT[]      NOT NULL DEFAULT '{}',
    favorites   INTEGER     NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 收藏关系表
CREATE TABLE IF NOT EXISTS article_favorites (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id  UUID        NOT NULL REFERENCES knowledge_articles(id) ON DELETE CASCADE,
    user_id     UUID        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (article_id, user_id)  -- 同一用户对同一条目只有一条记录
);

-- 向量检索扩展（pgvector）
CREATE EXTENSION IF NOT EXISTS vector;

-- 知识条目向量表（用于 RAG 语义检索）
CREATE TABLE IF NOT EXISTS article_embeddings (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id  UUID        NOT NULL REFERENCES knowledge_articles(id) ON DELETE CASCADE,
    chunk_text  TEXT        NOT NULL,
    embedding   vector(1024),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_articles_category ON knowledge_articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_created ON knowledge_articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_article ON article_favorites(article_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON article_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_article ON article_embeddings(article_id);
-- 向量相似度索引（加速 RAG 检索）
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON article_embeddings USING ivfflat(embedding vector_cosine_ops);

-- RLS 行级安全策略（默认开启）
ALTER TABLE knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_favorites ENABLE ROW LEVEL SECURITY;

-- knowledge_articles：公开读取，登录后可写
CREATE POLICY "knowledge_articles_public_read"
    ON knowledge_articles FOR SELECT USING (true);

CREATE POLICY "knowledge_articles_auth_write"
    ON knowledge_articles FOR INSERT WITH CHECK (true);

-- article_favorites：仅本人可读写自己的收藏
CREATE POLICY "article_favorites_user_own"
    ON article_favorites FOR ALL USING (auth.uid() = user_id);
