-- 009_syndicate_shadow_feed.sql
-- Implementing the Jealousy Engine & Public Lead Magnet (FOMO)

-- 1. Metadata for Persona Awareness
ALTER TABLE user_persona_stats
ADD COLUMN IF NOT EXISTS is_jealous BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS target_rival_id TEXT REFERENCES personas(id),
ADD COLUMN IF NOT EXISTS last_feed_post_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Public Feed Posts (The Shadow Feed)
CREATE TABLE IF NOT EXISTS public_feed_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id TEXT REFERENCES personas(id),
    user_target_id TEXT NOT NULL, -- The user this post is 'stalking' or targeting
    content TEXT NOT NULL,
    media_url TEXT, -- Vault asset
    type TEXT CHECK (type IN ('jealousy', 'hook', 'fomo')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON COLUMN public_feed_posts.user_target_id IS 'Specific user targeted by this lead magnet post';
COMMENT ON COLUMN public_feed_posts.persona_id IS 'Persona generating the FOMO/Jealousy post';

