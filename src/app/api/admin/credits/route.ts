import { db, recordShadowBurn } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * ⛽ SYNDICATE ADMIN DISPATCH (Sovereign Grant Node)
 * Allows admins to manually inject credits and trigger matching.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, credits, triggerBurn } = body;

        if (!userId || !credits) {
            return NextResponse.json({ error: 'Missing Target Operative or Credit Load' }, { status: 400 });
        }

        const client = await db.connect();
        try {
            await client.query('BEGIN');

            const totalGrant = Math.abs(parseInt(credits, 10));
            if (isNaN(totalGrant) || totalGrant <= 0) {
                return NextResponse.json({ error: 'Invalid Credit Delta Verified' }, { status: 400 });
            }
            
            // 1. Update Core Wallets (Multi-Ledger Sync)
            await client.query(`
                INSERT INTO wallets (user_id, credit_balance, created_at, updated_at)
                VALUES ($1, $2, NOW(), NOW())
                ON CONFLICT (user_id) DO UPDATE SET 
                    credit_balance = wallets.credit_balance + EXCLUDED.credit_balance,
                    updated_at = NOW()
            `, [userId, totalGrant]);

            await client.query(
                'UPDATE profiles SET credit_balance = credit_balance + $1, updated_at = NOW() WHERE id = $2',
                [totalGrant, userId]
            );

            await client.query('UPDATE users SET credit_balance = credit_balance + $1 WHERE id = $2', [totalGrant, userId]);

            // 2. Optional: Trigger Syndicate Protocol (Points/Burn)
            // This is vital for manual testing of the dashboard hype.
            if (triggerBurn) {
                await recordShadowBurn(userId, totalGrant, client);
            }

            // 3. Record Admin Event
            await client.query(`
                INSERT INTO transactions (user_id, amount, type, provider, meta, created_at)
                VALUES ($1, $2, 'admin_grant', 'manual_syndicate', $3, NOW())
            `, [userId, totalGrant, JSON.stringify({ admin_action: 'true', manual_grant: 'true' })]);

            await client.query('COMMIT');
            return NextResponse.json({ 
                success: true, 
                msg: `Handshake Verified: ${totalGrant} credits dispatched to Operative ${userId}` 
            });

        } catch (dbErr) {
            await client.query('ROLLBACK');
            console.error('[Admin Dispatch] Node Failure:', dbErr);
            return NextResponse.json({ error: 'Database Node Failure' }, { status: 500 });
        } finally {
            client.release();
        }

    } catch (err: any) {
        console.error('[Admin API] Fatal Error:', err.message);
        return NextResponse.json({ error: 'Fatal Protocol Failure' }, { status: 500 });
    }
}
