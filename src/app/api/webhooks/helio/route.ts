import { db } from '@/lib/db';
import { CREDIT_PACKAGES } from '@/lib/economy/constants';

/**
 * ⛽ HELIO SECURE REVENUE NODE (Sovereign Edition)
 * Strategy: Direct crypto settlement with 1:1 GASP Point matching.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const userId = body.meta?.customer_id;
        const packageId = body.meta?.package_id;
        
        if (!userId || !packageId) {
            console.error('[HELIO WEBHOOK]: Missing Metadata Node', body);
            return new Response('Missing Metadata', { status: 400 });
        }

        const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
        if (!pkg) {
            console.error('[HELIO WEBHOOK]: Invalid Package Cluster', packageId);
            return new Response('Invalid Package', { status: 400 });
        }

        const baseCredits = pkg.credits;
        const cryptoBonus = Math.floor(baseCredits * 0.15); // 15% Bonus for Sovereign Settlement
        const totalDeposit = baseCredits + cryptoBonus;

        console.log(`📡 [HELIO WEBHOOK] Processing deposit for user ${userId}...`);

        const client = await db.connect();
        try {
            await client.query('BEGIN');

            const externalId = body.transactionReference || body.id || 'HELIO_MISSING_ID_' + Date.now();

            // 🛡️ IDEMPOTENCY CHECK: Prevent double-minting
            const { rowCount } = await client.query(
                `SELECT 1 FROM transactions WHERE external_id = $1`,
                [externalId]
            );

            if (rowCount && rowCount > 0) {
                await client.query('ROLLBACK');
                console.log(`⚠️ [HELIO] Idempotency catch: Transaction ${externalId} already fulfilled.`);
                return new Response('Already Settled', { status: 200 });
            }

            // 1. Update Profile (Central Ledger)
            await client.query(`
                UPDATE profiles SET 
                    total_spent_usd = total_spent_usd + $1,
                    credit_balance = credit_balance + $2,
                    updated_at = NOW()
                WHERE id = $3
            `, [pkg.priceUsd, totalDeposit, userId]);

            // 2. Sync Legacy Tables (Redundant but safe)
            await client.query(`
                INSERT INTO wallets (user_id, credit_balance, created_at, updated_at)
                VALUES ($1, $2, NOW(), NOW())
                ON CONFLICT (user_id) DO UPDATE SET 
                    credit_balance = wallets.credit_balance + EXCLUDED.credit_balance,
                    updated_at = NOW()
            `, [userId, totalDeposit]);

            await client.query('UPDATE users SET credit_balance = credit_balance + $1 WHERE id = $2', [totalDeposit, userId]);
            
            // 🔥 SYNDICATE 1:1 MATCH & SHADOW BURN
            const { recordShadowBurn } = await import('@/lib/db');
            await recordShadowBurn(userId, totalDeposit, client);

            // 3. Record Audit Ledger
            await client.query(`
                INSERT INTO transactions (user_id, amount, amount_usd, type, provider, external_id, created_at)
                VALUES ($1, $2, $3, 'purchase', 'helio', $4, NOW())
            `, [userId, totalDeposit, pkg.priceUsd, externalId]);

            await client.query('COMMIT');
            console.log(`✅ [HELIO WEBHOOK]: Sync Complete. User ${userId} +${totalDeposit} credits.`);
            return new Response('Settled', { status: 200 });

        } catch (e) {
            if (client) await client.query('ROLLBACK');
            console.error('[HELIO WEBHOOK]: Atomic Sync Failure:', e);
            return new Response('Sync Error', { status: 500 });
        } finally {
            client.release();
        }

    } catch (error: any) {
        console.error('[HELIO WEBHOOK]: Fatal Error:', error.message);
        return new Response('Internal Server Error', { status: 500 });
    }
}
