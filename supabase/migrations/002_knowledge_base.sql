-- 知识库数据库结构
-- 运行此 SQL 创建所需表

-- 人物表
CREATE TABLE IF NOT EXISTS kb_persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  name_variants TEXT[], -- 别名
  dynasty TEXT NOT NULL,
  birth_year TEXT,
  death_year TEXT,
  biography TEXT, -- 生平简介
  achievements TEXT[], -- 主要成就
  works TEXT[], -- 代表著作
  image_url TEXT, -- 人物图片
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 典籍表
CREATE TABLE IF NOT EXISTS kb_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL UNIQUE,
  title_variants TEXT[], -- 别名
  dynasty TEXT NOT NULL,
  author TEXT,
  summary TEXT, -- 内容简介
  content TEXT, -- 原文节选
  chapters TEXT[], -- 章节列表
  category TEXT, -- 分类：经、史、子、集
  image_url TEXT, -- 典籍图片
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 知识条目表
CREATE TABLE IF NOT EXISTS kb_knowledge_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  question_variants TEXT[], -- 问题的不同表述
  answer TEXT NOT NULL,
  category TEXT, -- 分类：诗词、节气、节日、人物、典籍、民俗、非遗
  keywords TEXT[], -- 关键词
  quotes JSONB DEFAULT '[]', -- 引用原文
  sources JSONB DEFAULT '[]', -- 出处
  interpretations TEXT, -- 现代释义
  scholar_analysis TEXT, -- 学者解读
  graph_nodes JSONB DEFAULT '[]', -- 知识图谱节点
  view_count INT DEFAULT 0, -- 查看次数
  is_featured BOOLEAN DEFAULT false, -- 是否精选
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 诗词表
CREATE TABLE IF NOT EXISTS kb_poems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  dynasty TEXT NOT NULL,
  content TEXT NOT NULL, -- 原文
  translation TEXT, -- 白话翻译
  annotation TEXT, -- 注释
  appreciation TEXT, -- 赏析
  background TEXT, -- 创作背景
  category TEXT, -- 分类：叙事、抒情、哲理等
  tags TEXT[], -- 标签
  audio_url TEXT, -- 朗诵音频
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 查询缓存表
CREATE TABLE IF NOT EXISTS kb_query_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_text TEXT NOT NULL,
  response_data JSONB NOT NULL,
  source TEXT DEFAULT 'static', -- static, api, supabase
  expires_at TIMESTAMPTZ, -- 过期时间
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_persons_name ON kb_persons USING gin(to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS idx_books_title ON kb_books USING gin(to_tsvector('simple', title));
CREATE INDEX IF NOT EXISTS idx_knowledge_question ON kb_knowledge_entries USING gin(to_tsvector('simple', question));
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON kb_knowledge_entries(category);
CREATE INDEX IF NOT EXISTS idx_poems_author ON kb_poems USING gin(to_tsvector('simple', author));
CREATE INDEX IF NOT EXISTS idx_poems_title ON kb_poems USING gin(to_tsvector('simple', title));
CREATE INDEX IF NOT EXISTS idx_cache_query ON kb_query_cache(query_text);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON kb_query_cache(expires_at) WHERE expires_at IS NOT NULL;

-- 启用 RLS
ALTER TABLE kb_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_knowledge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_poems ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_query_cache ENABLE ROW LEVEL SECURITY;

-- 允许公开读取
CREATE POLICY "Allow public read" ON kb_persons FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON kb_books FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON kb_knowledge_entries FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON kb_poems FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON kb_query_cache FOR SELECT USING (true);

-- 允许插入更新（仅服务角色）
CREATE POLICY "Service role full access" ON kb_persons FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON kb_books FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON kb_knowledge_entries FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON kb_poems FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON kb_query_cache FOR ALL USING (auth.role() = 'service_role');
