/**
 * GASP COLLECTIVE: HYBRID SOVEREIGN TOKENOMICS v2
 * High-End Tiered Economy with Elite Subs & Dynamic Burn Rates.
 */

export const ELITE_SUBSCRIPTION_COST = 19.99; // Monthly USD
export const ELITE_DISCOUNT_MULTIPLIER = 0.5; // 50% Off for Subscribers

export interface CreditPackage {
  id: string;
  priceUsd: number;
  credits: number;
  label: string;
  bonus?: string;
  isPopular?: boolean;
}

// GASP CREDIT MATRIX: USD -> CREDITS
export const CREDIT_PACKAGES: CreditPackage[] = [
  { 
    id: 'tier_impulse', 
    priceUsd: 4.99,  
    credits: 50,   
    label: 'The Impulse' 
  },
  { 
    id: 'tier_taste',   
    priceUsd: 9.99,  
    credits: 110,  
    label: 'The Taste', 
    bonus: '+10%' 
  },
  { 
    id: 'tier_weekend', 
    priceUsd: 24.99, 
    credits: 300,  
    label: 'The Weekend', 
    isPopular: true, 
    bonus: '+20%' 
  },
  { 
    id: 'tier_whale',   
    priceUsd: 99.99, 
    credits: 1500, 
    label: 'The Whale', 
    bonus: '+50%' 
  }
];

// RE-MAPPED BURN RATES (High-Status Protocol)
export const COST_VAULT_UNLOCK = 75;           // 75 Credits ($6.00 Market-Entry)
export const COST_PREMIUM_VAULT_UNLOCK = 250;  // 250 Credits ($20.00 Whale-Tier)
export const COST_VOICE_NOTE = 25;             // 25 Credits ($2.00 Narrative Audio)
export const COST_VOICE_TRANSLATION = 25;      // 25 Credits ($2.00 Decode)
export const COST_PRIORITY_TIP = 50;           // 50 Credits ($4.00 DM Priority)


