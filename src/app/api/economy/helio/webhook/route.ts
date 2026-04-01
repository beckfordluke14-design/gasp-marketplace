import { NextResponse } from 'next/server';
import { issueCredits } from '@/lib/economy/issueCredits';

/**
 * 🛡️ HELIO WEBHOOK
 * Fires when a Helio payment is completed.
 * Credits issued based on actual transactionAmount paid.
 * Set HELIO_WEBHOOK_SECRET in Railway env vars.
 * Register this URL in your Helio dashboard: https://gasp.fun/api/economy/helio/webhook
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const helioSig = req.headers.get('helio-signature') || req.headers.get('x-helio-signature');

  // Helio signature verification
  if (process.env.HELIO_WEBHOOK_SECRET && helioSig) {
    try {
      const crypto = await import('crypto');
      const expected = crypto
        .createHmac('sha256', process.env.HELIO_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');
      if (expected !== helioSig) {
        console.error('[HelioWebhook] Signature mismatch');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    } catch (err: any) {
      console.error('[HelioWebhook] Signature check failed:', err.message);
      return NextResponse.json({ error: 'Signature error' }, { status: 400 });
    }
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Helio event: PAYMENT_SUCCESS
  const eventType = payload.event || payload.type;
  if (eventType !== 'PAYMENT_SUCCESS' && eventType !== 'payment.success') {
    return NextResponse.json({ received: true });
  }

  const txData = payload.transaction || payload.data || payload;
  const txId = txData.id || txData.transactionId || payload.id;

  // 🔱 ACTUAL AMOUNT: what Helio confirms was received in USD
  const rawAmount = txData.transactionAmount || txData.amount || txData.usdAmount || 0;
  const actualAmountUsd = parseFloat(rawAmount.toString());

  // userId from ref param (set by our redirect bridge) or customerId
  const userId = txData.ref ||
    txData.customerId ||
    txData.metadata?.userId ||
    txData.buyerIdentity?.ref ||
    payload.ref;

  if (!userId || actualAmountUsd <= 0) {
    console.error('[HelioWebhook] Missing userId or zero amount — storing for manual review:', { txId, actualAmountUsd });
    // Don't fail — Helio expects 200
    return NextResponse.json({ received: true, warning: 'userId not resolved' });
  }

  try {
    const result = await issueCredits({
      userId,
      actualAmountUsd,
      provider: 'helio',
      txId: txId.toString(),
      meta: {
        currency: txData.currency || txData.tokenSymbol,
        network: txData.network || txData.blockchain,
      },
    });

    console.log(`[HelioWebhook] ✅ ${result.credits} credits → user ${userId} ($${actualAmountUsd})`);
    return NextResponse.json({ received: true, credits: result.credits });
  } catch (err: any) {
    console.error('[HelioWebhook] Credit issuance failed:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
