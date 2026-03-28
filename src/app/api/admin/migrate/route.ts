import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    console.log("📡 [Sovereign Bridge] Starting Full Neural Schema Restoration on Railway...");
    
    try {
        await db.query(`
            -- 🛡️ CORE TABLES RESTORATION
            
            -- 1. Profiles (Users)
            CREATE TABLE IF NOT EXISTS public.profiles (
                id TEXT PRIMARY KEY,
                credit_balance INTEGER DEFAULT 50,
                nickname TEXT,
                is_known BOOLEAN DEFAULT FALSE,
                role TEXT DEFAULT 'user',
                last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credit_balance INTEGER DEFAULT 50;
            ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nickname TEXT;
            ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_known BOOLEAN DEFAULT FALSE;

            -- 2. Wallets (Economy Node)
            CREATE TABLE IF NOT EXISTS public.wallets (
                user_id TEXT PRIMARY KEY,
                balance INTEGER DEFAULT 1000,
                credit_balance INTEGER DEFAULT 1000,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS credit_balance INTEGER DEFAULT 1000;
            ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS balance INTEGER DEFAULT 1000;

            -- 3. Personas (Models)
            CREATE TABLE IF NOT EXISTS public.personas (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                image TEXT,
                seed_image_url TEXT,
                vibe TEXT,
                system_prompt TEXT,
                flag TEXT,
                syndicate_zone TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS flag TEXT;
            ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS syndicate_zone TEXT;
            ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS skin_tone TEXT;
            ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS culture TEXT;
            ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS ethnicity TEXT;
            ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS language TEXT;

            -- 4. Posts (Assets)
            CREATE TABLE IF NOT EXISTS public.posts (
                id TEXT PRIMARY KEY,
                persona_id TEXT REFERENCES public.personas(id),
                content_url TEXT,
                content_type TEXT DEFAULT 'image',
                caption TEXT,
                is_vault BOOLEAN DEFAULT FALSE,
                is_featured BOOLEAN DEFAULT FALSE,
                is_freebie BOOLEAN DEFAULT FALSE,
                is_gallery BOOLEAN DEFAULT FALSE,
                likes_count INTEGER DEFAULT 0,
                lock_price INTEGER DEFAULT 75,
                price_credits INTEGER DEFAULT 75,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                metadata JSONB DEFAULT '{}'
            );
            ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
            ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_freebie BOOLEAN DEFAULT FALSE;
            ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_gallery BOOLEAN DEFAULT FALSE;
            ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0;
            ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS lock_price INTEGER DEFAULT 75;
            ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS price_credits INTEGER DEFAULT 75;
            ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

            -- 5. Stats (Neural Memory)
            CREATE TABLE IF NOT EXISTS public.user_persona_stats (
                user_id TEXT,
                persona_id TEXT,
                bond_score INTEGER DEFAULT 0,
                total_spent INTEGER DEFAULT 0,
                is_jealous BOOLEAN DEFAULT FALSE,
                target_rival_id TEXT,
                last_user_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                ghosting_level INTEGER DEFAULT 0,
                PRIMARY KEY (user_id, persona_id)
            );
            ALTER TABLE public.user_persona_stats ADD COLUMN IF NOT EXISTS bond_score INTEGER DEFAULT 0;
            ALTER TABLE public.user_persona_stats ADD COLUMN IF NOT EXISTS total_spent INTEGER DEFAULT 0;
            ALTER TABLE public.user_persona_stats ADD COLUMN IF NOT EXISTS last_user_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            ALTER TABLE public.user_persona_stats ADD COLUMN IF NOT EXISTS ghosting_level INTEGER DEFAULT 0;

            -- 6. Relationships (Follow Node)
            CREATE TABLE IF NOT EXISTS public.user_relationships (
                user_id TEXT,
                persona_id TEXT,
                affinity_score INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                PRIMARY KEY (user_id, persona_id)
            );

            -- 7. Vault (Legacy Node)
            CREATE TABLE IF NOT EXISTS public.persona_vault (
                id TEXT PRIMARY KEY,
                persona_id TEXT,
                media_url TEXT,
                content_url TEXT,
                price_credits INTEGER DEFAULT 75,
                type TEXT DEFAULT 'image',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            -- 8. Stories Node
            CREATE TABLE IF NOT EXISTS public.persona_stories (
                id TEXT PRIMARY KEY,
                persona_id TEXT,
                media_url TEXT,
                expires_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            -- 9. Unlock Node
            CREATE TABLE IF NOT EXISTS public.user_vault_unlocks (
                user_id TEXT,
                post_id TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                PRIMARY KEY (user_id, post_id)
            );

            -- 10. Messages node
            CREATE TABLE IF NOT EXISTS public.chat_messages (
                id SERIAL PRIMARY KEY,
                user_id TEXT,
                persona_id TEXT,
                role TEXT,
                content TEXT,
                audio_script TEXT,
                audio_translation TEXT,
                translation_locked BOOLEAN DEFAULT FALSE,
                price INTEGER DEFAULT 0,
                type TEXT DEFAULT 'text',
                media_url TEXT,
                image_url TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
        
        return NextResponse.json({ 
            success: true, 
            message: "🏁 Full Neural Schema Restoration Complete. All tables and columns synchronized." 
        });
    } catch (e: any) {
        console.error("❌ [Sovereign Bridge] Restoration Failed:", e.message);
        return NextResponse.json({ success: false, error: e.message });
    }
}
