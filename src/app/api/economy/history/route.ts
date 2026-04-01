import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * 🛡️ PAYMENT HISTORY API
 * Returns all purchase transactions for a user, newest first.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });

  try {
    const { rows } = await db.query(
      `SELECT id, amount, type, provider, meta, created_at
       FROM transactions
       WHERE user_id = $1 AND type = 'purchase'
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    );

    return NextResponse.json({ success: true, transactions: rows });
  } catch (err: any) {
    console.error('[PaymentHistory] Error:', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
