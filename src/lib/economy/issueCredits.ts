import { db } from '@/lib/db';

/**
 * 🛡️ SOVEREIGN CREDIT ISSUANCE ENGINE
 * Single source of truth for all credit grants.
 * Credits are ALWAYS calculated from actualAmountUsd — never from client-side values.
 * Rate: 1000 credits per $1.00 USD
 */
export async function issueCredits({
  userId,
  actualAmountUsd,
  provider,
  txId,
  meta = {},
}: {
  userId: string;
  actualAmountUsd: number;
  provider: 'stripe_onramp' | 'helio';
  txId: string;
  meta?: Record<string, any>;
}) {
  // Idempotency: never double-credit the same transaction
  const { rows: existing } = await db.query(
    `SELECT 1 FROM transactions WHERE meta->>'txId' = $1 AND provider = $2 LIMIT 1`,
    [txId, provider]
  );
  if (existing.length > 0) {
    console.log(`[Credits] Duplicate tx ignored: ${txId}`);
    return { success: true, duplicate: true, credits: 0 };
  }

  // 🔱 CALCULATE: 1,000 credits per $1 USD actually paid
  // 🛰️ SOVEREIGN ROUNDING: Ceil to the nearest 10 for clean UI + user goodwill.
  // Financial impact is < $0.01 per tx; Trust gain is 100%
  const baseCredits = actualAmountUsd * 1000;
  const credits = Math.ceil(baseCredits / 10) * 10;
  
  if (credits <= 0) {
    return { success: false, error: 'Amount too low to issue credits' };
  }

  await db.query('BEGIN');
  try {
    // 🛡️ ATOMIC UPSERT: Ensure profile node exists before credit infusion
    // satisfies all N-N constraints (name, country, flag, vibe, image, system_prompt)
    await db.query(
      `INSERT INTO profiles (id, name, nickname, country, flag, vibe, image, system_prompt, credit_balance, updated_at)
       VALUES ($1, 'Syndicate Member', 'Member', 'GB', '🇬🇧', 'Professional', 'https://avatar.vercel.sh/member', 'Sovereign Intelligence Node', $2, NOW())
       ON CONFLICT (id) DO UPDATE SET 
         credit_balance = profiles.credit_balance + $2, 
         updated_at = NOW()`,
      [userId, credits]
    );

    // 🔱 AUDIT LOG: Record purchase with standardized metadata keys
    await db.query(
      `INSERT INTO transactions (user_id, amount, type, provider, meta, created_at)
       VALUES ($1, $2, 'purchase', $3, $4, NOW())`,
      [userId, credits, provider, JSON.stringify({ 
        txId, 
        amountUsd: actualAmountUsd, // Standardized key for Sales Dashboard
        actualAmountUsd, // Keeping legacy key for compatibility
        creditsIssued: credits,
        ...meta 
      })]
    );

    await db.query('COMMIT');
    console.log(`[Credits] ✅ SUCCESS: Issued ${credits} credits to ${userId} ($${actualAmountUsd.toFixed(2)})`);
    return { success: true, credits };
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }
}
