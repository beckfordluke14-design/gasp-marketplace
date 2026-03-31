import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * ⛽ STRIPE CRYPTO ONRAMP NODE: Unified Settlement Unit
 * Strategy: Fast-track fiat-to-crypto settlements with 1:1 Syndicate Credit matching.
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
            const metadata = onrampSession.metadata;
            if (metadata?.userId && metadata?.credits) {
                const userId = metadata.userId;
                const credits = parseInt(metadata.credits, 10);
                
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
                        'UPDATE profiles SET credit_balance = credit_balance + $1, updated_at = NOW() WHERE id = $2',
                        [credits, userId]
                    );

                    // 🔥 SYNDICATE 1:1 MATCH & SHADOW BURN
                    // This is atomic - both point matching and burn stats updated here.
                    const { recordShadowBurn } = await import('@/lib/db');
                    await recordShadowBurn(userId, credits, client);

                    // 2. Record Transaction
                    await client.query(
                        'INSERT INTO transactions (user_id, amount, type, provider, meta, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
                        [userId, credits, 'deposit', 'stripe_onramp', JSON.stringify({ session_id: onrampSession.id, packageId: metadata.packageId })]
                    );

                    await client.query('COMMIT');
                    console.log(`✅ [Onramp] Crypto Settlement Complete: ${userId} +${credits} BP`);
                } catch (dbErr) {
                    if (client) await client.query('ROLLBACK');
                    console.error('[Onramp] Settlement Failure:', dbErr);
                    return NextResponse.json({ error: 'Database Sync Error' }, { status: 500 });
                } finally {
                    client.release();
                }
            }
        }
    }

    return NextResponse.json({ received: true });
}
