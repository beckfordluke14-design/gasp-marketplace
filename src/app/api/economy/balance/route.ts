import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });

  try {
    const { rows: profiles } = await db.query('SELECT credit_balance FROM profiles WHERE id = $1 LIMIT 1', [userId]);
    const profile = profiles[0];
    
    return NextResponse.json({ success: true, balance: profile?.credit_balance || 0 });
  } catch (error: any) {
    console.error('[Balance API] Pulse Failure:', error.message);
    return NextResponse.json({ success: false, balance: 0, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
    const { userId, action } = await req.json();
    if (!userId) return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });

    try {
        if (action === 'starter_claim') {
            console.log(`🏦 [Economy] Processing Starter Claim (5000 bp) for ${userId}...`);
            
            // ATOMIC TRANSACTION: Claim Credits & Log Ledger
            await db.query('BEGIN');
            try {
                // 1. Credit the Profile
                await db.query(`
                    UPDATE profiles 
                    SET credit_balance = credit_balance + 5000,
                        updated_at = NOW()
                    WHERE id = $1
                `, [userId]);

                // 2. Log Transaction
                await db.query(`
                    INSERT INTO transactions (user_id, amount, type, provider, created_at)
                    VALUES ($1, 5000, 'starter_claim', 'syndicate_genesis', NOW())
                `, [userId]);

                await db.query('COMMIT');
                return NextResponse.json({ success: true, message: 'Genesis Credits Claimed' });
            } catch (err) {
                await db.query('ROLLBACK');
                throw err;
            }
        }
        return NextResponse.json({ success: false, error: 'Invalid Action' }, { status: 400 });
    } catch (e: any) {
        console.error('[Economy] Claim Failure:', e.message);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
