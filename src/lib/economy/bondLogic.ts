import { db } from '../db';

/**
 * THE BOND LEVEL ENGINE (Sunk Cost Fallacy & Progression)
 * Objective: Maximize ARPU via dopamine-driven progress bars.
 */

export interface BondTier {
  level: number;
  label: string;
  minPoints: number;
  color: string;
}

export const BOND_TIERS: BondTier[] = [
  { level: 1, label: 'Discovery', minPoints: 0, color: 'bg-white/20' },
  { level: 2, label: 'Awareness', minPoints: 50, color: 'bg-[#00f0ff]' },
  { level: 3, label: 'Interest', minPoints: 150, color: 'bg-[#00f0ff] shadow-[0_0_10px_#00f0ff]' },
  { level: 4, label: 'Familiar', minPoints: 500, color: 'bg-[#ff00ff]' },
  { level: 5, label: 'Possessive', minPoints: 1200, color: 'bg-[#ff00ff] shadow-[0_0_15px_#ff00ff]' }
];

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

export function getBondTier(points: number): BondTier {
  return [...BOND_TIERS].reverse().find(t => points >= t.minPoints) || BOND_TIERS[0];
}


