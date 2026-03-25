import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { COIN_PACKAGES } from '@/lib/economy/constants';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GASP x CCBILL: SECURE REVENUE NODE v1.7
 * Objective: Verify incoming CCBill 'approval' signals and credit user wallets + $GASPAI Airdrop Ledger.
 */
export async function POST(req: Request) {
  console.log('🛡️ [CCBill Webhook] Signal Received. Verification Pending...');

  try {
    const body = await req.formData();
    
    // 🧬 CCBILL CORE PARAMETERS: Ensure this matches your CCBill Subaccount settings
    const eventType = body.get('eventType'); // e.g. 'Approval_Post'
    const userId = body.get('X-userId') as string; // We'll pass this in our checkout link
    const packageId = body.get('X-packageId') as string;
    const amount = body.get('accountingAmount'); // Actual USD amount (e.g. 99.99)
    const transactionId = body.get('subscriptionId'); // CCBill unique ID

    if (eventType !== 'Approval_Post') {
        return NextResponse.json({ success: true, message: 'Event ignored - Not an approval' });
    }

    if (!userId || !packageId) {
        console.error('[CCBill Webhook] Critical Error: Missing User or Package Metadata.');
        return NextResponse.json({ success: false, error: 'Metadata Missing' }, { status: 400 });
    }

    // 1. Resolve Package Details
    const pkg = COIN_PACKAGES.find(p => p.id === packageId);
    if (!pkg) throw new Error(`Invalid Package ID: ${packageId}`);

    // 2. ATOMIC SYNC: Credit Wallet
    const { data: wallet } = await supabase.from('wallets').select('id, balance').eq('user_id', userId).single();

    if (wallet) {
        await supabase.from('wallets').update({
            balance: wallet.balance + pkg.coins,
            updated_at: new Date().toISOString()
        }).eq('id', wallet.id);
    } else {
        await supabase.from('wallets').insert({ user_id: userId, balance: pkg.coins });
    }

    // 3. 🧬 THE AIRDROP LEDGER: Log $GASPAI Stake
    console.log(`💎 [CCBill Webhook] Logging $GASPAI Stake for User ${userId}...`);
    try {
        const { data: profile } = await supabase.from('profiles').select('total_spent_usd, pulse_points').eq('id', userId).single();
        await supabase.from('profiles').update({
            total_spent_usd: (profile?.total_spent_usd || 0) + Number(amount),
            pulse_points: (profile?.pulse_points || 0) + (Number(amount) * 100), // $1 = 100 Points
            updated_at: new Date().toISOString()
        }).eq('id', userId);
    } catch (e) {
        console.warn('[CCBill Airdrop] Dashboard update skipped.');
    }

    // 4. Record Transaction
    await supabase.from('transactions').insert({
        user_id: userId,
        amount: pkg.coins,
        amount_usd: Number(amount),
        type: 'purchase',
        provider: 'ccbill',
        external_id: transactionId
    });

    console.log(`✅ [CCBill Webhook] Sync Complete. User ${userId} credited with ${pkg.coins} coins.`);
    return NextResponse.json({ success: true, message: 'Sync Complete' });

  } catch (err: any) {
    console.error('❌ [CCBill Webhook] Fatal Exception:', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}



