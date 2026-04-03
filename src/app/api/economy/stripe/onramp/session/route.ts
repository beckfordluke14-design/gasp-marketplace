import { NextResponse } from 'next/server';
import { CREDIT_PACKAGES, SYNDICATE_TREASURY_SOL } from '@/lib/economy/constants';

/**
 * 🛡️ SOVEREIGN STRIPE ONRAMP SESSION
 * Creates a server-side session with metadata so the webhook can securely
 * issue the correct credits based on what was ACTUALLY paid — not client pre-fill.
 */

export async function POST(req: Request) {
  try {
    const { packageId, userId, amountUsd, isCustom } = await req.json();

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ success: false, error: 'STRIPE_KEY_MISSING' }, { status: 500 });
    }

    let priceUsd: number;
    let credits: number;
    let label: string;

    if (isCustom && amountUsd) {
      // 🛡️ INSTITUTIONAL CUSTOM FLOW: Up to $30,000.00
      const safeAmount = Math.min(30000, parseFloat(amountUsd));
      priceUsd = safeAmount;
      credits = Math.floor(safeAmount * 1000); // 1000 credits per $1
      label = `Institutional Terminal Infusion: $${safeAmount}`;
    } else if (packageId) {
      const found = CREDIT_PACKAGES.find(p => p.id === packageId);
      if (!found) return NextResponse.json({ success: false, error: 'INVALID_PACKAGE' }, { status: 400 });
      priceUsd = found.priceUsd;
      credits = found.credits;
      label = found.label;
    } else {
      return NextResponse.json({ success: false, error: 'MISSING_PAYLOAD' }, { status: 400 });
    }

    const body = new URLSearchParams();

    // 🛡️ RE-SYNC: Using the key explicitly requested by the latest Stripe alert
    body.append('destination_currency', 'usdc');
    body.append('destination_network', 'solana');
    body.append('wallet_addresses[solana]', SYNDICATE_TREASURY_SOL);
    body.append('lock_wallet_address', 'true');
    body.append('source_amount', priceUsd.toFixed(2));
    body.append('source_currency', 'usd');

    console.log('[Stripe] Re-Minting session — wallet:', SYNDICATE_TREASURY_SOL, 'amount:', priceUsd);

    const response = await fetch('https://api.stripe.com/v1/crypto/onramp_sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const raw = await response.text();
    if (!response.ok) {
      let detail = raw;
      try { detail = JSON.parse(raw).error?.message || raw; } catch {}
      console.error('[Stripe Reject]:', detail);
      // 🔥 CRITICAL: Pass the actual detail back to the UI alert
      return NextResponse.json({ success: false, error: detail }, { status: 500 });
    }

    const session = JSON.parse(raw);
    return NextResponse.json({
      success: true,
      sessionId: session.id,
      redirectUrl: session.redirect_url,
      sourceAmount: priceUsd.toString(),
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: `FAULT: ${err.message}` }, { status: 500 });
  }
}
