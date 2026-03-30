import { NextResponse } from 'next/server';
import { CREDIT_PACKAGES } from '@/lib/economy/constants';

/**
 * 🛡️ SOVEREIGN STRIPE ONRAMP BRIDGE (Production-Ready)
 * Identity: AllTheseFlows LLC (d.b.a. AllTheseFlows Strategic Media)
 * Objective: High-Speed Settlement of Institutional Media Credits
 * NOTE: Stripe is lazily initialized at runtime to avoid build-time failures.
 */

export async function POST(req: Request) {
  try {
    const { packageId, userId } = await req.json();

    if (!process.env.STRIPE_SECRET_KEY) {
        return NextResponse.json({ error: 'Uplink Disconnected (Missing API Key)' }, { status: 500 });
    }

    // 🛡️ LAZY INIT: Initialize at runtime only, not build time
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2022-11-15' as any,
    });

    // Identify the package/metadata
    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!pkg) return NextResponse.json({ error: 'Sector Intel Missing (Invalid Package)' }, { status: 400 });

    const origin = req.headers.get('origin');

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${pkg.label} (${pkg.credits.toLocaleString()} BP)`,
              description: `Institutional High-Heat Media Access Settlement`,
              images: ['https://asset.gasp.fun/public/terminal_infusion.png'], 
            },
            unit_amount: Math.round(pkg.priceUsd * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/feed`,
      metadata: {
          userId: userId,
          packageId: packageId,
          credits: pkg.credits.toString(), // Metadata values must be strings
          infusion_type: 'institutional'
      },
      payment_intent_data: {
        statement_descriptor: 'GASP STRATEGIC MEDIA',
      },
    });

    return NextResponse.json({
        success: true,
        url: session.url,
        sessionId: session.id,
        merchant: 'AllTheseFlows LLC'
    });

  } catch (err: any) {
    console.error('[StripeBridge] Fatal Fault:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

