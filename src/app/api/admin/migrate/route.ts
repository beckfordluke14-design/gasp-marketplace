import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    console.log("📡 [Sovereign Bridge] Starting Neural Schema Update on Railway...");
    
    try {
        await db.query(`
            -- 1. Posts Enhancements
            ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
            ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_freebie BOOLEAN DEFAULT FALSE;
            ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_gallery BOOLEAN DEFAULT FALSE;
            ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0;
            ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
            ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
            
            -- 2. Stats Enhancements (Neural Bridge)
            ALTER TABLE public.user_persona_stats ADD COLUMN IF NOT EXISTS bond_score INTEGER DEFAULT 0;
            ALTER TABLE public.user_persona_stats ADD COLUMN IF NOT EXISTS total_spent INTEGER DEFAULT 0;
            ALTER TABLE public.user_persona_stats ADD COLUMN IF NOT EXISTS last_user_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            ALTER TABLE public.user_persona_stats ADD COLUMN IF NOT EXISTS ghosting_level INTEGER DEFAULT 0;
            
            -- 3. Persona Enhancements
            ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS syndicate_zone TEXT;
            ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS skin_tone TEXT;
            ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS culture TEXT;
            ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS ethnicity TEXT;
            ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS language TEXT;
        `);
        
        return NextResponse.json({ success: true, message: "🏁 Neural Schema Updated on Railway. is_featured Active." });
    } catch (e: any) {
        console.error("❌ [Sovereign Bridge] Migration Failed:", e.message);
        return NextResponse.json({ success: false, error: e.message });
    }
}



