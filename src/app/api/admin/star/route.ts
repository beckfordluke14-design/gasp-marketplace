import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { postId, personaId, newState, caption, videoUrl, imageUrl, type, isVault } = await req.json();
    console.log(`[Neural Admin Sync] Cloud-Etching Node on Railway: ${postId} to state: ${newState}`);

    // Railway UPSERT logic
    await db.query(`
        INSERT INTO posts (id, persona_id, content_url, content_type, caption, is_vault, is_burner, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (id) DO UPDATE SET 
            is_burner = EXCLUDED.is_burner,
            caption = COALESCE(EXCLUDED.caption, posts.caption),
            updated_at = NOW()
    `, [
        postId, 
        personaId, 
        videoUrl || imageUrl, 
        type || 'image', 
        caption, 
        isVault || false, 
        newState || false
    ]);

    return NextResponse.json({ success: true, message: "🏁 Node state etched into Railway cloud." });
  } catch (e: any) {
    console.error('[Neural Admin Failure]:', e.message);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}



