import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * 🛰️ SYNDICATE POSTBACK ENGINE (Ogads Edition)
 * Maps Ogads completions to User Units with Syndicate Rounding.
 * Payout: Nearest 100 Units (e.g. $1.42 -> 1,400 Units)
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    
    // 🧬 OGADS PARAMETER MAPPING (V6.2 Sync)
    const affSub = searchParams.get('aff_sub') || searchParams.get('subid');
    const payoutRaw = searchParams.get('payout');
    const offerId = searchParams.get('offer_id') || searchParams.get('offer');

    if (!affSub || !payoutRaw) {
        return NextResponse.json({ success: false, error: 'Missing aff_sub or payout' }, { status: 400 });
    }

    const userId = String(affSub);
    const payout = parseFloat(String(payoutRaw));

    // 🔱 SYNDICATE PRECISION CALCULATION: Nearest 100
    const totalUnits = Math.round(payout * 10) * 100;

    console.log(`[OGADS_CALLBACK] Processing: ${userId} // Payout: $${payout} // Units: ${totalUnits}`);

    try {
        // IDEMPOTENCY: Standard check to prevent double-funding
        const { rows: existing } = await db.query(
            `SELECT 1 FROM transactions WHERE meta->>'offerId' = $1 AND user_id = $2 AND provider = 'ogads' LIMIT 1`,
            [offerId, userId]
        );

        if (existing.length > 0) {
            return NextResponse.json({ success: true, message: 'Already processed' });
        }

        await db.query('BEGIN');

        // 🏗️ ATOMIC FUNDING: Try Profile then Guest Sync
        const { rowCount: profileUpdated } = await db.query(
            `UPDATE profiles SET credit_balance = credit_balance + $2, updated_at = NOW() WHERE id = $1`,
            [userId, totalUnits]
        );

        if (profileUpdated === 0) {
            const { rowCount: guestUpdated } = await db.query(
                `UPDATE anonymous_guest_sync SET balance = balance + $2, updated_at = NOW() WHERE guest_id = $1`,
                [userId, totalUnits]
            );

            if (guestUpdated === 0) {
                await db.query(
                    `INSERT INTO anonymous_guest_sync (guest_id, balance, created_at) VALUES ($1, $2, NOW())`,
                    [userId, totalUnits]
                );
            }
        }

        // 🔱 AUDIT TRAIL
        await db.query(
            `INSERT INTO transactions (user_id, amount, type, provider, meta, created_at)
             VALUES ($1, $2, 'reward', 'ogads', $3, NOW())`,
            [userId, totalUnits, JSON.stringify({ offerId, payoutUsd: payout, unitsIssued: totalUnits })]
        );

        await db.query('COMMIT');
        return NextResponse.json({ success: true, unitsIssued: totalUnits });

    } catch (err) {
        await db.query('ROLLBACK');
        console.error('[OGADS_CALLBACK_ERROR]:', err);
        return NextResponse.json({ success: false, error: 'Sync failure' }, { status: 500 });
    }
}
