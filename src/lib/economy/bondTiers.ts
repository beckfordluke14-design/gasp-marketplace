/**
 * THE BOND LEVEL DATA (Safe for Client & Server)
 * Objective: High-status progression tiers without DB dependencies.
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

export function getBondTier(points: number): BondTier {
  return [...BOND_TIERS].reverse().find(t => points >= t.minPoints) || BOND_TIERS[0];
}
