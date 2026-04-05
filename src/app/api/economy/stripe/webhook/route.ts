import { NextResponse } from 'next/server';
import { issueCredits } from '@/lib/economy/issueCredits';

/**
 * 🛡️ STRIPE ONRAMP WEBHOOK
 * Event: crypto.onramp_session.updated (status = fulfillment_complete)
 * Credits issued ONLY based on actual source_amount paid — not pre-filled client value.
 * Set STRIPE_WEBHOOK_SECRET in Railway env vars.
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature');

  // Verify webhook signature
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[StripeWebhook] Missing STRIPE_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Misconfigured' }, { status: 500 });
  }

  let event: any;
  try {
    // Manual HMAC verification (no stripe-node SDK needed)
    const crypto = await import('crypto');
    const [, timestampPart, signaturePart] = (sig || '').match(/t=(\d+),v1=([a-f0-9]+)/) || [];
    if (!timestampPart || !signaturePart) throw new Error('Invalid signature format');

    const payload = `${timestampPart}.${rawBody}`;
    const expected = crypto
      .createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    if (expected !== signaturePart) throw new Error('Signature mismatch');

    event = JSON.parse(rawBody);
  } catch (err: any) {
    console.error('[StripeWebhook] Signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Only process fulfillment events
  if (event.type !== 'crypto.onramp_session.updated') {
    return NextResponse.json({ received: true });
  }

  const session = event.data?.object;
  // 🛡️ RE-SYNC: Stripe Onramp uses 'fulfilled' status for successful completion
  if (session?.status !== 'fulfilled' && session?.status !== 'fulfillment_complete') {
    return NextResponse.json({ received: true });
  }

  const userId = session.metadata?.userId || session.client_reference_id;
  const txId = session.id;
  // 🔱 ACTUAL AMOUNT: what Stripe reports was actually charged — NOT what was pre-filled
  const actualAmountUsd = parseFloat(session.transaction_details?.source_amount || '0');

  if (!userId || actualAmountUsd <= 0) {
    console.error('[StripeWebhook] Missing userId or zero amount:', { userId, actualAmountUsd });
    return NextResponse.json({ error: 'Invalid session data' }, { status: 400 });
  }

  try {
    const result = await issueCredits({
      userId,
      actualAmountUsd,
      provider: 'stripe_onramp',
      txId,
      meta: {
        packageId: session.metadata?.packageId,
        expectedAmount: session.metadata?.expectedAmount,
        network: session.transaction_details?.destination_network,
        currency: session.transaction_details?.destination_currency,
      },
    });

    console.log(`[StripeWebhook] ✅ ${result.credits} credits → user ${userId} ($${actualAmountUsd})`);
    return NextResponse.json({ received: true, credits: result.credits });
  } catch (err: any) {
    console.error('[StripeWebhook] Credit issuance failed:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
