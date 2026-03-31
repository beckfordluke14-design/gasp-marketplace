import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * 🛡️ REGISTER-LINK: Sovereign Railway Identity Migration Node
 * Migrates guest session history to a permanent Privy-verified identity.
 */
export async function POST(req: Request) {
  try {
    const { userId, guestId } = await req.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing Identity Context' }, { status: 400 });
    }

    console.log(`[Identity Link] Forging permanent node for ${userId} on Railway...`);

    // 1. MIGRATE CHAT MEMORY from guest to permanent user
    if (guestId && guestId.startsWith('guest-')) {
      console.log(`[Identity Link] Migrating guest ${guestId} → ${userId}`);
      await db.query('UPDATE chat_messages SET user_id = $1 WHERE user_id = $2', [userId, guestId]);
      await db.query('UPDATE user_persona_stats SET user_id = $1 WHERE user_id = $2', [userId, guestId]);
    }

    // 2. UPSERT PROFILE with Genesis Bonus (1,500 SYSTEM CREDITS)
    await db.query(`
      INSERT INTO profiles (id, credit_balance, created_at, updated_at)
      VALUES ($1, 1500, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `, [userId]);

    return NextResponse.json({
      success: true,
      message: 'Identity linked, history merged, 1,500 Genesis Credits provisioned.',
      user_id: userId
    });

  } catch (error: any) {
    console.error('[Identity Link] Critical Error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
