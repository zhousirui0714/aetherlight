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
