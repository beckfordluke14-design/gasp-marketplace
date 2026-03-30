/**
 * GASP OPERATIONS TERMINAL: HYBRID SOVEREIGN TOKENOMICS v2
 * Institutional Tiered Economy with Enterprise Assets & Data Burn Rates.
 */

export const ELITE_WHALE_MARK = 99.99; // Threshold for Whale Status
export const ELITE_DISCOUNT_MULTIPLIER = 0.5; // 50% Off for Whale Tier Accounts

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
    label: 'Standard Node Uplink',
    helioPayLink: 'https://moonpay.hel.io/pay/69ca471eec1f737b060ec098'
  },
  { 
    id: 'tier_taste',   
    priceUsd: 9.99,  
    credits: 11000,  
    label: 'Strategic Data Sync', 
    helioPayLink: 'https://moonpay.hel.io/pay/69ca493b6858b763c861473d'
  },
  { 
    id: 'tier_session', 
    priceUsd: 24.99, 
    credits: 30000, 
    label: 'Operational Prime Link', 
    isPopular: true, 
    helioPayLink: 'https://moonpay.hel.io/pay/69ca499a00ba8a6f4a64973e'
  },
  { 
    id: 'tier_whale', 
    priceUsd: 99.99,  
    credits: 120000, 
    label: 'Enterprise Archive Node',
    helioPayLink: 'https://moonpay.hel.io/pay/69ca49e727ac0ea87fc7ea46'
  },
  { 
    id: 'tier_reserve', 
    priceUsd: 249.99,  
    credits: 350000, 
    label: 'Strategic Reserve Node',
    helioPayLink: 'https://moonpay.hel.io/pay/69ca4aa9034fcd42d6dc3220'
  },
  { 
    id: 'tier_master', 
    priceUsd: 999.99,  
    credits: 1500000, 
    label: 'Elite Terminal Master',
    helioPayLink: 'https://moonpay.hel.io/pay/69ca4b3b27ac0ea87fc7f1e5'
  }
];

// RE-MAPPED BURN RATES (Apex-Elite v5.2 Protocol)
export const COST_VAULT_UNLOCK = 6000;           // 6,000 Credits ($6.00 Apex-Entry)
export const COST_PREMIUM_VAULT_UNLOCK = 12000; // 12,000 Credits ($12.00 Whale-Tier)
export const COST_VOICE_NOTE = 1000;            // 1,000 Credits ($1.00 Elite Vox)
export const COST_VOICE_TRANSLATION = 1000;     // 1,000 Credits ($1.00 Decode)
export const COST_PRIORITY_TIP = 2000;          // 2,000 Credits ($2.00 Priority)
export const COST_MESSAGE_TEXT = 50;            // 50 Credits ($0.05 Text Tax)


