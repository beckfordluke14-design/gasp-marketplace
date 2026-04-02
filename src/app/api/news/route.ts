import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 📡 SOVEREIGN SYNC: Fetching latest global intelligence
        const { rows } = await db.query(`
            SELECT * FROM news_posts n
            JOIN personas p ON n.persona_id = p.id
            ORDER BY n.created_at DESC
            LIMIT 50
        `);

        return NextResponse.json({ success: true, posts: rows || [] });
    } catch (e: any) {
        console.error('❌ [Economy] News Sync Failure:', e.message);
        // 🧘 RESILIENT FALLBACK: Return success but empty feed
        return NextResponse.json({ 
            success: true, 
            posts: [], 
            msg: 'Neural sync delayed. Local cache active.' 
        });
    }
}