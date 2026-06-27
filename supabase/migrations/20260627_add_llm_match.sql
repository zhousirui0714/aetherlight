-- Add LLM-audit tracking columns. PATCH on missing columns returns 400 from
-- PostgREST and silently fails (cover_url update that should land alongside
-- the audit metadata gets dropped too). This migration adds the columns
-- so the LLM cover audit can write back verdicts safely.
ALTER TABLE knowledge_articles
  ADD COLUMN IF NOT EXISTS llm_match       BOOLEAN,
  ADD COLUMN IF NOT EXISTS llm_reason      TEXT,
  ADD COLUMN IF NOT EXISTS cover_checked_at TIMESTAMPTZ;
