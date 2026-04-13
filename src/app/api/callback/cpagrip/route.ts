import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * 🛰️ SYNDICATE POSTBACK ENGINE (CPAGrip)
 * Automatically converts successful surveys into User Credits.
 * Payout Rate: 1,000 credits per $1.00 USD Payout.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    
    // CPAGrip Parameters
    const userId = searchParams.get('uid');
    const payoutRaw = searchParams.get('payout');
    const txId = searchParams.get('txid'); // CPAGrip transaction ID for idempotency

    // Validation
    if (!userId || !payoutRaw || !txId) {
        return NextResponse.json({ success: false, error: 'Missing mandatory tracking parameters' }, { status: 400 });
    }

    const payout = parseFloat(payoutRaw);
    if (isNaN(payout) || payout <= 0) {
        return NextResponse.json({ success: false, error: 'Invalid payout value' }, { status: 400 });
    }

    // 🔱 SYNDICATE PRECISION CALCULATION
    // Rule: Decimals 0.5 and below round DOWN. Above 0.5 rounds UP.
    const totalCredits = (payout % 1 <= 0.5 ? Math.floor(payout) : Math.ceil(payout)) * 1000;

    console.log(`[CPA_CALLBACK] Processing: ${userId} // Payout: $${payout} // Credits: ${totalCredits}`);

    try {
        // 🛡️ IDEMPOTENCY CHECK: Prevent double-funding
        const { rows: existing } = await db.query(
            `SELECT 1 FROM transactions WHERE meta->>'txId' = $1 AND provider = 'cpagrip' LIMIT 1`,
            [txId]
        );

        if (existing.length > 0) {
            return NextResponse.json({ success: true, message: 'Transaction already processed' });
        }

        // 🏗️ ATOMIC FUNDING TRANSACTION
        await db.query('BEGIN');

        // 1. Update User Balance
        await db.query(
            `UPDATE profiles SET 
                credit_balance = credit_balance + $2, 
                updated_at = NOW() 
             WHERE id = $1`,
            [userId, totalCredits]
        );

        // 2. record the transaction for audit/admin logs
        await db.query(
            `INSERT INTO transactions (user_id, amount, type, provider, meta, created_at)
             VALUES ($1, $2, 'reward', 'cpagrip', $3, NOW())`,
            [userId, totalCredits, JSON.stringify({ 
                txId, 
                payoutUsd: payout,
                creditsIssued: totalCredits,
                source: 'survey_locker'
            })]
        );

        await db.query('COMMIT');
        return NextResponse.json({ success: true, creditsIssued: totalCredits });

    } catch (err) {
        await db.query('ROLLBACK');
        console.error('[CPA_CALLBACK_ERROR]:', err);
        return NextResponse.json({ success: false, error: 'Database synchronization failure' }, { status: 500 });
    }
}
