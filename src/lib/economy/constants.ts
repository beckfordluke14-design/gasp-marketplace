/**
 * GASP OPERATIONS TERMINAL: HYBRID SOVEREIGN TOKENOMICS v2
 * Institutional Tiered Economy with Enterprise Assets & Data Burn Rates.
 */

export const ELITE_WHALE_MARK = 99.99; // Threshold for Whale Status
export const ELITE_DISCOUNT_MULTIPLIER = 0.5; // 50% Off for Whale Tier Accounts
export const ELITE_SUBSCRIPTION_COST = 29.99; // Monthly Elite Tier Access

export interface CreditPackage {
  id: string;
  priceUsd: number;
  credits: number;
  label: string;
  bonus?: string;
  isPopular?: boolean;
  helioPayLink?: string;  // 🧬 LEGACY CRYPTO-NATIVE BRIDGE
  stripeLink?: string;    // 🛡️ INSTITUTIONAL ON-RAMP BRIDGE (Recommended)
}

// GASP CREDIT MATRIX: USD -> CREDITS (Apex v5.7)
// 1,000 Credits = $1.00 USD (Institutional Floor: $19.31 + $0.68 Safety Margin)
export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'tier_starter',
    priceUsd: 4.99,
    credits: 5000,
    label: 'Starter Access',
  },
  {
    id: 'tier_standard',
    priceUsd: 14.99,
    credits: 15000,
    label: 'Standard Uplink',
  },
  { 
    id: 'tier_entry', 
    priceUsd: 19.99, 
    credits: 20000, 
    label: 'Member Access', 
    helioPayLink: 'https://moonpay.hel.io/pay/69ca493b6858b763c861473d'
  },
  { 
    id: 'tier_session', 
    priceUsd: 24.99, 
    credits: 30000, 
    label: 'Prime Access', 
    isPopular: true, 
    helioPayLink: 'https://moonpay.hel.io/pay/69ca499a00ba8a6f4a64973e'
  },
  {
    id: 'tier_whale',
    priceUsd: 99.99,
    credits: 120000,
    label: 'GASP Elite',
    helioPayLink: 'https://moonpay.hel.io/pay/69ca49e727ac0ea87fc7ea46'
  },
  {
    id: 'tier_reserve',
    priceUsd: 249.99,
    credits: 350000,
    label: 'GASP Archive Pro',
    helioPayLink: 'https://moonpay.hel.io/pay/69ca4aa9034fcd42d6dc3220'
  },
  {
    id: 'tier_master',
    priceUsd: 999.99,
    credits: 1500000,
    label: 'GASP Master Member',
    helioPayLink: 'https://moonpay.hel.io/pay/69ca4b3b27ac0ea87fc7f1e5'
  }
];

// SOVEREIGN TREASURY: Destination for Saturday "Money Printer" Rails
export const SYNDICATE_TREASURY_SOL = 'DGQVNRTWEv1HEwP6Wtcm1LEUPgZKsW9JfwVpEDjPcEkS';
export const USDC_MINT_SOL = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

// RE-MAPPED BURN RATES (Apex-Elite v6.8 Master Protocol)
// High-Status Revenue Node: $20 provides 20,000 Credits.
export const COST_VAULT_UNLOCK = 6000;           // 6,000 Credits ($6.00 Apex-Entry)
export const COST_PREMIUM_VAULT_UNLOCK = 12000; // 12,000 Credits ($12.00 Whale-Tier)
export const COST_VOICE_NOTE = 1000;            // 1,000 Credits ($1.00 Elite Vox)
export const COST_VOICE_TRANSLATION = 1000;     // 1,000 Credits ($1.00 Decode)
export const COST_PRIORITY_TIP = 2000;          // 2,000 Credits ($2.00 Priority)
export const COST_MESSAGE_TEXT = 50;            // 50 Credits ($0.05 Signal)
