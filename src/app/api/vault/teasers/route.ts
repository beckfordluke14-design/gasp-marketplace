import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const personaIdRaw = searchParams.get('personaId');
  const userId = searchParams.get('userId');

  if (!personaIdRaw) {
    return NextResponse.json({ success: false, error: 'Missing Persona ID' }, { status: 400 });
  }
  
  // 🧬 SLUG STRIP: Handle Funnel-specific suffixes (e.g. -locked)
  // 🧬 SMART ID MAPPING
  const baseId = personaIdRaw.toLowerCase().replace('-locked', '');
  const shortId = baseId.split('-')[0]; // e.g. "veronica"

  try {
    // 🛡️ TEASER ENGINE: Fetch posts matching either the full slug or the short name
    const queryText = `
      SELECT 
        p.*,
        EXISTS (
          SELECT 1 FROM user_vault_unlocks u 
          WHERE u.post_id = p.id AND u.user_id = $3
        ) as is_unlocked
      FROM posts p
      WHERE (p.persona_id = $1 OR p.persona_id = $2) 
        AND p.is_vault = TRUE
      ORDER BY p.created_at DESC
    `;

    const { rows: items } = await db.query(queryText, [baseId, shortId, userId || 'GUEST_0']);

    return NextResponse.json({ 
        success: true, 
        items: items || []
    });
  } catch (e: any) {
    console.error('[Vault Teaser API] Fatal:', e.message);
    return NextResponse.json({ success: false, items: [], error: e.message }, { status: 500 });
  }
}
