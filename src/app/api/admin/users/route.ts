import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * 🛰️ SOVEREIGN USER ADMINISTRATION (API)
 * Provides high-velocity access to all Profile Nodes and their credit balances.
 * Security: Checked against MASTER_OVERRIDE cookie or API key.
 */
export async function GET(req: Request) {
  try {
    const auth = req.headers.get('Authorization') || req.headers.get('Cookie');
    if (!auth?.includes('syndicate_sovereign_2026_master_override')) {
        return NextResponse.json({ success: false, error: 'Unauthorized Access' }, { status: 401 });
    }

    // 🛡️ RECON: Fetch all HUMAN nodes (did or guest prefixes usually)
    const { rows: users } = await db.query(`
        SELECT id, name, nickname, country, flag, image, credit_balance, updated_at, created_at
        FROM profiles 
        ORDER BY updated_at DESC
        LIMIT 500
    `);

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    console.error('[Admin Users API] Recon Failure:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
    try {
        const { userId, amount, action } = await req.json();
        const auth = req.headers.get('Authorization') || req.headers.get('Cookie');
        if (!auth?.includes('syndicate_sovereign_2026_master_override')) {
            return NextResponse.json({ success: false, error: 'Unauthorized Access' }, { status: 401 });
        }

        if (action === 'adjust_credits') {
            await db.query('BEGIN');
            const { rows: updated } = await db.query(`
                UPDATE profiles 
                SET credit_balance = credit_balance + $1, updated_at = NOW() 
                WHERE id = $2
                RETURNING credit_balance
            `, [amount, userId]);

            await db.query(`
                INSERT INTO transactions (user_id, amount, type, provider, meta, created_at)
                VALUES ($1, $2, 'admin_adjustment', 'syndicate_hq', $3, NOW())
            `, [userId, amount, JSON.stringify({ reason: 'Admin Manual Reconciliation' })]);

            await db.query('COMMIT');
            return NextResponse.json({ success: true, newBalance: updated[0].credit_balance });
        }

        return NextResponse.json({ success: false, error: 'Invalid Action' }, { status: 400 });

    } catch (err: any) {
        await db.query('ROLLBACK');
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
