-- 添加 image_prompt 字段到 daily_pushes 表
ALTER TABLE IF EXISTS daily_pushes 
ADD COLUMN IF NOT EXISTS image_prompt TEXT;