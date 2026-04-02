import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * 🛰️ STRIPE ONRAMP AUDITOR v7.5 // DYNAMIC SETTLEMENT NODE
 * Strategy: Audit actual settlement amount from Stripe and grant credits dynamically.
 */
export async function POST(req: Request) {
    const payload = await req.text();
    const sig = req.headers.get('stripe-signature');
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!process.env.STRIPE_SECRET_KEY || !endpointSecret || !sig) {
        console.error('[Stripe Webhook] Missing signature or secret');
        return NextResponse.json({ error: 'Uplink Error' }, { status: 400 });
    }

    // 🛡️ LAZY INIT: Runtime only
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2022-11-15' as any,
    });

    let event;
    try {
        event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
    } catch (err: any) {
        console.error(`[Stripe Webhook] Error: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // 🛡️ CRYPTO ONRAMP FULFILLMENT: Fiat-to-Crypto Settlement
    if ((event.type as string) === 'crypto.onramp_session.updated') {
        const onrampSession = event.data.object as any;
        if (onrampSession.status === 'fulfilled') {
            const userId = onrampSession.client_reference_id;
            const rawAmount = parseFloat(onrampSession.amount || onrampSession.source_amount || "0");
            
            if (!userId || rawAmount <= 0) {
                console.error('❌ [Onramp Webhook] Missing user identification or zero amount.');
                return NextResponse.json({ received: true }); // Acknowledge to stop Stripe retries
            }

            // 🧬 DYNAMIC CREDIT CALCULATION (INSTITUTIONAL AUDIT)
            let bonusMultiplier = 1;
            if (rawAmount >= 100) bonusMultiplier = 1.40;
            else if (rawAmount >= 50) bonusMultiplier = 1.25;
            else if (rawAmount >= 19.99) bonusMultiplier = 1.15;

            const creditsToGrant = Math.floor(rawAmount * 100 * bonusMultiplier);

            const client = await db.connect();
            try {
                await client.query('BEGIN');
                
                // 🛡️ IDEMPOTENCY CHECK: Prevent double-minting
                const { rowCount } = await client.query(
                   `SELECT 1 FROM transactions WHERE meta->>'session_id' = $1`,
                   [onrampSession.id]
                );

                if (rowCount && rowCount > 0) {
                    await client.query('ROLLBACK');
                    console.log(`⚠️ [Onramp] Idempotency catch: Session ${onrampSession.id} already fulfilled.`);
                    return NextResponse.json({ received: true });
                }

                // 1. Update Core Profile
                await client.query(
                    'UPDATE profiles SET credits = credits + $1, updated_at = NOW() WHERE id = $2',
                    [creditsToGrant, userId]
                );

                // 2. Record Transaction in the Ledger
                await client.query(
                    'INSERT INTO transactions (user_id, amount, type, provider, meta, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
                    [userId, rawAmount, 'credit_buy', 'stripe_onramp', JSON.stringify({ 
                        session_id: onrampSession.id, 
                        status: 'fulfilled',
                        credits_granted: creditsToGrant,
                        bonus_applied: `${(bonusMultiplier - 1) * 100}%`
                    })]
                );

                await client.query('COMMIT');
                console.log(`✅ [Onramp Webhook] Settlement Complete: ${userId} +${creditsToGrant} Credits (${rawAmount} USD)`);
            } catch (dbErr) {
                if (client) await client.query('ROLLBACK');
                console.error('[Onramp Webhook] DB Settlement Failure:', dbErr);
                return NextResponse.json({ error: 'Internal Database Fault' }, { status: 500 });
            } finally {
                client.release();
            }
        }
    }

    return NextResponse.json({ received: true });
}
