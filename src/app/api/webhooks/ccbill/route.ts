import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CREDIT_PACKAGES } from '@/lib/economy/constants';

export const dynamic = 'force-dynamic';

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
    const amountStr = body.get('accountingAmount') as string; // Actual USD amount (e.g. 99.99)
    const transactionId = body.get('subscriptionId') as string; // CCBill unique ID
    const amount = Number(amountStr || '0');

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

    // 2. ATOMIC SYNC: Credit Wallet in Railway
    console.log(`💎 [CCBill Webhook] Crediting Wallet for User ${userId}...`);
    await db.query(`
        INSERT INTO wallets (user_id, credit_balance, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (user_id) DO UPDATE SET 
            credit_balance = wallets.credit_balance + EXCLUDED.credit_balance,
            updated_at = NOW()
    `, [userId, pkg.credits]);

    // 3. 🧬 THE AIRDROP LEDGER: Log $GASPAI Activity (1:1 Loyalty Model)
    try {
        await db.query(`
            UPDATE profiles 
            SET total_spent_usd = total_spent_usd + $1,
                credit_balance = credit_balance + ($1 * 100),
                updated_at = NOW()
            WHERE id = $2
        `, [amount, userId]);
    } catch (e) {
        console.warn('[CCBill Airdrop] Dashboard update skipped.');
    }

    // 4. Record Transaction in Railway
    await db.query(`
        INSERT INTO transactions (user_id, amount, amount_usd, type, provider, external_id, created_at)
        VALUES ($1, $2, $3, 'purchase', 'ccbill', $4, NOW())
    `, [userId, pkg.credits, amount, transactionId]);

    console.log(`✅ [CCBill Webhook] Sync Complete. User ${userId} credited with ${pkg.credits} credits.`);
    return NextResponse.json({ success: true, message: 'Sync Complete' });

  } catch (err: any) {
    console.error('❌ [CCBill Webhook] Fatal Exception:', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}



