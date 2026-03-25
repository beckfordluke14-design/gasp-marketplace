/**
 * GASP COLLECTIVE: HYBRID SOVEREIGN TOKENOMICS v2
 * High-End Tiered Economy with Elite Subs & Dynamic Burn Rates.
 */

export const ELITE_SUBSCRIPTION_COST = 19.99; // Monthly USD
export const ELITE_DISCOUNT_MULTIPLIER = 0.5; // 50% Off for Subscribers

export interface CoinPackage {
  id: string;
  priceUsd: number;
  coins: number;
  label: string;
  bonus?: string;
  isPopular?: boolean;
}

// GASP COIN MATRIX: USD -> COINS
export const COIN_PACKAGES: CoinPackage[] = [
  { 
    id: 'tier_impulse', 
    priceUsd: 4.99,  
    coins: 50,   
    label: 'The Impulse' 
  },
  { 
    id: 'tier_taste',   
    priceUsd: 9.99,  
    coins: 110,  
    label: 'The Taste', 
    bonus: '+10%' 
  },
  { 
    id: 'tier_weekend', 
    priceUsd: 24.99, 
    coins: 300,  
    label: 'The Weekend', 
    isPopular: true, 
    bonus: '+20%' 
  },
  { 
    id: 'tier_whale',   
    priceUsd: 99.99, 
    coins: 1500, 
    label: 'The Whale', 
    bonus: '+50%' 
  }
];

// RE-MAPPED BURN RATES (High-Status Protocol)
export const COST_VAULT_UNLOCK = 75;           // $6.00 Market-Entry (High-Res Feed)
export const COST_PREMIUM_VAULT_UNLOCK = 250;  // $20.00 Whale-Tier (Custom/Grok Manual Vids)
export const COST_VOICE_NOTE = 25;             // $2.00 Narrative Audio (to send)
export const COST_VOICE_TRANSLATION = 25;      // $2.00 Decode native voice → English
export const COST_PRIORITY_TIP = 50;           // $4.00 Direct Message Priority (Fast-Channel)


