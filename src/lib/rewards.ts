import { db } from '@/lib/db';

/**
 * 🎁 SOVEREIGN WHALE-COMP PROTOCOL (Bitrefill / Tremendous Bridge)
 * Purpose: Analyzes user LTV and triggers real-world rewards if eligible.
 * Caps reward bleed to a maximum of 5-10% of total LTV.
 */

// We consider $100 as the minimum lifetime spend before they are treated like a VIP.
const MINIMUM_LTV_FOR_REWARD = 100;
// Maximum percentage of LTV we are willing to return as gifts
const MAX_REWARD_RATIO = 0.08; // 8%

export async function checkRewardEligibility(userId: string) {
    if (!userId || userId.startsWith('guest-')) return false;

    try {
        // 1. Calculate Lifetime Fiat Value (LTV)
        const { rows: depositRows } = await db.query(
            "SELECT SUM(amount) as total_spent FROM transactions WHERE user_id = $1 AND type = 'credit_buy'",
            [userId]
        );
        const totalSpent = parseFloat(depositRows[0]?.total_spent || '0');

        if (totalSpent < MINIMUM_LTV_FOR_REWARD) {
            return false;
        }

        // 2. Calculate Total Rewards Given
        const { rows: rewardRows } = await db.query(
            "SELECT SUM(amount) as total_rewards FROM transactions WHERE user_id = $1 AND type = 'real_world_reward'",
            [userId]
        );
        const totalRewards = parseFloat(rewardRows[0]?.total_rewards || '0');

        // 3. Margin Enforcement Check
        if ((totalRewards + 5) > (totalSpent * MAX_REWARD_RATIO)) {
            // Cannot give a $5 gift without breaching the 8% margin rule.
            return false;
        }

        // 4. Frequency Enforcement (Max 1 per 7 days)
        const { rows: recentRewards } = await db.query(
            "SELECT 1 FROM transactions WHERE user_id = $1 AND type = 'real_world_reward' AND created_at > NOW() - INTERVAL '7 days'",
            [userId]
        );
        
        if (recentRewards.length > 0) {
            return false;
        }

        return true; 
    } catch (e) {
        console.error('[Rewards] Eligibility check failed:', e);
        return false;
    }
}

export async function issueBitrefillReward(userId: string, personaName: string, giftType: string, amount: number) {
    // 🛡️ Bitrefill API / Tremendous API Mock Execution
    // In production, this makes a POST /api/v1/order to Bitrefill using Solana balance.
    console.log(`🎁 [SOVEREIGN COMP] Issuing $${amount} ${giftType} to ${userId} from ${personaName}...`);
    
    const mockCode = `${giftType.substring(0,4).toUpperCase()}-` + Math.random().toString(36).substring(2, 10).toUpperCase();

    try {
        // Record the expense in the ledger
        await db.query(
            "INSERT INTO transactions (user_id, amount, type, provider, meta, created_at) VALUES ($1, $2, $3, $4, $5, NOW())",
            [userId, amount, 'real_world_reward', 'bitrefill_api', JSON.stringify({
                gift_type: giftType,
                issued_by: personaName,
                code: mockCode
            })]
        );
        
        return { success: true, code: mockCode };
    } catch(e) {
        console.error('[Rewards] Failed to issue reward:', e);
        return { success: false, code: null };
    }
}
