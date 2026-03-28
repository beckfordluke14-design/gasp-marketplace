import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });

  try {
    // 🛡️ SOVEREIGN ACCURACY protocol: Exhaustive search for the authoritative credit node
    
    // 🛸 Step 1: Check the Native Neural Wallet (Railway format)
    const { rows: wallets } = await db.query(
        'SELECT * FROM wallets WHERE user_id = $1 LIMIT 1', 
        [userId]
    );
    if (wallets && wallets.length > 0) {
      const w = wallets[0];
      const balance = w.credit_balance !== undefined ? w.credit_balance : (w.balance || 0);
      return NextResponse.json({ success: true, balance });
    }

    // 🛸 Step 2: Check the Legacy Auth Profile (Supabase/Hybrid format)
    const { rows: profiles } = await db.query(
        'SELECT credit_balance FROM profiles WHERE id = $1 LIMIT 1', 
        [userId]
    );
    if (profiles && profiles.length > 0) {
       return NextResponse.json({ success: true, balance: profiles[0].credit_balance || 0 });
    }
    
    // 🛸 Step 3: Explicit fallback for Guest Nodes
    // Guests start with 1,000 Credits ($1.00 Value)
    return NextResponse.json({ 
      success: true, 
      balance: 1000,
      is_guest: true
    });

  } catch (error: any) {
    console.error('[Balance API] Pulse Failure:', error.message);
    return NextResponse.json({ 
      success: false, 
      error: `Neural Sync Failure: ${error.message}` 
    }, { status: 500 });
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
