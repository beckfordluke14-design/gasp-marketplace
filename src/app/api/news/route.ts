import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 📡 Neural Sychronization: Fetch all Intelligence Briefings (Links)
        const { rows: dbPosts } = await db.query(`
            SELECT 
                p.id,
                p.persona_id,
                p.caption as title,
                COALESCE(p.metadata->>'content', p.caption) as content,
                p.created_at,
                p.content_url,
                p.content_type,
                pers.name as persona_name,
                pers.age as persona_age,
                pers.seed_image_url as persona_image,
                pers.city as persona_city,
                p.metadata as persona_meta
            FROM posts p
            JOIN personas pers ON p.persona_id = pers.id
            WHERE p.content_type = 'link'
            ORDER BY p.created_at DESC
            LIMIT 50
        `);

        return NextResponse.json({ success: true, posts: dbPosts || [] });
    } catch (e: any) {
        console.error('❌ [News Sync Failure]:', e.message);
        return NextResponse.json({ success: false, posts: [] }, { status: 500 });
    }
}