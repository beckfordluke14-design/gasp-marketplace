import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

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

    // 🛡️ INSTITUTIONAL FULFILLMENT: Settling Credits in Railway
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata;

        if (metadata && metadata.userId && metadata.credits) {
            const userId = metadata.userId;
            const credits = parseInt(metadata.credits, 10);

            console.log(`🏦 [Economy] Fulfilling Settlement: ${credits} BP for User ${userId}`);

            try {
                await db.query('BEGIN');
                
                // Atomic balance infusion
                await db.query(
                    'UPDATE profiles SET credit_balance = credit_balance + $1, updated_at = NOW() WHERE id = $2',
                    [credits, userId]
                );

                // Transaction logging
                await db.query(
                    'INSERT INTO transactions (user_id, amount, type, provider, meta, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
                    [userId, credits, 'deposit', 'stripe', JSON.stringify({ session_id: session.id, packageId: metadata.packageId })]
                );

                await db.query('COMMIT');
                console.log(`✅ [Economy] Settlement Verified & Credits Unleashed: ${userId}`);
            } catch (dbErr) {
                await db.query('ROLLBACK');
                console.error('[Economy] Settlement Fulfillment Failure:', dbErr);
                return NextResponse.json({ error: 'Database Synchronization Error' }, { status: 500 });
            }
        }
    }

    return NextResponse.json({ received: true });
}
