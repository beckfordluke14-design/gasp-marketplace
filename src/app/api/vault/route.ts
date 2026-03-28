import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ success: false, error: 'Missing User ID' }, { status: 400 });
  }

  try {
    console.log(`🔓 [Vault API] Fetching collection for: ${userId}`);
    
    // 🛡️ SOVEREIGN QUERY: Joining Unlocks + Posts + Personas
    const queryText = `
      SELECT 
        p.*,
        json_build_object(
          'id', pers.id,
          'name', pers.name,
          'image', pers.seed_image_url
        ) as personas
      FROM user_vault_unlocks u
      INNER JOIN posts p ON u.post_id = p.id
      INNER JOIN personas pers ON p.persona_id = pers.id
      WHERE u.user_id = $1
      ORDER BY u.created_at DESC
    `;

    const { rows: items } = await db.query(queryText, [userId]);

    return NextResponse.json({ 
        success: true, 
        items: items || []
    });
  } catch (e: any) {
    console.error('[Vault API] Fatal:', e.message);
    return NextResponse.json({ success: false, items: [], error: e.message }, { status: 500 });
  }
}
