import { createClient } from '@supabase/supabase-js';

/**
 * 🕴️ SOVEREIGN ADMIN OVERRIDE v1.0
 * Objective: Manual Credit Injection for the Platform Owner.
 * Security: Restricted to Admin-Role Users via Supabase Auth + Ledger Audit.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, amountCredits, reason } = body;

        if (!userId || !amountCredits) {
            return new Response(JSON.stringify({ success: false, error: 'Target ID or Credit Amount Missing.' }), { status: 400 });
        }

        // 1. Initialize Service-Role Client (The Master Key)
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 2. SECURITY CHECK: Verify the requester is an Admin
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return new Response(JSON.stringify({ success: false, error: 'Unauthorized.' }), { status: 401 });

        // Get the user from the token
        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user) return new Response(JSON.stringify({ success: false, error: 'Identity Verification Failed.' }), { status: 401 });

        // Check for Admin Flag in Profile
        const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
        if (!profile?.is_admin) {
            console.warn(`[SECURITY_BREACH_ATTEMPT]: User ${user.email} tried to inject manual credits. 🛑`);
            return new Response(JSON.stringify({ success: false, error: 'Access Denied. Admiral Clearance Required.' }), { status: 403 });
        }

        // 3. FULFILLMENT: Atomically inject credits
        console.log(`[ADMIN_ACTION]: Manual Credit Injection for User ${userId}. Amount: ${amountCredits}c`);

        // Update Wallet Ledger
        const { data: wallet } = await supabase.from('wallets').select('id, credit_balance').eq('user_id', userId).maybeSingle();
        if (wallet) {
            await supabase.from('wallets').update({ credit_balance: wallet.credit_balance + amountCredits }).eq('id', wallet.id);
        } else {
            await supabase.from('wallets').insert({ user_id: userId, credit_balance: amountCredits });
        }

        // Update Profiles Ledger
        const { data: userProfile } = await supabase.from('profiles').select('credit_balance').eq('id', userId).single();
        await supabase.from('profiles').update({ 
            credit_balance: (userProfile?.credit_balance || 0) + amountCredits 
        }).eq('id', userId);

        // 4. THE PERMANENT AUDIT TRAIL
        await supabase.from('audit_ledger').insert({
            user_id: userId,
            action: 'ADMIN_MANUAL_ADJUSTMENT',
            amount_usd: 0,
            credits_added: amountCredits,
            status: 'SETTLED',
            network: 'INTERNAL',
            external_id: `ADMIN_${user.id}_${Date.now()}`,
            sender_wallet: 'ADMIN_OVERRIDE_HUB',
            memo: reason || 'Manual Admin Credit Injection'
        });

        return new Response(JSON.stringify({ success: true, message: `Successfully injected ${amountCredits} credits into User ${userId}.` }), { status: 200 });

    } catch (e: any) {
        return new Response(JSON.stringify({ success: false, error: 'Internal Server Error.' }), { status: 500 });
    }
}
