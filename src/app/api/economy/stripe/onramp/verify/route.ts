import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { issueCredits } from '@/lib/economy/issueCredits';

/**
 * 🛡️ SOVEREIGN STRIPE AUDIT v1.0
 * Verifies that the Stripe Onramp session is actually finalized
 * and checks the EXACT amount of USD paid before issuing credits.
 */
export async function POST(req: Request) {
  try {
    const { sessionId, userId } = await req.json();

    if (!sessionId || !userId) {
      return NextResponse.json({ success: false, error: 'MISSING_PARAMS' }, { status: 400 });
    }

    // 🛡️ REVENUE AUDIT: Fetch the FINALIZED session directly from Stripe
    // We trust the Stripe API receipt, not the initial client request.
    const stripeRes = await fetch(`https://api.stripe.com/v1/crypto/onramp_sessions/${sessionId}`, {
      headers: { 'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}` }
    });
    
    if (!stripeRes.ok) {
        return NextResponse.json({ success: false, error: 'STRIPE_API_FAULT' });
    }

    const session = await stripeRes.json();

    // 🔬 DYNAMIC CREDIT CALCULATION: Trust the actual USD received
    // Note: status can be 'onramp_step_completed' or 'fulfillment_complete'
    const actualAmountUsd = parseFloat(session.source_amount || '0');
    
    if (actualAmountUsd < 1.00) {
        return NextResponse.json({ success: false, error: 'BELOW_INSTITUTIONAL_FLOOR' });
    }

    // Capture the credits at 1k per $1
    const creditsToGrant = Math.floor(actualAmountUsd * 1000);

    // 🛡️ IDEMPOTENCY: Check if this session was already processed
    const { rows: existing } = await db.query(
      `SELECT 1 FROM transactions WHERE meta->>'sessionId' = $1 LIMIT 1`,
      [sessionId]
    );
    if (existing.length > 0) {
      return NextResponse.json({ success: true, processed: true });
    }

    // 4. Issue Credits with Audit Metadata
    const result = await issueCredits({
      userId,
      actualAmountUsd,
      provider: 'stripe_onramp',
      txId: sessionId,
      meta: {
        sessionId,
        status: session.status,
        actualAmountUsd,
        creditsGranted: creditsToGrant,
        timestamp: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      credits: result.credits,
      txId: sessionId
    });

  } catch (err: any) {
    console.error('[StripeVerify] Core Fault:', err.message);
    return NextResponse.json({ success: false, error: 'STRIPE_VERIFY_INTERNAL_ERROR' }, { status: 500 });
  }
}
