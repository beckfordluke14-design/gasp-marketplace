import { createClient } from '@supabase/supabase-js';
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

        // 1. Initialize Service-Role Client (Maintain for Legacy Auth Handshake)
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 2. SECURITY CHECK: Verify the requester is an Admin
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return new Response(JSON.stringify({ success: false, error: 'Unauthorized.' }), { status: 401 });

        // Get the user from the token (Supabase Auth Node)
        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user) return new Response(JSON.stringify({ success: false, error: 'Identity Verification Failed.' }), { status: 401 });

        // Check for Admin Flag in Railway Profile
        const { rows: profiles } = await db.query('SELECT is_admin FROM profiles WHERE id = $1', [user.id]);
        const profile = profiles[0];
        
        if (!profile?.is_admin) {
            console.warn(`[SECURITY_BREACH_ATTEMPT]: User ${user.email} tried to inject manual credits. 🛑`);
            return new Response(JSON.stringify({ success: false, error: 'Access Denied. Admiral Clearance Required.' }), { status: 403 });
        }

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
        `, [userId, amountCredits, `ADMIN_${user.id}_${Date.now()}`, reason || 'Manual Admin Credit Injection']);

        return new Response(JSON.stringify({ success: true, message: `Successfully injected ${amountCredits} credits into User ${userId} on Railway.` }), { status: 200 });

    } catch (e: any) {
        console.error('[Admin Credit Error]:', e.message);
        return new Response(JSON.stringify({ success: false, error: 'Internal Server Error.' }), { status: 500 });
    }
}
