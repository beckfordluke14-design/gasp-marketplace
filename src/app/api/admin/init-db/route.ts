// VERSION: 1.0.5 - ROBUST POOLER SYNC
import { Client } from 'pg';

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
    interaction_seeds JSONB DEFAULT '[]'
);

-- Insert Default Agency
INSERT INTO agencies (id, owner_id, name) 
VALUES ('mi-amor-agency', 'master', 'Mi Amor Agency')
ON CONFLICT DO NOTHING;

-- Ensure likes_count exists for legacy nodes
ALTER TABLE posts ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
`;

export async function GET() {
    console.log('[Admin] Neural Schema Sync Triggered on Pooler...');
    
    // Using the IPv4 Pooler exclusively for cross-network reliability
    const url = 'postgresql://postgres.vvcwjlcequbkhlpmwzlc:eFfE7mXkS3Zc8V9@aws-0-us-west-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true';

    const client = new Client({
        connectionString: url,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        await client.query(INITIAL_SQL);
        console.log('[Admin] Schema Sync Complete.');
        return new Response('Sync Success', { status: 200 });
    } catch (e: any) {
        console.error('[Admin] SYNC FAIL:', e.message);
        return new Response('Sync Failed: ' + e.message, { status: 500 });
    } finally {
        await client.end();
    }
}



