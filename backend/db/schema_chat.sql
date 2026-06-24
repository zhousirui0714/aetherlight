-- chat_sessions
CREATE TABLE IF NOT EXISTS chat_sessions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), character_id TEXT NOT NULL, user_id UUID, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_cs_user ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cs_char ON chat_sessions(character_id);

-- chat_messages
CREATE TABLE IF NOT EXISTS chat_messages (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE, role TEXT NOT NULL CHECK (role IN ('user','assistant','system')), content TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_cm_session ON chat_messages(session_id);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cs_public_read" ON chat_sessions FOR SELECT USING (true);
CREATE POLICY "cs_auth_write" ON chat_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "cm_public_read" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "cm_auth_write" ON chat_messages FOR INSERT WITH CHECK (true);
