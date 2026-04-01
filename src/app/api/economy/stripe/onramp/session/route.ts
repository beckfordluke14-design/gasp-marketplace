import { NextResponse } from 'next/server';
import { CREDIT_PACKAGES } from '@/lib/economy/constants';

/**
 * 🛡️ SOVEREIGN STRIPE ONRAMP SESSION
 * Per official docs: https://docs.stripe.com/crypto/onramp/stripe-hosted
 * The session API returns a redirect_url.
 * Pre-selection of currency/amount is handled client-side via StripeOnramp.Standalone() JS SDK.
 */

export async function POST(req: Request) {
  try {
    const { packageId, userId } = await req.json();

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ success: false, error: 'STRIPE_KEY_MISSING' }, { status: 500 });
    }

    // Resolve package
    let priceUsd: number;
    let credits: number;
    let label: string;

    if (packageId.startsWith('custom_')) {
      const val = parseFloat(packageId.split('_')[1]);
      priceUsd = val;
      credits = Math.floor(val * 15);
      label = 'Custom Terminal Infusion';
    } else {
      const found = CREDIT_PACKAGES.find(p => p.id === packageId);
      if (!found) return NextResponse.json({ success: false, error: 'INVALID_PACKAGE' }, { status: 400 });
      priceUsd = found.priceUsd;
      credits = found.credits;
      label = found.label;
    }

    // Create a minimal onramp session — the redirect_url is returned and used client-side
    const response = await fetch('https://api.stripe.com/v1/crypto/onramp_sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      // Minimal body — per docs, pre-selection is done with Standalone() JS, not session params
      body: new URLSearchParams({
        'wallet_addresses[solana]': 'H7BvF9o1yWh7ZBej7N3y5K27vY6LqzE7S6jXF8A9Z1K1',
        'metadata[userId]': userId,
        'metadata[packageId]': packageId,
        'metadata[credits]': credits.toString(),
      }),
    });

    const rawResult = await response.text();
    console.log('[OnrampSession] Status:', response.status, '| Body:', rawResult.slice(0, 300));

    if (!response.ok) {
      let detail = rawResult;
      try { detail = JSON.parse(rawResult).error?.message || rawResult; } catch {}
      return NextResponse.json({ success: false, error: `STRIPE: ${detail}` }, { status: 500 });
    }

    const session = JSON.parse(rawResult);

    // Return the redirect_url + session params so client-side can build the Standalone URL
    return NextResponse.json({
      success: true,
      redirectUrl: session.redirect_url,
      // Pass back params so client-side Standalone() can pre-configure
      sourceAmount: priceUsd.toString(),
      destinationCurrency: 'usdc',
      destinationNetwork: 'solana',
    });

  } catch (err: any) {
    console.error('[OnrampSession] Fatal:', err);
    return NextResponse.json({ success: false, error: `FAULT: ${err.message}` }, { status: 500 });
  }
}
