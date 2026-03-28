import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    console.log("📡 [Sovereign Bridge] Starting Neural Schema Update on Railway...");
    
    try {
        await db.query(`
            ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
            ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0;
            ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
            ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
        `);
        
        return NextResponse.json({ success: true, message: "🏁 Neural Schema Updated on Railway. is_featured Active." });
    } catch (e: any) {
        console.error("❌ [Sovereign Bridge] Migration Failed:", e.message);
        return NextResponse.json({ success: false, error: e.message });
    }
}



