import { db } from '@/lib/db';

/**
 * 🕴️ SOVEREIGN ADMIN OVERRIDE v1.1
 * Objective: Manual Credit Injection for the Platform Owner on Railway.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, amountCredits, reason } = body;

        if (!userId || !amountCredits) {
            return new Response(JSON.stringify({ success: false, error: 'Target ID or Credit Amount Missing.' }), { status: 400 });
        }

        // 2. SECURITY CHECK (DUMMY): In production, replace this with a proper admin auth check.
        // For now, we move forward on Railway without Supabase bridging.


        // 3. FULFILLMENT: Atomically inject credits into Railway DB
        console.log(`[ADMIN_ACTION]: Manual Credit Injection on Railway for User ${userId}. Amount: ${amountCredits}c`);

        // Update Wallet Ledger (UPSERT)
        await db.query(`
            INSERT INTO wallets (user_id, credit_balance, updated_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (user_id) DO UPDATE SET 
                credit_balance = wallets.credit_balance + EXCLUDED.credit_balance,
                updated_at = NOW()
        `, [userId, amountCredits]);

        // Update Profiles Ledger
        await db.query(`
            UPDATE profiles 
            SET credit_balance = credit_balance + $1,
                updated_at = NOW()
            WHERE id = $2
        `, [amountCredits, userId]);

        // 4. THE PERMANENT AUDIT TRAIL (Railway)
        await db.query(`
            INSERT INTO audit_ledger (
                user_id, action, amount_usd, credits_added, status, network, external_id, sender_wallet, memo, created_at
            ) VALUES ($1, 'ADMIN_MANUAL_ADJUSTMENT', 0, $2, 'SETTLED', 'INTERNAL', $3, 'ADMIN_OVERRIDE_HUB', $4, NOW())
        `, [userId, amountCredits, `ADMIN_OVERRIDE_${Date.now()}`, reason || 'Manual Admin Credit Injection']);

        return new Response(JSON.stringify({ success: true, message: `Successfully injected ${amountCredits} credits into User ${userId} on Railway.` }), { status: 200 });

    } catch (e: any) {
        console.error('[Admin Credit Error]:', e.message);
        return new Response(JSON.stringify({ success: false, error: 'Internal Server Error.' }), { status: 500 });
    }
}
