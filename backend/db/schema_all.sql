-- ============================================================
-- 溯光 Aetherlight · 完整建表脚本
-- 项目: ozshflujnxonhfwdtunp
-- 执行位置: Supabase Dashboard → SQL Editor
-- ============================================================

-- 启用 pgvector 扩展（用于 RAG 语义检索）
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- 1. 知识长廊（schema_articles.sql）
-- ============================================================

-- 知识条目主表
CREATE TABLE IF NOT EXISTS knowledge_articles (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT        NOT NULL,
    category    TEXT        NOT NULL CHECK (category IN ('节气','节日','诗词','典籍','非遗','民俗','人物')),
    excerpt     TEXT        NOT NULL,
    body        TEXT        NOT NULL DEFAULT '',
    cover       TEXT,
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
    UNIQUE (article_id, user_id)
);

-- 知识条目向量表（用于 RAG 语义检索）
CREATE TABLE IF NOT EXISTS article_embeddings (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id  UUID        NOT NULL REFERENCES knowledge_articles(id) ON DELETE CASCADE,
    chunk_text  TEXT        NOT NULL,
    embedding   vector(1024),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_articles_category ON knowledge_articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_created ON knowledge_articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_article ON article_favorites(article_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON article_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_article ON article_embeddings(article_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON article_embeddings USING ivfflat(embedding vector_cosine_ops);

-- RLS
ALTER TABLE knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "knowledge_articles_public_read"
    ON knowledge_articles FOR SELECT USING (true);
CREATE POLICY "knowledge_articles_auth_write"
    ON knowledge_articles FOR INSERT WITH CHECK (true);
CREATE POLICY "article_favorites_user_own"
    ON article_favorites FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 2. 与古人对话（schema_chat.sql）
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id TEXT NOT NULL,
    user_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cs_user ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cs_char ON chat_sessions(character_id);

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cm_session ON chat_messages(session_id);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cs_public_read" ON chat_sessions FOR SELECT USING (true);
CREATE POLICY "cs_auth_write" ON chat_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "cm_public_read" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "cm_auth_write" ON chat_messages FOR INSERT WITH CHECK (true);

-- ============================================================
-- 3. 社区（schema_community.sql）
-- ============================================================

CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT,
  author_nickname TEXT,
  summary TEXT,
  attachments TEXT[],
  like_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author TEXT,
  author_nickname TEXT,
  content TEXT NOT NULL,
  reply_to TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  topic TEXT,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO community_rooms (name, topic) VALUES
('节气茶话会', '节气话题'),
('诗友会', '诗词交流'),
('雅集', '文化杂谈');

CREATE TABLE IF NOT EXISTS community_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES community_rooms(id) ON DELETE CASCADE,
  author TEXT,
  author_nickname TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter TEXT,
  target_type TEXT,
  target_id TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY cp_public_read ON community_posts FOR SELECT USING (true);
CREATE POLICY cp_auth_write ON community_posts FOR INSERT WITH CHECK (true);
CREATE POLICY cr_public_read ON community_replies FOR SELECT USING (true);
CREATE POLICY cr_auth_write ON community_replies FOR INSERT WITH CHECK (true);
CREATE POLICY cm_public_read ON community_chat_messages FOR SELECT USING (true);
CREATE POLICY cm_auth_write ON community_chat_messages FOR INSERT WITH CHECK (true);

-- ============================================================
-- 4. 传统文化问答（schema_qa.sql）
-- ============================================================

CREATE TABLE IF NOT EXISTS qa_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('single','multiple','judge','fill','essay')),
  level INTEGER NOT NULL DEFAULT 3,
  question TEXT NOT NULL,
  options TEXT,
  reference_answer TEXT NOT NULL,
  analysis TEXT,
  knowledge_points TEXT[] DEFAULT '{}',
  mode TEXT DEFAULT 'practice',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qa_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES qa_questions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  answer TEXT,
  is_correct BOOLEAN,
  score INTEGER DEFAULT 0,
  session_id TEXT,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO qa_questions (category, type, level, question, reference_answer, analysis, knowledge_points) VALUES
('节气', 'single', 2, '夏至是一年中白昼最长的一天，请问这一天太阳直射哪里？', '北回归线', '夏至日太阳直射北回归线，北半球白昼最长。', ARRAY['节气','夏至','北回归线']),
('节日', 'single', 1, '端午节是为了纪念哪位历史人物？', '屈原', '端午节相传为纪念屈原而设。', ARRAY['节日','端午节','屈原']),
('诗词', 'single', 3, '但愿人长久，千里共婵娟是谁的名句？', '苏轼', '出自苏轼《水调歌头》。', ARRAY['诗词','苏轼','水调歌头']),
('非遗', 'judge', 2, '昆曲被联合国教科文组织列为人类非物质文化遗产代表作。', 'true', '昆曲于2001年入选联合国人类非遗代表作。', ARRAY['非遗','昆曲']),
('典籍', 'fill', 3, '《论语》是____及其弟子言行的语录体散文集。', '孔子', '《论语》记录孔子及其弟子言行。', ARRAY['典籍','论语','孔子']);

-- ============================================================
-- 5. 艺术创作（schema_art.sql）
-- ============================================================

CREATE TABLE IF NOT EXISTS art_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('image','music')),
  prompt TEXT NOT NULL,
  style TEXT,
  size TEXT,
  count INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'processing',
  result_json TEXT,
  provider TEXT,
  user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS art_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT,
  description TEXT,
  prompt TEXT,
  url TEXT,
  author TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE art_gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY art_gallery_public_read ON art_gallery FOR SELECT USING (true);
CREATE POLICY art_gallery_auth_write ON art_gallery FOR INSERT WITH CHECK (true);
