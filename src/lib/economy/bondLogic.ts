import { db } from '../db';
import { BOND_TIERS, getBondTier, type BondTier } from './bondTiers';

/**
 * THE BOND LEVEL ENGINE (Sunk Cost Fallacy & Progression)
 * Objective: Maximize ARPU via database updates.
 */

export async function updateBond(userId: string, personaId: string, type: 'message' | 'coin_spend') {
  const points = type === 'message' ? 1 : 10;
  
  // 🛡️ ATOMIC SYNC: Universal Bond Update in Railway
  await db.query(`
    INSERT INTO user_persona_stats (user_id, persona_id, bond_score, updated_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (user_id, persona_id) DO UPDATE SET 
        bond_score = user_persona_stats.bond_score + EXCLUDED.bond_score,
        updated_at = NOW()
  `, [userId, personaId, points]);
}

export { BOND_TIERS, getBondTier, type BondTier };


