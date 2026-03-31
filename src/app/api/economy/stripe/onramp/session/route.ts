import { NextResponse } from 'next/server';
import { CREDIT_PACKAGES } from '@/lib/economy/constants';

/**
 * 🛡️ SOVEREIGN STRIPE CRYPTO ONRAMP (Embedded)
 * Identity: AllTheseFlows LLC (d.b.a. AllTheseFlows Strategic Media)
 * Objective: Formal Fiat-to-Crypto Settlement
 */

export async function POST(req: Request) {
  try {
    const { packageId, userId, walletAddress } = await req.json();

    if (!process.env.STRIPE_SECRET_KEY) {
        return NextResponse.json({ error: 'Uplink Disconnected (Missing API Key)' }, { status: 500 });
    }

    // Identify the package for amount/metadata
    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!pkg) return NextResponse.json({ error: 'Sector Intel Missing (Invalid Package)' }, { status: 400 });

    // 🧬 ONRAMP SESSION CREATE (Manual Fetch - Corrected Params)
    // identity: AllTheseFlows LLC
    // Strategy: Direct Treasury Infusion (Merchant-Owned Address)
    const treasury = 'H7BvF9o1yWh7ZBej7N3y5K27vY6LqzE7S6jXF8A9Z1K1'; // 🔱 GLOBAL TREASURY NODE

    const params = new URLSearchParams();
    params.append('source_amount', pkg.priceUsd.toString());
    params.append('source_currency', 'usd');
    params.append('destination_currencies[0]', 'usdc');
    params.append('destination_networks[0]', 'solana');
    params.append('wallet_addresses[solana]', treasury);
    params.append('customer_ip_address', req.headers.get('x-forwarded-for') || '127.0.0.1');
    params.append('metadata[userId]', userId);
    params.append('metadata[packageId]', packageId);
    params.append('metadata[credits]', pkg.credits.toString());

    const response = await fetch('https://api.stripe.com/v1/crypto/onramp_sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const onrampSession = await response.json();

    if (onrampSession.error) {
       console.error('[OnrampBridge] Stripe Error:', onrampSession.error);
       return NextResponse.json({ error: onrampSession.error.message }, { status: 400 });
    }

    return NextResponse.json({
        success: true,
        clientSecret: onrampSession.client_secret,
        sessionId: onrampSession.id,
        merchant: 'AllTheseFlows LLC'
    });

  } catch (err: any) {
    console.error('[OnrampBridge] Fatal Fault:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
