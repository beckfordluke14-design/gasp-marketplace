import { db } from '@/lib/db';
import { CREDIT_PACKAGES } from '@/lib/economy/constants';

/**
 * ⛽ HELIO SECURE REVENUE NODE (Sovereign Edition)
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

        // 🛡️ ATOMIC SYNC: Universal Ledger Update in Railway
        console.log(`📡 [HELIO WEBHOOK] Processing deposit for user ${userId}...`);

        // --- 2A. Update Wallet Ledger ---
        await db.query(`
            INSERT INTO wallets (user_id, credit_balance, created_at, updated_at)
            VALUES ($1, $2, NOW(), NOW())
            ON CONFLICT (user_id) DO UPDATE SET 
                credit_balance = wallets.credit_balance + EXCLUDED.credit_balance,
                updated_at = NOW()
        `, [userId, totalDeposit]);

        // --- 2B. Update Profile (Airdrop Stake Ledger) ---
        try {
            await db.query(`
                UPDATE profiles SET 
                    total_spent_usd = total_spent_usd + $1,
                    credit_balance = credit_balance + $2,
                    updated_at = NOW()
                WHERE id = $3
            `, [pkg.priceUsd, totalDeposit, userId]);
        } catch (e) {
            console.warn('[HELIO WEBHOOK]: Profile sync failed.', e);
        }

        // 3. Update Public User Table (Legacy Sync)
        await db.query('UPDATE users SET credit_balance = credit_balance + $1 WHERE id = $2', [totalDeposit, userId]);

        // 4. Record Transaction & Audit Ledger
        await db.query(`
            INSERT INTO transactions (user_id, amount, amount_usd, type, provider, external_id, created_at)
            VALUES ($1, $2, $3, 'purchase', 'helio', $4, NOW())
        `, [userId, totalDeposit, pkg.priceUsd, body.transactionReference || 'SOLANA_MAINNET_SYNC']);

        await db.query(`
            INSERT INTO audit_ledger (user_id, action, amount_usd, credits_added, bonus_applied, status, created_at)
            VALUES ($1, 'HELIO_DEPOSIT_v2.0', $2, $3, true, 'SETTLED', NOW())
        `, [userId, pkg.priceUsd, totalDeposit]);

        console.log(`✅ [HELIO WEBHOOK]: Sync Complete. User ${userId} credited with ${totalDeposit} credits. 🛡️`);
        return new Response('Settled', { status: 200 });

    } catch (error: any) {
        console.error('[HELIO WEBHOOK]: Fatal Error:', error.message);
        return new Response('Internal Server Error', { status: 500 });
    }
}
