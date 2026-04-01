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
    let pkg;
    if (packageId.startsWith('custom_')) {
        const val = parseFloat(packageId.split('_')[1]);
        pkg = { priceUsd: val, credits: Math.floor(val * 15) };
    } else {
        pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
    }
    
    if (!pkg) return NextResponse.json({ error: 'Sector Intel Missing (Invalid Package)' }, { status: 400 });

    // 🧬 ONRAMP SESSION CREATE (Manual Fetch - Corrected Params)
    // identity: AllTheseFlows LLC
    // Strategy: Direct Treasury Infusion (Merchant-Owned Address)
    const treasury = 'H7BvF9o1yWh7ZBej7N3y5K27vY6LqzE7S6jXF8A9Z1K1'; // 🔱 GLOBAL TREASURY NODE

    // 🛡️ IP RESOLVER: Stripe rejects 127.0.0.1. We must provide a valid public client node.
    let clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                  req.headers.get('x-real-ip') || 
                  '1.1.1.1'; // 🛰️ CLOUDFLARE PUBLIC ASSET (Safe Placeholder)

    if (clientIp === '127.0.0.1' || clientIp === '::1') {
      clientIp = '8.8.8.8'; // 🔭 GOOGLE PUBLIC ASSET (Safe Placeholder for localhost/dev)
    }

    const params = new URLSearchParams();
    params.append('customer_ip_address', clientIp);
    params.append('transaction_details[destination_currencies][0]', 'usdc');
    params.append('transaction_details[destination_networks][0]', 'solana');
    params.append('transaction_details[wallet_addresses][solana]', treasury);
    params.append('transaction_details[supported_destination_currencies][0]', 'usdc');
    params.append('transaction_details[supported_destination_networks][0]', 'solana');
    
    // 🛡️ CENTS CONVERSION: Stripe expects integer cents for USD nodes
    const cents = Math.round(pkg.priceUsd * 100);
    params.append('transaction_details[source_amount]', cents.toString());
    params.append('transaction_details[source_currency]', 'usd');

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

    if (!response.ok) {
      console.error('[Stripe Onramp] Create Session Fail:', await response.text());
      return NextResponse.json({ success: false, error: 'Uplink Terminal Denied by Stripe Node.' }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json({ 
      success: true, 
      onrampUrl: data.onramp_url // 🔱 THE BULLETPROOF REDIRECT URL
    });

  } catch (err: any) {
    console.error('[OnrampBridge] Fatal Fault:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
