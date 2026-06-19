CREATE TABLE IF NOT EXISTS poems (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    dynasty TEXT,
    type TEXT NOT NULL,
    paragraphs TEXT[],
    rhythmic TEXT,
    tags TEXT[],
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE poems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "poems_public_read" ON poems FOR SELECT USING (true);
CREATE POLICY "poems_auth_write" ON poems FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_poems_author ON poems(author);
CREATE INDEX IF NOT EXISTS idx_poems_dynasty ON poems(dynasty);
CREATE INDEX IF NOT EXISTS idx_poems_type ON poems(type);
CREATE INDEX IF NOT EXISTS idx_poems_tags ON poems USING GIN(tags);