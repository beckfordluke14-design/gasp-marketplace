// VERSION: 1.1.0 - RAILWAY SOVEREIGN SYNC
import { db } from '@/lib/db';
import { isAdminRequest, unauthorizedResponse } from '@/lib/auth';

const INITIAL_SQL = `
-- 1. Agencies (Friendly ID)
CREATE TABLE IF NOT EXISTS agencies (
    id TEXT PRIMARY KEY, 
    owner_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Personas (Friendly ID)
CREATE TABLE IF NOT EXISTS personas (
    id TEXT PRIMARY KEY,
    agency_id TEXT REFERENCES agencies(id),
    name TEXT NOT NULL,
    age INTEGER,
    city TEXT,
    country TEXT,
    race TEXT,
    accent_profile TEXT,
    personality TEXT DEFAULT 'nice',
    vibe TEXT,
    system_prompt TEXT,
    seed_image_url TEXT,
    voice_sample_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Posts
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id TEXT REFERENCES personas(id),
    content_type TEXT CHECK (content_type IN ('text', 'image', 'video')),
    content_url TEXT,
    caption TEXT,
    is_vault BOOLEAN DEFAULT FALSE,
    is_burner BOOLEAN DEFAULT FALSE,
    likes_count INTEGER DEFAULT 0,
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    interaction_seeds JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}'
);

-- 4. Memories (Railway Neural Core)
CREATE TABLE IF NOT EXISTS persona_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    persona_id TEXT REFERENCES personas(id),
    memory_text TEXT NOT NULL,
    embedding vector(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Default Agency
INSERT INTO agencies (id, owner_id, name) 
VALUES ('mi-amor-agency', 'master', 'Mi Amor Agency')
ON CONFLICT DO NOTHING;

-- Ensure likes_count exists for legacy nodes
ALTER TABLE posts ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
`;

export async function GET(req: Request) {
    // 🛡️ SYNDICATE SECURITY: Verify Sovereign Admin Clearance
    const isAuthorized = await isAdminRequest(req);
    if (!isAuthorized) return unauthorizedResponse();

    console.log('[Sovereign Sync] Initializing Railway Neural Schema...');
    
    try {
        await db.query(INITIAL_SQL);
        console.log('[Sovereign Sync] Database Schema Synchronized on Railway.');
        return new Response('Neural Sync Success', { status: 200 });
    } catch (e: any) {
        console.error('[Sovereign Sync] SYNC FAIL:', e.message);
        return new Response('Neural Sync Failed: ' + e.message, { status: 500 });
    }
}



