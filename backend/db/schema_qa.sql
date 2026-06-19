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
