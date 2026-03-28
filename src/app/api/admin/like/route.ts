import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { postId } = await req.json();
    console.log(`[Neural Like Hub] Incrementing Node on Railway: ${postId}`);

    // Atomic increment logic in SQL
    const { rows } = await db.query(
        'UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1 RETURNING likes_count',
        [postId]
    );

    const newCount = rows[0]?.likes_count || 0;

    return NextResponse.json({ success: true, likes: newCount });
  } catch (e: any) {
    console.error('[Neural Like Failure]:', e.message);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}



