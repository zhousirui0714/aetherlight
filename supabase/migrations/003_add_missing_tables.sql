-- ============================================================
-- 溯光 Aetherlight · 补充建表脚本（增量）
-- 执行位置: Supabase Dashboard → SQL Editor
-- 说明：补充 profiles / 收藏 / 问答历史 / 创作 / 答题得分等表
-- ============================================================

-- ============================================================
-- 1. 用户资料表 profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname    TEXT        NOT NULL DEFAULT '访客',
    avatar_url  TEXT,
    interests   TEXT[]      NOT NULL DEFAULT '{}',
    onboarded   BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_public_read"
    ON profiles FOR SELECT USING (true);

CREATE POLICY "profiles_user_own"
    ON profiles FOR UPDATE USING (auth.uid() = id);

-- 自动创建 profile 的触发器函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, nickname)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nickname', '访客'));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. 通用收藏表 favorites
-- ============================================================
CREATE TABLE IF NOT EXISTS favorites (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_type   TEXT        NOT NULL,
    item_id     TEXT        NOT NULL,
    item_title  TEXT,
    item_cover  TEXT,
    item_excerpt TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_type ON favorites(item_type);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites_user_own"
    ON favorites FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 3. 问答历史表 qa_history
-- ============================================================
CREATE TABLE IF NOT EXISTS qa_history (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question    TEXT        NOT NULL,
    answer      TEXT        NOT NULL,
    category    TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qa_history_user ON qa_history(user_id);
CREATE INDEX IF NOT EXISTS idx_qa_history_created ON qa_history(created_at DESC);

ALTER TABLE qa_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qa_history_user_own"
    ON qa_history FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 4. 艺术创作表 creations
-- ============================================================
CREATE TABLE IF NOT EXISTS creations (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type        TEXT        NOT NULL CHECK (type IN ('image','music')),
    prompt      TEXT        NOT NULL,
    style       TEXT        NOT NULL DEFAULT '',
    url         TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creations_user ON creations(user_id);
CREATE INDEX IF NOT EXISTS idx_creations_type ON creations(type);
CREATE INDEX IF NOT EXISTS idx_creations_created ON creations(created_at DESC);

ALTER TABLE creations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "creations_user_own"
    ON creations FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 5. 答题得分表 quiz_scores
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_scores (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    score       INTEGER     NOT NULL DEFAULT 0,
    total       INTEGER     NOT NULL DEFAULT 0,
    category    TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_scores_user ON quiz_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_scores_score ON quiz_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_scores_created ON quiz_scores(created_at DESC);

ALTER TABLE quiz_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quiz_scores_public_read"
    ON quiz_scores FOR SELECT USING (true);

CREATE POLICY "quiz_scores_user_write"
    ON quiz_scores FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 6. 每日推送表 daily_pushes
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_pushes (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    push_date   DATE        NOT NULL UNIQUE,
    title       TEXT        NOT NULL,
    excerpt     TEXT        NOT NULL,
    content     TEXT        NOT NULL DEFAULT '',
    cover       TEXT,
    category    TEXT,
    item_id     TEXT,
    item_type   TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_pushes_date ON daily_pushes(push_date DESC);

ALTER TABLE daily_pushes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_pushes_public_read"
    ON daily_pushes FOR SELECT USING (true);

-- ============================================================
-- 7. 文化历程事件表 journey_events
-- ============================================================
CREATE TABLE IF NOT EXISTS journey_events (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type        TEXT        NOT NULL,
    title       TEXT        NOT NULL DEFAULT '',
    description TEXT        NOT NULL DEFAULT '',
    category    TEXT        NOT NULL DEFAULT '',
    metadata    JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journey_events_user ON journey_events(user_id);
CREATE INDEX IF NOT EXISTS idx_journey_events_type ON journey_events(type);
CREATE INDEX IF NOT EXISTS idx_journey_events_created ON journey_events(created_at DESC);

ALTER TABLE journey_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "journey_events_user_own"
    ON journey_events FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 8. 批注表 annotations
-- ============================================================
CREATE TABLE IF NOT EXISTS annotations (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id      TEXT        NOT NULL,
    user_id         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name       TEXT        NOT NULL DEFAULT '访客',
    user_avatar     TEXT,
    content         TEXT        NOT NULL,
    selected_text   TEXT,
    start_offset   INTEGER,
    end_offset     INTEGER,
    category        TEXT        NOT NULL DEFAULT '',
    likes          INTEGER     NOT NULL DEFAULT 0,
    is_public       BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_annotations_article ON annotations(article_id);
CREATE INDEX IF NOT EXISTS idx_annotations_user ON annotations(user_id);
CREATE INDEX IF NOT EXISTS idx_annotations_public ON annotations(is_public) WHERE is_public = TRUE;

ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;

-- 公开批注：任何人可读
CREATE POLICY "annotations_public_read"
    ON annotations FOR SELECT USING (is_public = TRUE OR auth.uid() = user_id);

-- 用户可管理自己的批注
CREATE POLICY "annotations_user_manage"
    ON annotations FOR ALL USING (auth.uid() = user_id);
