-- GASP CREATOR FACTORY INITIALIZATION (BEYOND BORDERS v2)
-- Objective: Scaling the social and transactional layer of the Mi Amor Agency.

-- 1. Agencies (The Production Houses)
CREATE TABLE IF NOT EXISTS agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Personas (The Individual Sovereigns)
CREATE TABLE IF NOT EXISTS personas (
    id TEXT PRIMARY KEY, -- Unique Persona Slug (e.g. xio-reyes)
    agency_id UUID REFERENCES agencies(id),
    name TEXT NOT NULL,
    age INTEGER,
    city TEXT,
    country TEXT,
    race TEXT,
    accent_profile TEXT, -- ny_dominican, miami_latina, etc.
    vibe TEXT,
    system_prompt TEXT,
    seed_image_url TEXT,
    voice_sample_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Cultural Posts (The Public Feed)
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id TEXT REFERENCES personas(id),
    content_type TEXT CHECK (content_type IN ('text', 'image', 'video', 'voice')),
    content_url TEXT,
    caption TEXT,
    is_vault BOOLEAN DEFAULT FALSE,
    is_burner BOOLEAN DEFAULT FALSE,
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Chat Architecture (The Neural Sync)
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL, -- guest token or authenticating ID
    persona_id TEXT REFERENCES personas(id),
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    image_url TEXT,
    type TEXT DEFAULT 'text',
    price INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. User Wallets (Virtual Economy)
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT UNIQUE NOT NULL,
    balance INTEGER DEFAULT 1000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Relationship & Bond Progression
CREATE TABLE IF NOT EXISTS user_persona_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    persona_id TEXT REFERENCES personas(id),
    bond_score INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, persona_id)
);

-- 7. Voice Bank (Reference Hub)
CREATE TABLE IF NOT EXISTS voice_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    accent_profile TEXT UNIQUE,
    reference_audio_url TEXT NOT NULL
);

-- Performance Sync Indexes
CREATE INDEX IF NOT EXISTS idx_posts_scheduled ON posts(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_personas_active ON personas(is_active);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(user_id, persona_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
!!
