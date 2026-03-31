import { db } from '@/lib/db';
import { CREDIT_PACKAGES } from '@/lib/economy/constants';
import { isAdminRequest, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * STRIPE PLACEHOLDER: MOCK CHECKOUT ENGINE (Railway Edition)
 * Objective: Simulate a high-speed successful purchase on the sovereign database.
 */
export async function POST(req: Request) {
  try {
    // 🛡️ SYNDICATE SECURITY: Mock endpoints require Admin clearance
    const isAuthorized = await isAdminRequest(req);
    if (!isAuthorized) return unauthorizedResponse();

    const { userId, packageId } = await req.json();
    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);

    if (!pkg) return new Response('Invalid package', { status: 400 });

    // 1. Simulate Stripe Network Latency (1.5s)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 2. Add Coins via Wallets in Railway (Atomic)
    console.log(`💎 [MockCheckout] Adding ${pkg.credits} coins to User ${userId} on Railway...`);
    
    await db.query(`
        INSERT INTO wallets (user_id, balance, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        ON CONFLICT (user_id) DO UPDATE SET 
            balance = wallets.balance + EXCLUDED.balance,
            updated_at = NOW()
    `, [userId, pkg.credits]);

    // 3. Log Deposit Transaction in Railway
    await db.query(`
        INSERT INTO transactions (user_id, amount, amount_usd, type, provider, created_at)
        VALUES ($1, $2, $3, 'purchase', 'mock_stripe', NOW())
    `, [userId, pkg.credits, pkg.priceUsd]);

    // 4. 🧬 PULSE PROTOCOL: Update Whale Ledger in Railway
    try {
        await db.query(`
            UPDATE profiles 
            SET total_spent_usd = total_spent_usd + $1,
                credit_balance = credit_balance + ($1 * 100),
                updated_at = NOW()
            WHERE id = $2
        `, [pkg.priceUsd, userId]);
    } catch (e) {
      console.warn('[Whale Tracker] Profile update skipped on Railway.');
    }

    return new Response(JSON.stringify({ 
        success: true, 
        package: pkg.label, 
        added: pkg.credits,
        railway_sync: true
    }), { status: 200 });

  } catch (err: any) {
    console.error('[MockCheckout] Fatal Error:', err.message);
    return new Response(err.message, { status: 500 });
  }
}



