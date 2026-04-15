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
  // 🧬 UNIVERSAL ID RESOLVE (V8.0)
  const rawId = personaIdRaw.toLowerCase();
  const baseId = rawId.replace('-locked', '');
  const shortId = baseId.split('-')[0];

  try {
    // 🛡️ TEASER ENGINE: Precision & Fallback Search
    const queryText = `
      SELECT 
        p.*,
        EXISTS (
          SELECT 1 FROM user_vault_unlocks u 
          WHERE u.post_id = p.id AND u.user_id = $4
        ) as is_unlocked
      FROM posts p
      WHERE (LOWER(p.persona_id) = $1 OR LOWER(p.persona_id) = $2 OR LOWER(p.persona_id) = $3) 
        AND p.is_vault = TRUE
      ORDER BY p.created_at DESC
    `;

    const { rows: items } = await db.query(queryText, [rawId, baseId, shortId, userId || 'GUEST_0']);

    return NextResponse.json({ 
        success: true, 
        items: items || []
    });
  } catch (e: any) {
    console.error('[Vault Teaser API] Fatal:', e.message);
    return NextResponse.json({ success: false, items: [], error: e.message }, { status: 500 });
  }
}
