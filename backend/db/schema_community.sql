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
