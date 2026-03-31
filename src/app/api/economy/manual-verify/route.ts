import { db } from '@/lib/db';
import { CREDIT_PACKAGES } from '@/lib/economy/constants';
import { NextResponse } from 'next/server';

/**
 * 🛰️ SOVEREIGN HANDSHAKE VERIFIER
 * Objective: Log manual USDC/SOL transaction hashes for admin verification.
 * Strategy: Record user intent and tx signature to prevent revenue leakage.
 */
export async function POST(req: Request) {
  try {
    const { userId, packageId, signature } = await req.json();

    if (!userId || !packageId || !signature) {
      return NextResponse.json({ success: false, error: 'Missing Protocol Context' }, { status: 400 });
    }

    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!pkg) {
      return NextResponse.json({ success: false, error: 'Invalid Package Tier' }, { status: 400 });
    }

    console.log(`[Handshake Log] User ${userId} submitted TX: ${signature} for ${pkg.label}`);

    // 🛡️ RECORD PENDING TRANSACTION
    // We store this with a 'pending' type so it doesn't grant credits yet, but appears in audit logs.
    await db.query(`
      INSERT INTO transactions (user_id, amount, amount_usd, type, provider, external_id, meta, created_at)
      VALUES ($1, $2, $3, 'pending_deposit', 'manual_solana', $4, $5, NOW())
    `, [
      userId, 
      pkg.credits, 
      pkg.priceUsd, 
      signature, 
      JSON.stringify({ 
        packageId, 
        label: pkg.label,
        status: 'awaiting_confirmation'
      })
    ]);

    return NextResponse.json({ 
      success: true, 
      message: 'Handshake logged in Syndicate Treasury. Standing by for block finality.' 
    });

  } catch (error: any) {
    console.error('[Handshake Log] Critical Failure:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
