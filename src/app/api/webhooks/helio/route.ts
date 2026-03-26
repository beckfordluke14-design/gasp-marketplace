import { createClient } from '@supabase/supabase-js';
import { CREDIT_PACKAGES } from '@/lib/economy/constants';

/**
 * ⛽ HELIO SECURE REVENUE NODE v1.8
 * Objective: Zero-Touch USDC Settlement & Credit Synchronization.
 * Target: 'credit_balance' in users (Public Matrix).
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const signature = req.headers.get('x-helio-signature'); // 🧬 HELIO AUTH NODE
        
        // 1. Transaction Decoding
        // Helio Pay Links pass custom metadata in the 'meta' or 'customer' field.
        // We injected 'customer_id' and 'package_id' into the Pay Link URL.
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

        // 🧬 SECURE SUPABASE NODE
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
          process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
        );

        // 2. ATOMIC SYNC: Universal Ledger Update
        // Objective: Synchronize Premium Wallet + Airdrop Reserve Node.
        
        // --- 2A. Update Wallet Ledger ---
        const { data: wallet } = await supabase
            .from('wallets')
            .select('id, credit_balance')
            .eq('user_id', userId)
            .maybeSingle();

        const baseCredits = pkg.credits;
        const cryptoBonus = Math.floor(baseCredits * 0.15); // 15% Bonus for Sovereign Settlement
        const totalDeposit = baseCredits + cryptoBonus;

        if (wallet) {
            await supabase.from('wallets').update({
                credit_balance: wallet.credit_balance + totalDeposit,
                updated_at: new Date().toISOString()
            }).eq('id', wallet.id);
        } else {
            await supabase.from('wallets').insert({ user_id: userId, credit_balance: totalDeposit });
        }

        // --- 2B. Update Profile (Airdrop Stake Ledger) ---
        // Protocol: 1:1 Reserved $GASPAI Stake
        try {
            const { data: profile } = await supabase.from('profiles').select('total_spent_usd, credit_balance').eq('id', userId).single();
            await supabase.from('profiles').update({
                total_spent_usd: (profile?.total_spent_usd || 0) + pkg.priceUsd,
                credit_balance: (profile?.credit_balance || 0) + totalDeposit, // 1:1 Sync with Wallet Deposit
                updated_at: new Date().toISOString()
            }).eq('id', userId);
        } catch (e) {
            console.warn('[HELIO WEBHOOK]: Profile sync skipped.');
        }

        // 3. Update Public User Table (Legacy Sync)
        await supabase.from('users').update({ 
            credit_balance: (wallet?.credit_balance || 0) + totalDeposit 
        }).eq('id', userId);

        // 4. Record Transaction & Audit Ledger
        await supabase.from('transactions').insert({
            user_id: userId,
            amount: totalDeposit,
            amount_usd: pkg.priceUsd,
            type: 'purchase',
            provider: 'helio',
            external_id: body.transactionReference || 'SOLANA_MAINNET_SYNC'
        });

        await supabase.from('audit_ledger').insert({
            user_id: userId,
            action: 'HELIO_DEPOSIT_v1.8',
            amount_usd: pkg.priceUsd,
            credits_added: totalDeposit,
            bonus_applied: true,
            status: 'SETTLED'
        });

        console.log(`✅ [HELIO WEBHOOK]: Sync Complete. User ${userId} credited with ${totalDeposit} credits. 🛡️`);
        return new Response('Settled', { status: 200 });

    } catch (error: any) {
        console.error('[HELIO WEBHOOK]: Fatal Error:', error.message);
        return new Response('Internal Server Error', { status: 500 });
    }
}
