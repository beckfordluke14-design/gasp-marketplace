import { createClient } from '@supabase/supabase-js';
export const dynamic = 'force-dynamic';
import { COIN_PACKAGES } from '@/lib/economy/constants';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/**
 * STRIPE PLACEHOLDER: MOCK CHECKOUT ENGINE
 * Objective: Simulate a high-speed successful purchase for local testing.
 */
export async function POST(req: Request) {
  try {
    const { userId, packageId } = await req.json();
    const pkg = COIN_PACKAGES.find(p => p.id === packageId);

    if (!pkg) return new Response('Invalid package', { status: 400 });

    // 1. Simulate Stripe Network Latency (1.5s)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 2. Add Coins via Wallets
    // In production, we'd use 'upsert' or 'rpc' for atomic updates
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', userId)
      .single();

    if (walletError && walletError.code !== 'PGRST116') throw walletError;

    if (!wallet) {
      // First time purchaser: Create Wallet
      await supabase.from('wallets').insert({
        user_id: userId,
        balance: pkg.coins
      });
    } else {
      // Update existing balance
      await supabase
        .from('wallets')
        .update({ balance: wallet.balance + pkg.coins, updated_at: new Date().toISOString() })
        .eq('id', wallet.id);
    }

    // 3. Log Deposit Transaction
    await supabase.from('transactions').insert({
      user_id: userId,
      amount: pkg.coins,
      type: 'purchase'
    });

    // 4. 🧬 PULSE PROTOCOL: Update Whale Ledger (Future Airdrop Track)
    try {
      // In production, users should have total_spent_usd and pulse_points columns
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('total_spent_usd, pulse_points')
        .eq('id', userId)
        .single();

      await supabase
        .from('profiles')
        .update({
          total_spent_usd: (currentProfile?.total_spent_usd || 0) + pkg.priceUsd,
          pulse_points: (currentProfile?.pulse_points || 0) + (pkg.priceUsd * 100), // $1 = 100 Points
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
    } catch (e) {
      console.warn('[Whale Tracker] Profile update skipped - check column existence.');
    }

    return new Response(JSON.stringify({ 
        success: true, 
        package: pkg.label, 
        added: pkg.coins 
    }), { status: 200 });

  } catch (err: any) {
    console.error('[MockCheckout] Fatal Error:', err);
    return new Response(err.message, { status: 500 });
  }
}



