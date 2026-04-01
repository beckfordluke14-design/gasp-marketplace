import { NextResponse } from 'next/server';
import { CREDIT_PACKAGES } from '@/lib/economy/constants';

/**
 * 🛡️ SOVEREIGN STRIPE ONRAMP SESSION
 * Creates a server-side session with metadata so the webhook can securely
 * issue the correct credits based on what was ACTUALLY paid — not client pre-fill.
 */

export async function POST(req: Request) {
  try {
    const { packageId, userId } = await req.json();

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ success: false, error: 'STRIPE_KEY_MISSING' }, { status: 500 });
    }

    let priceUsd: number;
    let credits: number;
    let label: string;

    if (packageId.startsWith('custom_')) {
      const val = parseFloat(packageId.split('_')[1]);
      priceUsd = val;
      credits = Math.floor(val * 1000); // 1000 credits per $1
      label = 'Custom Terminal Infusion';
    } else {
      const found = CREDIT_PACKAGES.find(p => p.id === packageId);
      if (!found) return NextResponse.json({ success: false, error: 'INVALID_PACKAGE' }, { status: 400 });
      priceUsd = found.priceUsd;
      credits = found.credits;
      label = found.label;
    }

    const body = new URLSearchParams();
    body.append('wallet_addresses[solana]', 'H7BvF9o1yWh7ZBej7N3y5K27vY6LqzE7S6jXF8A9Z1K1');
    // 🔱 METADATA: The webhook reads these to issue the correct credits
    body.append('metadata[userId]', userId);
    body.append('metadata[packageId]', packageId);
    body.append('metadata[expectedCredits]', credits.toString());
    body.append('metadata[expectedAmount]', priceUsd.toString());

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
      return NextResponse.json({ success: false, error: `STRIPE: ${detail}` }, { status: 500 });
    }

    const session = JSON.parse(raw);
    return NextResponse.json({
      success: true,
      sessionId: session.id,
      redirectUrl: session.redirect_url,
      // Pass back to client for Standalone() pre-fill
      sourceAmount: priceUsd.toString(),
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: `FAULT: ${err.message}` }, { status: 500 });
  }
}
