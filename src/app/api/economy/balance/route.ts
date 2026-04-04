import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });

  // 🛡️ SOVEREIGN ADMIN WHITELIST — These IDs ALWAYS have admin clearance
  // The system owner's identity is hardcoded here as a failsafe
  const SOVEREIGN_ADMIN_IDS = new Set([
    'did:privy:cmn8nxsbd016o0cl4ryjg0thn', // Platform Owner (Privy ID)
  ]);

  const isSovereignAdmin = SOVEREIGN_ADMIN_IDS.has(userId || '');

  try {
    // 🛡️ SINGLE SOURCE OF TRUTH: profiles table is the authoritative credit node
    const { rows: profiles } = await db.query(
        'SELECT credit_balance, is_admin, nickname FROM profiles WHERE id = $1 LIMIT 1', 
        [userId]
    );
    if (profiles && profiles.length > 0) {
       return NextResponse.json({ 
         success: true, 
         balance: profiles[0].credit_balance || 0,
         is_admin: profiles[0].is_admin || isSovereignAdmin,
         nickname: profiles[0].nickname || null
       });
    }
    
    // Fallback for Guest Nodes — also check sovereign whitelist
    return NextResponse.json({ 
      success: true, 
      balance: 0,
      is_admin: isSovereignAdmin,
      is_guest: !isSovereignAdmin
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
    const { userId, action, amount, type, meta, payload } = await req.json();
    if (!userId) return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });

    try {
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

        // ── ACTION: IDENTITY SYNC (Capture Email for Re-engagement) ──
        if (action === 'sync') {
            const { email, nickname } = payload || {};
            if (!email) return NextResponse.json({ success: false, error: 'Email required for sync' }, { status: 400 });

            console.log(`📡 [Identity] Syncing Node: ${userId} (${email})`);

            await db.query(`
                INSERT INTO profiles (id, email, nickname, updated_at)
                VALUES ($1, $2, $3, NOW())
                ON CONFLICT (id) DO UPDATE SET 
                    email = COALESCE(profiles.email, EXCLUDED.email),
                    nickname = COALESCE(profiles.nickname, EXCLUDED.nickname),
                    updated_at = NOW()
            `, [userId, email, nickname]);

            return NextResponse.json({ success: true, message: 'Identity Synced' });
        }

        return NextResponse.json({ success: false, error: 'Invalid Action' }, { status: 400 });
    } catch (e: any) {
        console.error('[Economy] Action Failure:', e.message);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
