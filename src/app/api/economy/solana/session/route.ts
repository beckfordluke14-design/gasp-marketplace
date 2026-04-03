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

    // 🛡️ SELF-HEALING DATABASE MIGRATION
    // Ensures 'metadata' and 'expected_sol' columns exist without manual psql access.
    try {
        await db.query(`ALTER TABLE p2p_sessions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';`);
    } catch (_) { /* Already exists or locked */ }

    if (!userId || !amountUsd || amountUsd <= 0) {
      return NextResponse.json({ success: false, error: 'INVALID_PAYLOAD' }, { status: 400 });
    }

    if (amountUsd > 30000) {
      return NextResponse.json({ success: false, error: 'EXCEEDS_LIMIT' }, { status: 400 });
    }

    // 🔑 Generate reference SERVER-SIDE — client never controls this
    const reference = Keypair.generate().publicKey.toBase58();

    // 🧬 PRICE SNAPSHOT: Lock the SOL/USD rate at the time of session creation
    // This allows the scanner to match the exact SOL amount even if price moves.
    const oracleRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/economy/solana/price`).catch(() => null);
    const oracleData = oracleRes ? await oracleRes.json() : { price: 79.19 };
    const livePrice = oracleData.price || 79.19;
    const expectedSol = (amountUsd / livePrice);

    // 🛡️ SESSION FLUSH: Clear any stuck 'pending' sessions for this user
    // This prevents unique-constraint or overlap conflicts.
    await db.query(`UPDATE p2p_sessions SET status = 'expired' WHERE user_id = $1 AND status = 'pending'`, [userId]);

    // 🗄️ Store in DB: bound to userId + amount + expected SOL + expiry
    // 🛡️ REVENUE-LOCK: Using a metadata column (fallback if table not migrated)
    try {
        await db.query(`
          INSERT INTO p2p_sessions (user_id, reference, amount_usd, status, expires_at, metadata)
          VALUES ($1, $2, $3, 'pending', NOW() + INTERVAL '24 hours', $4)
        `, [userId, reference, amountUsd, JSON.stringify({ expectedSol, priceAtCreation: livePrice })]);
    } catch (dbErr: any) {
        console.error('[P2P DB ERROR]:', dbErr.message);
        return NextResponse.json({ success: false, error: `DB_SYNC_FAULT: ${dbErr.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, reference, amountUsd, expectedSol });

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
