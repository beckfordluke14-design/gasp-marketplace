import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * 🛰️ SYNDICATE COMMAND BRIDGE v1.0
 * Objective: Centralize news and reply payloads for the Remote Hijacker.
 */

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const key = searchParams.get('key');
        if (key !== (process.env.CRON_SECRET || 'gasp_sovereign_intelligence')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Check for Pending High-Heat Briefings (Articles)
        const { rows: articles } = await db.query(`
            SELECT p.id, p.caption as title, p.metadata->>'content' as analysis, pers.name as persona_name
            FROM posts p
            JOIN personas pers ON p.persona_id = pers.id
            WHERE p.content_type = 'link'
            AND pers.is_active = true
            AND (p.metadata->>'tweeted' IS NULL OR p.metadata->>'tweeted' = 'false')
            ORDER BY p.created_at DESC
            LIMIT 1
        `);

        if (articles.length > 0) {
            const art = articles[0];
            const content = `${art.title}\n\nFull Intel: https://gasp.fun/news?id=${art.id}`;
            
            return NextResponse.json({ 
                type: 'POST_ARTICLE', 
                id: art.id,
                payload: content 
            });
        }

        return NextResponse.json({ type: 'IDLE', message: 'No pending tactical commands.' });

    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

/**
 * 🛡️ MARK AS DISPATCHED
 */
export async function POST(req: Request) {
    try {
        const { id } = await req.json();
        const { rows: post } = await db.query('SELECT metadata FROM posts WHERE id = $1', [id]);
        const metadata = { ...(post[0]?.metadata || {}), tweeted: true, tweeted_at: new Date().toISOString() };
        await db.query('UPDATE posts SET metadata = $1 WHERE id = $2', [JSON.stringify(metadata), id]);
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message });
    }
}
