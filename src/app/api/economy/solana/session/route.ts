import { NextResponse } from 'next/server';
import { Keypair } from '@solana/web3.js';
import { db } from '@/lib/db';

/**
 * 🛡️ SOVEREIGN P2P SESSION GENERATOR
 * - Reference is generated SERVER-SIDE (not client)
 * - Bound to a specific userId + amount
 * - Expires in 24 hours
 * - One-time use only
 */
export async function POST(req: Request) {
  try {
    const { userId, amountUsd } = await req.json();

    if (!userId || !amountUsd || amountUsd <= 0) {
      return NextResponse.json({ success: false, error: 'INVALID_PAYLOAD' }, { status: 400 });
    }

    if (amountUsd > 30000) {
      return NextResponse.json({ success: false, error: 'EXCEEDS_LIMIT' }, { status: 400 });
    }

    // 🔑 Generate reference SERVER-SIDE — client never controls this
    const reference = Keypair.generate().publicKey.toBase58();

    // 🗄️ Store in DB: bound to userId + amount + expiry
    await db.query(`
      INSERT INTO p2p_sessions (user_id, reference, amount_usd, status, expires_at)
      VALUES ($1, $2, $3, 'pending', NOW() + INTERVAL '24 hours')
      ON CONFLICT (reference) DO NOTHING
    `, [userId, reference, amountUsd]);

    return NextResponse.json({ success: true, reference, amountUsd });

  } catch (err: any) {
    console.error('[P2PSession] Fault:', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * 📡 GET: Look up pending session for a userId
 * Used when user reopens the drawer to resume their payment
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'MISSING_USER' }, { status: 400 });
    }

    const { rows } = await db.query(`
      SELECT reference, amount_usd, created_at, expires_at
      FROM p2p_sessions
      WHERE user_id = $1
        AND status = 'pending'
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `, [userId]);

    if (rows.length === 0) {
      return NextResponse.json({ success: true, session: null });
    }

    return NextResponse.json({ success: true, session: rows[0] });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
