-- 1. CREATE VOICE CACHE TABLE
CREATE TABLE IF NOT EXISTS voice_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text_hash TEXT NOT NULL UNIQUE,
    voice_id TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ENABLE RLS (Row Level Security) - Optional based on project security stage
-- ALTER TABLE voice_cache DISABLE ROW LEVEL SECURITY;

-- 3. VOX_HISTORY INTEGRATION (For chat-specific voice messages)
-- Note: chat_messages already has a 'type' column. We will extend its 'media_url' usage.
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS content_type TEXT CHECK (content_type IN ('text', 'image', 'video', 'voice'));

