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

    // 🛡️ LAZY INIT: Initialize at runtime to avoid build-time crashes
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16' as any,
    });

    // Identify the package for amount/metadata
    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!pkg) return NextResponse.json({ error: 'Sector Intel Missing (Invalid Package)' }, { status: 400 });

    // 🧬 ONRAMP SESSION CREATE
    // Note: This triggers the KYC flow (SSN, Address, etc.)
    const onrampSession = await stripe.crypto.onrampSessions.create({
      transaction_details: {
        destination_currency: 'usdc',
        destination_network: 'solana', // Default network
        destination_wallet_address: walletAddress || 'placeholder_address_check_docs',
        source_amount: pkg.priceUsd.toString(),
        source_currency: 'usd',
        supported_destination_currencies: ['usdc'],
        supported_destination_networks: ['solana'],
      },
      customer_ip_address: req.headers.get('x-forwarded-for') || '127.0.0.1',
      metadata: {
          userId: userId,
          packageId: packageId,
          credits: pkg.credits.toString()
      }
    });

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
