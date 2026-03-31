'use client';

import { useState } from 'react';
import { CreditCard, Zap, Loader2, ArrowRight, Bitcoin, ShieldCheck, AlertCircle } from 'lucide-react';
import { CREDIT_PACKAGES, SYNDICATE_TREASURY_SOL } from '@/lib/economy/constants';
import StripeEmbeddedOnramp from './StripeEmbeddedOnramp';

interface SovereignCheckoutProps {
  userId: string;
  packageId: string;
  onSuccess: (credits: number) => void;
  onCancel: () => void;
}

/**
 * 🛰️ SOVEREIGN DUAL-RAIL CHECKOUT (Embedded Onramp Edition)
 * Choice: Card (Stripe Crypto Onramp) OR Crypto (Helio P2P)
 */
export default function SovereignCheckout({ userId, packageId, onSuccess, onCancel }: SovereignCheckoutProps) {
  const [isLoadingCard, setIsLoadingCard] = useState(false);
  const [isLoadingCrypto, setIsLoadingCrypto] = useState(false);
  const [onrampClientSecret, setOnrampClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isCustom = packageId.startsWith('custom_');
  const customVal = isCustom ? parseFloat(packageId.split('_')[1]) : 0;
  const pkg = isCustom 
    ? { id: packageId, priceUsd: customVal, credits: customVal * 15, label: 'Custom Terminal Infusion', helioPayLink: '', stripeLink: '' }
    : (CREDIT_PACKAGES.find(p => p.id === packageId) || CREDIT_PACKAGES[0]);

  const totalCredits = pkg.credits;

  // 🥇 OPTION 1: CARD (Stripe Embedded Onramp)
  const handleCardChoice = async () => {
    setIsLoadingCard(true);
    setError(null);
    try {
      const res = await fetch('/api/economy/stripe/onramp/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId, userId })
      });
      const data = await res.json();
      if (data.success && data.clientSecret) {
        setOnrampClientSecret(data.clientSecret);
      } else {
        setError(data.error || 'Uplink Refused (Onramp Session Error)');
      }
    } catch (err: any) {
      console.error('[Card Choice] Fault:', err);
      setError('System Fault: Uplink Terminal Disconnected.');
    }
    setIsLoadingCard(false);
  };

  // 🥈 OPTION 2: CRYPTO (Helio Crypto-to-Crypto)
  const handleCryptoChoice = () => {
    setIsLoadingCrypto(true);
    if (pkg.helioPayLink) {
      window.location.href = pkg.helioPayLink;
      return;
    }
    alert('Crypto bridge offline for this tier. Use card settlement.');
    setIsLoadingCrypto(false);
  };

  // 🛡️ LOADING STATE FOR ONRAMP MOUNT
  if (onrampClientSecret) {
    return (
        <div className="p-8 md:p-12 space-y-8 animate-in fade-in duration-500">
             <div className="flex items-center justify-between gap-4">
                <button onClick={() => setOnrampClientSecret(null)} className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-full transition-all">
                    <ArrowRight size={20} className="rotate-180 text-white/40" />
                    <span className="text-[9px] font-black uppercase text-white/40 tracking-widest">Back to choice</span>
                </button>
             </div>
             <div className="p-6 rounded-[2rem] bg-[#00f0ff]/5 border border-[#00f0ff]/30 border-dashed flex items-center justify-between">
                <div>
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-[#00f0ff] italic">Formal Onramp Active</h4>
                   <p className="text-[8px] text-[#00f0ff]/60 uppercase tracking-widest">Complete verification to infuse your account</p>
                </div>
                <ShieldCheck size={24} className="text-[#00f0ff]" />
             </div>
             <StripeEmbeddedOnramp 
                clientSecret={onrampClientSecret} 
                onSuccess={() => onSuccess(totalCredits)}
                onCancel={() => setOnrampClientSecret(null)}
             />
        </div>
    );
  }

  return (
    <div className="p-8 md:p-12 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* BACK + HEADER */}
      <div className="flex items-center gap-4">
        <button onClick={onCancel} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <ArrowRight size={20} className="rotate-180 text-white/40" />
        </button>
        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase text-[#00f0ff] tracking-widest">Settlement Gate Active</span>
          <h3 className="text-2xl font-syncopate font-black uppercase text-white italic">Choose Rail</h3>
        </div>
      </div>

      {/* ERROR FEEDBACK */}
      {error && (
        <div className="p-6 rounded-[2rem] bg-red-500/10 border border-red-500/30 text-red-500 flex flex-col gap-3 animate-in shake-in shadow-[0_0_40px_rgba(239,68,68,0.1)]">
            <div className="flex items-center gap-3">
                <AlertCircle size={20} className="shrink-0" />
                <span className="text-xs font-black uppercase tracking-widest">{error}</span>
            </div>
            {error.includes('Missing API Key') && (
                <p className="text-[9px] uppercase tracking-widest text-red-500/60 leading-relaxed font-black italic border-t border-red-500/20 pt-3">
                   SYSTEM ALERT: STRIPE_SECRET_KEY is required in your environmental core to enable institutional fiat-to-asset settlement. 🛡️
                </p>
            )}
        </div>
      )}

      {/* PACKAGE SUMMARY */}
      <div className="p-6 md:p-8 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-between shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00f0ff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex flex-col gap-1 relative z-10">
          <span className="text-[10px] md:text-[11px] uppercase font-black text-white/40 tracking-[0.3em] italic mb-1">Terminal Tier: {pkg.label}</span>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl md:text-5xl font-syncopate font-black text-white italic drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">{totalCredits.toLocaleString()}</span>
            <span className="text-[10px] md:text-xs font-black text-[#00f0ff] uppercase tracking-[0.4em] italic animate-pulse">Breathe Points</span>
          </div>
        </div>
        <div className="flex flex-col items-end relative z-10 text-right">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Total Stake</span>
            <span className="text-4xl md:text-5xl font-syncopate font-black text-[#ffea00] italic underline decoration-[#ffea00]/30 underline-offset-8 decoration-wavy transition-all group-hover:text-white">${pkg.priceUsd}</span>
        </div>
      </div>

      {/* 🚀 THE SATURDAY MONEY PRINTER: THREE RAILS */}
      <div className="grid grid-cols-1 gap-5">

        {/* 🥇 #1: THE MONEY PRINTER: DIRECT WALLET (Sovereign Elite) */}
        <button
          onClick={() => {
             setError(null);
             const address = SYNDICATE_TREASURY_SOL;
             const amountRaw = pkg.priceUsd;
             // 🧬 SIMULATE BRIDGE LINK (Redirect to wallet/pay-link or show deep-link)
             console.log(`[Elite Rail] Initializing direct bridge to: ${address}`);
             window.open(`https://solscan.io/account/${address}`, '_blank');
             alert(`DIRECT RAILS INITIALIZED:\n\nTransfer ${amountRaw} USDC to:\n${address}\n\nYour Credits will be infused automatically once the Syndicate node detects the handshake.`);
          }}
          className="w-full h-24 rounded-[2.5rem] bg-gradient-to-r from-[#00f0ff] via-[#ff00ff] to-[#ffea00] text-white p-[1.5px] shadow-[0_20px_60px_rgba(0,240,255,0.2)] hover:scale-[1.02] active:scale-95 transition-all group overflow-hidden"
        >
           <div className="w-full h-full bg-black rounded-[2.5rem] flex items-center justify-between px-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[#00f0ff]/10 to-transparent pointer-events-none" />
              <div className="flex items-center gap-6 text-left relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center animate-pulse group-hover:bg-[#00f0ff]/20 transition-all">
                   <Zap size={32} className="text-[#00f0ff]" fill="#00f0ff" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-black uppercase tracking-[0.25em] text-white italic group-hover:text-[#00f0ff] transition-colors">Direct Wallet Settlement</span>
                  <span className="text-[9px] uppercase tracking-[0.3em] text-white/30 font-bold group-hover:text-white/60 transition-colors mt-1">Privy/Phantom Bridge • Zero Middleman • Instant Alpha</span>
                </div>
              </div>
              <div className="flex flex-col items-end relative z-10">
                  <div className="px-3 py-1 bg-[#ffea00]/10 border border-[#ffea00]/30 rounded-lg">
                    <span className="text-[9px] font-black text-[#ffea00] uppercase tracking-widest animate-pulse italic">Priority Rail</span>
                  </div>
                  <ArrowRight size={24} className="text-white/20 mt-2 group-hover:text-white group-hover:translate-x-2 transition-all" />
              </div>
           </div>
        </button>

        {/* 🥈 #2: THE HELIO BRIDGE: P2P LINK */}
        <button
          onClick={handleCryptoChoice}
          disabled={isLoadingCard || isLoadingCrypto || (!pkg.helioPayLink && !isCustom)}
          className="w-full h-20 rounded-3xl bg-white/[0.03] border border-white/5 text-white flex items-center justify-between px-8 hover:bg-white/[0.06] hover:border-[#ffea00]/40 active:scale-95 transition-all disabled:opacity-30 group"
        >
          <div className="flex items-center gap-5 text-white">
            <Bitcoin size={28} className="text-white/20 shrink-0 group-hover:text-[#ffea00] transition-colors" />
            <div className="flex flex-col items-start text-left">
              <span className="text-[12px] font-black uppercase tracking-[0.25em] text-white/60 group-hover:text-white transition-colors">P2P Crypto Link</span>
              <span className="text-[9px] uppercase tracking-[0.3em] text-white/20 font-bold">Legacy Helio Bridge (USDC/SOL/ETH)</span>
            </div>
          </div>
          <ArrowRight size={20} className="text-white/10 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </button>

        {/* 🥉 #3: THE FIAT BRIDGE: CARD (Stripe Onramp) */}
        <button
          onClick={handleCardChoice}
          disabled={isLoadingCard || isLoadingCrypto}
          className="w-full h-20 rounded-3xl bg-white/[0.02] border border-white/5 text-white flex items-center justify-between px-8 hover:bg-[#00f0ff]/10 hover:border-[#00f0ff]/40 active:scale-95 transition-all disabled:opacity-50 group"
        >
          <div className="flex items-center gap-5">
            <CreditCard size={28} className="shrink-0 text-white/20 group-hover:text-[#00f0ff] transition-colors" />
            <div className="flex flex-col items-start text-left">
              <span className="text-[12px] font-black uppercase tracking-[0.25em] text-white/40 group-hover:text-white transition-colors">Fiat-to-Asset Bridge</span>
              <span className="text-[9px] uppercase tracking-[0.3em] text-white/10 font-bold">Secure Card Settlement (Stripe Crypto)</span>
            </div>
          </div>
          {isLoadingCard ? <Loader2 size={24} className="animate-spin text-[#00f0ff]" /> : <ArrowRight size={20} className="text-white/10 group-hover:text-white group-hover:translate-x-1 transition-all" />}
        </button>

      </div>

      {/* COMPLIANCE FOOTER */}
      <p className="text-[7px] text-white/10 uppercase tracking-[0.2em] font-black text-center italic">
        Formal Digital Asset Fulfillment. Identity Verification Managed by Stripe. 🛡️
      </p>

    </div>
  );
}
