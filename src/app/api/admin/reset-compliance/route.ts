import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const COMPLIANCE_EMAIL = 'compliance@gasp.fun';
    console.log('[Compliance Admin] Initiating Railway State Reset Sequence...');

    // STEP A: Find or create compliance user profile in Railway
    const { rows: existing } = await db.query(
      'SELECT id FROM profiles WHERE email = $1 LIMIT 1', [COMPLIANCE_EMAIL]
    );

    let userId: string;
    if (existing.length > 0) {
      userId = existing[0].id;
    } else {
      const { rows: newUser } = await db.query(
        `INSERT INTO profiles (id, email, credit_balance, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, 0, NOW(), NOW()) RETURNING id`,
        [COMPLIANCE_EMAIL]
      );
      userId = newUser[0].id;
    }

    // STEP B: Reset credit balance to 10,000 Breathe Points
    await db.query(
      'UPDATE profiles SET credit_balance = 10000, updated_at = NOW() WHERE id = $1', [userId]
    );

    // STEP C: Relock all vaults
    await db.query('DELETE FROM user_unlocked_vaults WHERE user_id = $1', [userId]);

    // STEP D: Seed mock vault items across active personas
    const { rows: allPersonas } = await db.query('SELECT id, name FROM personas WHERE is_active = true');

    if (allPersonas.length > 0) {
      const mockPrompts = [
        { prompt: 'cute doodle of a glowing star, pink background, simple sketch', cap: 'my little lucky star ✨', price: 500 },
        { prompt: '3d emoji render of a cute angry face, neon lighting, glossy', cap: 'mood right now 😡', price: 1000 },
        { prompt: 'aesthetic polaroid sketch with a heart drawn in lipstick, soft lighting', cap: 'sealed with a kiss 💋', price: 2000 }
      ];

      for (const p of allPersonas) {
        for (const item of mockPrompts) {
          const { rows: existing } = await db.query(
            'SELECT id FROM posts WHERE persona_id = $1 AND is_vault = true AND price = $2',
            [p.id, item.price]
          );
          if (existing.length === 0) {
            const encoded = encodeURIComponent(item.prompt + ' ' + p.name);
            const drawUrl = `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&nologo=true&seed=${Math.floor(Math.random() * 9999)}`;
            await db.query(
              'INSERT INTO posts (persona_id, content_type, caption, content_url, price, is_vault, created_at) VALUES ($1, $2, $3, $4, $5, true, NOW())',
              [p.id, 'vault', item.cap, drawUrl, item.price]
            );
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Compliance Review Account reset on Railway: 10,000 BP with locked vault state.',
      user_id: userId
    });

  } catch (error: any) {
    console.error('[Compliance Admin] Critical Reset Error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
