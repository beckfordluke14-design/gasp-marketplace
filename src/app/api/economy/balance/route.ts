import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });

  try {
    // 🛡️ SINGLE SOURCE OF TRUTH: profiles table is the authoritative credit node
    const { rows: profiles } = await db.query(
        'SELECT credit_balance FROM profiles WHERE id = $1 LIMIT 1', 
        [userId]
    );
    if (profiles && profiles.length > 0) {
       return NextResponse.json({ success: true, balance: profiles[0].credit_balance || 0 });
    }
    
    // Fallback for Guest Nodes
    return NextResponse.json({ 
      success: true, 
      balance: 0,
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
    const { userId, action, amount, type, meta } = await req.json();
    if (!userId) return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });

    try {
        // 🛡️ AUTO-MIGRATE: Ensure transactions ledger exists on first use
        await db.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                user_id TEXT NOT NULL,
                amount INTEGER NOT NULL,
                type TEXT NOT NULL,
                provider TEXT DEFAULT 'syndicate_core',
                description TEXT,
                meta JSONB DEFAULT '{}',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `).catch(() => {}); // Non-blocking — already exists is fine
        // ── ACTION: SPEND CREDITS ──
        if (action === 'spend') {
            if (!amount || amount <= 0) return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });

            // Atomic deduction: only succeeds if balance >= amount
            const { rows: updated } = await db.query(`
                UPDATE profiles 
                SET credit_balance = credit_balance - $1, updated_at = NOW()
                WHERE id = $2 AND credit_balance >= $1
                RETURNING credit_balance
            `, [amount, userId]);

            if (updated.length === 0) {
                const { rows: check } = await db.query('SELECT credit_balance FROM profiles WHERE id = $1', [userId]);
                const currentBal = check[0]?.credit_balance ?? 0;
                return NextResponse.json({ 
                    success: false, 
                    error: 'Insufficient Balance', 
                    balance: currentBal 
                }, { status: 402 });
            }

            // Log transaction
            try {
                await db.query(`
                    INSERT INTO transactions (user_id, amount, type, provider, meta, created_at)
                    VALUES ($1, $2, $3, 'syndicate_core', $4, NOW())
                `, [userId, amount, type || 'spend', JSON.stringify(meta || {})]);
            } catch (logErr: any) {
                console.warn('[Economy] Transaction log failed (non-blocking):', logErr.message);
            }

            return NextResponse.json({ success: true, balance: updated[0].credit_balance });
        }

        // ── ACTION: STARTER CLAIM ──
        if (action === 'starter_claim') {
            console.log(`🏦 [Economy] Processing Starter Claim (1,500 bp) for ${userId}...`);
            
            const clientIP = req.headers.get('x-forwarded-for') || 'unknown';

            // Fault-tolerant duplicate check — table may not exist on first claim
            let alreadyClaimed = false;
            try {
                const { rows: claims } = await db.query(
                    `SELECT 1 FROM transactions 
                     WHERE (user_id = $1 OR meta->>'ip' = $2) 
                     AND type = 'starter_claim' 
                     AND created_at > NOW() - INTERVAL '24 hours'
                     LIMIT 1`,
                    [userId, clientIP]
                );
                alreadyClaimed = claims && claims.length > 0;
            } catch {
                alreadyClaimed = false; // Table missing = no prior claims
            }

            if (alreadyClaimed) {
               return NextResponse.json({ success: false, error: 'Genesis bonus already claimed on this device.' }, { status: 403 });
            }

            await db.query('BEGIN');
            try {
                await db.query(`
                    UPDATE profiles 
                    SET credit_balance = credit_balance + 1500, updated_at = NOW()
                    WHERE id = $1
                `, [userId]);

                await db.query(`
                    INSERT INTO transactions (user_id, amount, type, provider, meta, created_at)
                    VALUES ($1, 1500, 'starter_claim', 'syndicate_genesis', $2, NOW())
                `, [userId, JSON.stringify({ ip: clientIP })]);

                await db.query('COMMIT');
                return NextResponse.json({ success: true, message: 'Genesis Credits Claimed' });
            } catch (err) {
                await db.query('ROLLBACK');
                throw err;
            }
        }

        return NextResponse.json({ success: false, error: 'Invalid Action' }, { status: 400 });
    } catch (e: any) {
        console.error('[Economy] Action Failure:', e.message);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
