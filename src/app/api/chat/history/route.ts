import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * 🛰️ RAILWAY HISTORY API v5.53 (Neural PersistenceNode)
 * Purpose: Fetch character-by-character dialogue and high-fidelity voice notes from Railway PostgreSQL.
 */

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const personaId = searchParams.get('personaId');

    if (!userId || !personaId) {
       return NextResponse.json({ success: false, error: 'Missing Identity Context' }, { status: 400 });
    }

    const { rows } = await db.query(
        'SELECT id, role, content, media_url, audio_script, created_at FROM chat_messages WHERE user_id = $1 AND persona_id = $2 ORDER BY created_at ASC LIMIT 50',
        [userId, personaId]
    );

    return NextResponse.json({
        success: true,
        messages: rows.map(m => ({
            id: m.id,
            role: m.role,
            content: m.content,
            audio_url: m.media_url,
            audio_script: m.audio_script,
            createdAt: m.created_at
        }))
    });

  } catch (error: any) {
    console.error('[Railway History Sync Fail]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
