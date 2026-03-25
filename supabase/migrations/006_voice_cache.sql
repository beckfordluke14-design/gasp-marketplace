-- Migration: Create voice_cache table
-- Description: Stores hashed audio generations to save ElevenLabs credits and reduce latency.

CREATE TABLE IF NOT EXISTS public.voice_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text_hash TEXT NOT NULL,
    voice_id TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(text_hash, voice_id)
);

-- Enable RLS
ALTER TABLE public.voice_cache ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (audio URLs are public)
CREATE POLICY "Allow public read access on voice_cache"
    ON public.voice_cache
    FOR SELECT
    USING (true);

-- Allow service role to insert
CREATE POLICY "Allow service role to insert into voice_cache"
    ON public.voice_cache
    FOR INSERT
    WITH CHECK (true);

