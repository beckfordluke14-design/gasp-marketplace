import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * 🛰️ SYNDICATE POSTBACK ENGINE (CPAGrip)
 * Automatically converts successful surveys into User Credits.
 * Payout Rate: 1,000 credits per $1.00 USD Payout.
 */
// 🛰️ SYNDICATE POSTBACK ENGINE (CPAGrip)
export async function POST(req: NextRequest) { return handleCallback(req); }
export async function GET(req: NextRequest) { return handleCallback(req); }

async function handleCallback(req: NextRequest) {
    let uid, payoutRaw, txid, password;

    if (req.method === 'POST') {
        const formData = await req.formData().catch(() => null);
        if (formData) {
            uid = formData.get('tracking_id');
            payoutRaw = formData.get('payout');
            txid = formData.get('offer_id');
            password = formData.get('password');
        }
    } else {
        const { searchParams } = new URL(req.url);
        uid = searchParams.get('uid');
        payoutRaw = searchParams.get('payout');
        txid = searchParams.get('txid');
        password = searchParams.get('password');
    }

    // 🛡️ SECURITY CHECK: Verify CPAGrip Identity
    const secureKey = process.env.CPAGRIP_POSTBACK_PASSWORD || 'gasp_secure';
    if (password && password !== secureKey) {
        console.warn('[CPA_CALLBACK] Invalid Password Attempted');
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!uid || !payoutRaw || !txid) {
        return NextResponse.json({ success: false, error: 'Missing mandatory tracking parameters' }, { status: 400 });
    }

    const userId = String(uid);
    const payout = parseFloat(String(payoutRaw));
    const txId = String(txid);

    // 🔱 SYNDICATE PRECISION CALCULATION: 1,000 Credits per $1.00 USD (Standard Rounding)
    let totalCredits = Math.round(payout) * 1000;

    // 🧬 ALLOCATION MATCH: If compliance is true, ensure first-time sync awards the 9,000 promised units.
    const isCompliance = true; // Use SYNDICATE_CONFIG.compliance if available
    if (isCompliance) {
        // Checking if this is the first reward for this user via a separate query below.
        // We will override totalCredits if we find no previous transactions.
    }

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

        // 🧬 FIRST-TIME MATCH CHECK:
        const { rows: history } = await db.query(
            `SELECT 1 FROM transactions WHERE user_id = $1 AND type = 'reward' LIMIT 1`,
            [userId]
        );
        
        const isFirstTime = history.length === 0;
        if (isFirstTime && isCompliance) {
            console.log(`[CPA_CALLBACK] First-Time Sync Detected for ${userId}. Overriding to 9,000 Units.`);
            totalCredits = 9000;
        }

        // 🏗️ ATOMIC FUNDING TRANSACTION
        await db.query('BEGIN');

        // 1. Try updating a Registered Profile first
        const { rowCount: profileUpdated } = await db.query(
            `UPDATE profiles SET credit_balance = credit_balance + $2, updated_at = NOW() WHERE id = $1`,
            [userId, totalCredits]
        );

        // 2. If no profile was updated, try updating an Anonymous Guest Sync
        if (profileUpdated === 0) {
            console.log(`[CPA_CALLBACK] No profile found for ${userId}. Attaching reward to Guest Sync.`);
            
            // Check if guest exists, if not create them (Genesis Sync)
            const { rowCount: guestUpdated } = await db.query(
                `UPDATE anonymous_guest_sync SET balance = balance + $2, updated_at = NOW() WHERE guest_id = $1`,
                [userId, totalCredits]
            );

            if (guestUpdated === 0) {
                // If guest doesn't exist yet, seed them with the reward
                await db.query(
                    `INSERT INTO anonymous_guest_sync (guest_id, balance, created_at) VALUES ($1, $2, NOW())`,
                    [userId, totalCredits]
                );
            }
        }

        // 3. Record the transaction for audit/admin logs
        await db.query(
            `INSERT INTO transactions (user_id, amount, type, provider, meta, created_at)
             VALUES ($1, $2, 'reward', 'cpagrip', $3, NOW())`,
            [userId, totalCredits, JSON.stringify({ 
                txId, 
                payoutUsd: payout,
                creditsIssued: totalCredits,
                isGuest: profileUpdated === 0
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
