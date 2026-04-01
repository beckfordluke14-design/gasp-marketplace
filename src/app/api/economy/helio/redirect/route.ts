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

  if (!userId || !packageId) {
    return NextResponse.redirect(new URL('/?error=missing_params', req.url));
  }

  const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
  if (!pkg || !pkg.helioPayLink) {
    return NextResponse.redirect(new URL('/?error=invalid_package', req.url));
  }

  // Store the pending payment so webhook can look up userId
  try {
    await db.query(
      `INSERT INTO transactions (user_id, amount, type, provider, meta, created_at)
       VALUES ($1, 0, 'pending_helio', 'helio', $2, NOW())
       ON CONFLICT DO NOTHING`,
      [userId, JSON.stringify({ packageId, expectedAmount: pkg.priceUsd, expectedCredits: pkg.credits })]
    );
  } catch (err: any) {
    console.error('[HelioRedirect] Failed to store pending payment:', err.message);
    // Non-blocking — still redirect
  }

  // Append userId to Helio URL so it appears in webhook payload as ref
  const helioUrl = new URL(pkg.helioPayLink);
  helioUrl.searchParams.set('ref', userId);
  helioUrl.searchParams.set('customerId', userId);

  return NextResponse.redirect(helioUrl.toString());
}
