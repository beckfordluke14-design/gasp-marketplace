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
  helioPayLink?: string; // 🧬 SECURE DEEP-LINK
}

// GASP CREDIT MATRIX: USD -> CREDITS (Apex v5.2)
// 1,000 Credits = $1.00 USD
export const CREDIT_PACKAGES: CreditPackage[] = [
  { 
    id: 'tier_impulse', 
    priceUsd: 4.99,  
    credits: 5000,   
    label: 'The Impulse',
    helioPayLink: 'https://hel.io/sh/REPLACE_WITH_IMPULSE_LINK'
  },
  { 
    id: 'tier_taste',   
    priceUsd: 9.99,  
    credits: 10000,  
    label: 'The Taste', 
    bonus: '+10%',
    helioPayLink: 'https://hel.io/sh/REPLACE_WITH_TASTE_LINK'
  },
  { 
    id: 'tier_weekend', 
    priceUsd: 24.99, 
    credits: 28000, // +3K Bonus
    label: 'The Weekend', 
    isPopular: true, 
    bonus: '+20%',
    helioPayLink: 'https://hel.io/sh/REPLACE_WITH_WEEKEND_LINK'
  },
  { 
    id: 'tier_whale',   
    priceUsd: 99.99, 
    credits: 150000, // +50K Bonus
    label: 'The Whale', 
    bonus: '+50%',
    helioPayLink: 'https://hel.io/sh/REPLACE_WITH_WHALE_LINK'
  }
];

// RE-MAPPED BURN RATES (Apex-Elite v5.2 Protocol)
export const COST_VAULT_UNLOCK = 6000;           // 6,000 Credits ($6.00 Apex-Entry)
export const COST_PREMIUM_VAULT_UNLOCK = 12000; // 12,000 Credits ($12.00 Whale-Tier)
export const COST_VOICE_NOTE = 1000;            // 1,000 Credits ($1.00 Elite Vox)
export const COST_VOICE_TRANSLATION = 1000;     // 1,000 Credits ($1.00 Decode)
export const COST_PRIORITY_TIP = 2000;          // 2,000 Credits ($2.00 Priority)
export const COST_MESSAGE_TEXT = 50;            // 50 Credits ($0.05 Text Tax)


