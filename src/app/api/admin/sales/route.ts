import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * 💹 SOVEREIGN SALES AUDIT (API)
 * Aggregates revenue data from the transactions ledger.
 * Targets: purchase type, manual_remedy type.
 */
export async function GET(req: Request) {
  try {
    const auth = req.headers.get('Authorization') || req.headers.get('Cookie');
    if (!auth?.includes('syndicate_sovereign_2026_master_override')) {
        return NextResponse.json({ success: false, error: 'Unauthorized Access' }, { status: 401 });
    }

    // 🛡️ REVENUE AGGREGATION: Last 30 Days
    const { rows: dailyRevenue } = await db.query(`
        SELECT 
            DATE(created_at) as date,
            SUM((meta->>'amountUsd')::numeric) as volume,
            COUNT(*) as purchases
        FROM transactions 
        WHERE type = 'purchase' 
        AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
    `);

    // 🛡️ TOTAL METRICS
    const { rows: totals } = await db.query(`
        SELECT 
            SUM((meta->>'amountUsd')::numeric) as total_volume,
            COUNT(*) as total_purchases
        FROM transactions 
        WHERE type = 'purchase'
    `);

    // 🛡️ RECENT SALES LOG
    const { rows: recentSales } = await db.query(`
        SELECT 
            t.id,
            t.user_id,
            p.nickname,
            p.image,
            t.amount as credits,
            t.meta->>'amountUsd' as usd,
            t.created_at,
            t.meta->>'txId' as tx_id,
            t.provider
        FROM transactions t
        LEFT JOIN profiles p ON t.user_id = p.id
        WHERE t.type = 'purchase'
        ORDER BY t.created_at DESC
        LIMIT 50
    `);

    return NextResponse.json({ 
        success: true, 
        metrics: {
            totalVolume: parseFloat(totals[0]?.total_volume || '0'),
            totalPurchases: parseInt(totals[0]?.total_purchases || '0'),
            daily: dailyRevenue
        },
        sales: recentSales 
    });

  } catch (error: any) {
    console.error('[Admin Sales API] Audit Failure:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
