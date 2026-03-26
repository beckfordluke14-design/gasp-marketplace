-- FREEBIE DROPS: tracks which user already received which freebie post
-- Prevents the same image from ever being sent twice to the same user

-- 1. Add is_freebie column to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_freebie boolean DEFAULT false;

-- 2. Tracking table (same pattern as user_vault_unlocks)
CREATE TABLE IF NOT EXISTS user_freebie_drops (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     text NOT NULL,
  persona_id  text NOT NULL,
  post_id     uuid NOT NULL,
  trigger     text,          -- 'gift' | 'bond_milestone' | 'mood' | 'welcome'
  sent_at     timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_freebie_drops_unique
  ON user_freebie_drops (user_id, post_id);

CREATE INDEX IF NOT EXISTS user_freebie_drops_user
  ON user_freebie_drops (user_id, persona_id);
