import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * 🔱 SOVEREIGN REVENUE AUDIT API v1.0
 * Strategy: Real-time oversight of all capital ingress (Stripe + P2P).
 * Security: Administrative Master Override Required.
 */

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    // 🔒 SECURITY CHECK: Master Override Sync
    if (token !== 'syndicate_sovereign_2026_master_override') {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED_ACCESS' }, { status: 401 });
    }

    // 1. Calculate Total Gross USD Revenue
    const { rows: revenueData } = await db.query(`
      SELECT 
        SUM((meta->>'actualAmountUsd')::numeric) as total_usd,
        SUM(amount) as total_credits,
        COUNT(id) as total_transactions
      FROM transactions
      WHERE type = 'purchase'
    `);

    // 2. Fetch Recent Transactions with Identification
    const { rows: transactions } = await db.query(`
      SELECT 
        id,
        user_id,
        amount as credits,
        (meta->>'actualAmountUsd')::numeric as amount_usd,
        provider,
        created_at
      FROM transactions
      WHERE type = 'purchase'
      ORDER BY created_at DESC
      LIMIT 100
    `);

    // 3. Identify The Whale Tier (Top Spenders)
    const { rows: whales } = await db.query(`
      SELECT 
        user_id,
        SUM((meta->>'actualAmountUsd')::numeric) as total_spent_usd,
        COUNT(id) as purchase_count
      FROM transactions
      WHERE type = 'purchase'
      GROUP BY user_id
      ORDER BY total_spent_usd DESC
      LIMIT 20
    `);

    return NextResponse.json({
      success: true,
      stats: {
        grossUsd: revenueData[0].total_usd || 0,
        grossCredits: revenueData[0].total_credits || 0,
        transactionCount: revenueData[0].total_transactions || 0
      },
      transactions,
      whales
    });

  } catch (err: any) {
    console.error('[RevenueAudit] Failure:', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
