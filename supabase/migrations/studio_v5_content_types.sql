-- GASP STUDIO V5: Content Type Migration
-- Expand posts.content_type constraint to support voice, vault types
-- Also ensure interaction_seeds column exists for ghost logic

ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_content_type_check;
ALTER TABLE posts ADD CONSTRAINT posts_content_type_check 
  CHECK (content_type IN ('text', 'image', 'video', 'voice', 'vault'));

-- Add interaction_seeds column if missing (used by ghost_logic.ts)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS interaction_seeds JSONB DEFAULT '[]';

-- Ensure all core personas are indexable
CREATE INDEX IF NOT EXISTS idx_personas_agency ON personas(agency_id);
CREATE INDEX IF NOT EXISTS idx_posts_persona_type ON posts(persona_id, content_type);
CREATE INDEX IF NOT EXISTS idx_posts_vault ON posts(is_vault, persona_id);

