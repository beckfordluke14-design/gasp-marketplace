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

  // 🔱 CALCULATE: 1000 credits per $1 USD actually paid
  const credits = Math.floor(actualAmountUsd * 1000);
  if (credits <= 0) {
    return { success: false, error: 'Amount too low to issue credits' };
  }

  await db.query('BEGIN');
  try {
    await db.query(
      `UPDATE profiles SET credit_balance = credit_balance + $1, updated_at = NOW() WHERE id = $2`,
      [credits, userId]
    );

    await db.query(
      `INSERT INTO transactions (user_id, amount, type, provider, meta, created_at)
       VALUES ($1, $2, 'purchase', $3, $4, NOW())`,
      [userId, credits, provider, JSON.stringify({ txId, actualAmountUsd, ...meta })]
    );

    await db.query('COMMIT');
    console.log(`[Credits] ✅ Issued ${credits} credits to ${userId} via ${provider} (tx: ${txId}, $${actualAmountUsd})`);
    return { success: true, credits };
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }
}
