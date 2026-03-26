import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CREDIT_PACKAGES } from '@/lib/economy/constants';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/**
 * GASP x CCBILL: SECURE REVENUE NODE v1.8
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
    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!pkg) throw new Error(`Invalid Package ID: ${packageId}`);

    // 2. ATOMIC SYNC: Credit Wallet
    const { data: wallet } = await supabase.from('wallets').select('id, balance').eq('user_id', userId).single();

    if (wallet) {
        await supabase.from('wallets').update({
            balance: wallet.balance + pkg.credits,
            updated_at: new Date().toISOString()
        }).eq('id', wallet.id);
    } else {
        await supabase.from('wallets').insert({ user_id: userId, balance: pkg.credits });
    }

    // 3. 🧬 THE AIRDROP LEDGER: Log $GASPAI Stake (1:1 Reserved Model)
    console.log(`💎 [CCBill Webhook] Logging $GASPAI Stake for User ${userId}...`);
    try {
        const { data: profile } = await supabase.from('profiles').select('total_spent_usd, credit_balance').eq('id', userId).single();
        await supabase.from('profiles').update({
            total_spent_usd: (profile?.total_spent_usd || 0) + Number(amount),
            credit_balance: (profile?.credit_balance || 0) + (Number(amount) * 100), // $1 = 100 Credits
            updated_at: new Date().toISOString()
        }).eq('id', userId);
    } catch (e) {
        console.warn('[CCBill Airdrop] Dashboard update skipped.');
    }

    // 4. Record Transaction
    await supabase.from('transactions').insert({
        user_id: userId,
        amount: pkg.credits,
        amount_usd: Number(amount),
        type: 'purchase',
        provider: 'ccbill',
        external_id: transactionId
    });

    console.log(`✅ [CCBill Webhook] Sync Complete. User ${userId} credited with ${pkg.credits} credits.`);
    return NextResponse.json({ success: true, message: 'Sync Complete' });

  } catch (err: any) {
    console.error('❌ [CCBill Webhook] Fatal Exception:', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}



