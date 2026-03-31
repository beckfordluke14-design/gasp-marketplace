import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

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

    // 🛡️ CRYPTO ONRAMP FULFILLMENT: Fiat-to-Crypto Settlement via Embedded Onramp
    if ((event.type as string) === 'crypto.onramp_session.updated') {
        const onrampSession = event.data.object as any;
        if (onrampSession.status === 'fulfilled') {
            const metadata = onrampSession.metadata;
            if (metadata?.userId && metadata?.credits) {
                const userId = metadata.userId;
                const credits = parseInt(metadata.credits, 10);
                console.log(`🏦 [Onramp] Fulfilling Crypto Settlement: ${credits} BP for User ${userId}`);
                try {
                    await db.query('BEGIN');
                    
                    // 🛡️ IDEMPOTENCY CHECK: Prevent double-minting if Stripe resends the webhook
                    const { rowCount } = await db.query(
                       `SELECT 1 FROM transactions WHERE meta->>'session_id' = $1`,
                       [onrampSession.id]
                    );

                    if (rowCount && rowCount > 0) {
                        await db.query('ROLLBACK');
                        console.log(`⚠️ [Onramp] Idempotency catch: Session ${onrampSession.id} already fulfilled.`);
                        return NextResponse.json({ received: true });
                    }

                    await db.query(
                        'UPDATE profiles SET credit_balance = credit_balance + $1, updated_at = NOW() WHERE id = $2',
                        [credits, userId]
                    );

                    // 🔥 SYNDICATE 1:1 MATCH & SHADOW BURN
                    const { recordShadowBurn } = await import('@/lib/db');
                    await recordShadowBurn(userId, credits);

                    await db.query(
                        'INSERT INTO transactions (user_id, amount, type, provider, meta, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
                        [userId, credits, 'deposit', 'stripe_onramp', JSON.stringify({ session_id: onrampSession.id, packageId: metadata.packageId })]
                    );
                    await db.query('COMMIT');
                    console.log(`✅ [Onramp] Crypto Settlement Complete: ${userId} +${credits} BP`);
                } catch (dbErr) {
                    await db.query('ROLLBACK');
                    console.error('[Onramp] Settlement Failure:', dbErr);
                    return NextResponse.json({ error: 'Database Sync Error' }, { status: 500 });
                }
            }
        }
    }

    return NextResponse.json({ received: true });
}
