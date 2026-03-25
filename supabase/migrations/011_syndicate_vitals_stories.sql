-- 011_syndicate_vitals_stories.sql
-- Implementing the Hybrid Asset Router for Story/Vital FOMO

CREATE TABLE IF NOT EXISTS persona_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id TEXT REFERENCES personas(id),
    asset_url TEXT NOT NULL,
    type TEXT CHECK (type IN ('image', 'video', 'vault')),
    category TEXT CHECK (category IN ('MORNING', 'GYM', 'NIGHT', 'CHILL')),
    is_premium BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Track daily generated assets for caching (one per category per day)
CREATE TABLE IF NOT EXISTS daily_asset_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id TEXT REFERENCES personas(id),
    category TEXT NOT NULL,
    asset_url TEXT NOT NULL,
    created_date DATE DEFAULT CURRENT_DATE,
    UNIQUE(persona_id, category, created_date)
);

COMMENT ON TABLE persona_stories IS 'The Vitals feed. Stores 24-hour expiring stories generated via the Hybrid Router.';
COMMENT ON TABLE daily_asset_cache IS 'Caches AI-generated assets to prevent redundant API spend for same-day stories.';

