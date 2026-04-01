import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CREDIT_PACKAGES } from '@/lib/economy/constants';

/**
 * 🛡️ HELIO REDIRECT BRIDGE
 * Stores userId → packageId mapping in DB before redirecting to Helio.
 * When Helio webhook fires, we look up userId by the Helio transaction reference.
 * 
 * Usage: /api/economy/helio/redirect?userId=xxx&packageId=tier_entry
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const packageId = searchParams.get('packageId');

  // 🛡️ Guard against missing critical identifiers
  if (!userId || !packageId) {
    return NextResponse.redirect(new URL('/?error=missing_params', req.url));
  }

  const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
  let helioPayLink = pkg?.helioPayLink;
  let priceUsd = pkg?.priceUsd || 0;
  let credits = pkg?.credits || 0;

  // 🔱 CUSTOM WHALE INJECTION: Handle amounts like custom_99999
  if (!pkg && packageId.startsWith('custom_')) {
     const amtStr = packageId.split('_')[1];
     const amount = parseFloat(amtStr);
     if (!isNaN(amount)) {
        priceUsd = amount;
        credits = Math.floor(amount * 1000); // 1,000 credits per $1.00
        // Use the default Helio link for custom payments (Tier Entry link as base)
        helioPayLink = CREDIT_PACKAGES.find(p => p.id === 'tier_standard')?.helioPayLink || CREDIT_PACKAGES[0].helioPayLink;
     }
  }

  if (!helioPayLink) {
    return NextResponse.redirect(new URL('/?error=invalid_package', req.url));
  }

  // Store the pending payment so webhook can look up userId
  try {
    await db.query(
      `INSERT INTO transactions (user_id, amount, type, provider, meta, created_at)
       VALUES ($1, 0, 'pending_helio', 'helio', $2, NOW())
       ON CONFLICT DO NOTHING`,
      [userId, JSON.stringify({ packageId, expectedAmount: priceUsd, expectedCredits: credits })]
    );
  } catch (err: any) {
    console.error('[HelioRedirect] Failed to store pending payment:', err.message);
    // Non-blocking — still redirect
  }

  // Append identifiers to Helio URL
  const helioUrl = new URL(helioPayLink);
  helioUrl.searchParams.set('ref', userId || 'anon');
  helioUrl.searchParams.set('customerId', userId || 'anon');
  helioUrl.searchParams.set('amount', priceUsd.toString()); // 🔱 DYNAMIC PRICE LOCK 🛰️

  return NextResponse.redirect(helioUrl.toString());
}
