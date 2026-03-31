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
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-[9px] uppercase font-black tracking-widest flex items-center gap-3 animate-in shake-in">
            <AlertCircle size={16} />
            {error}
        </div>
      )}

      {/* PACKAGE SUMMARY */}
      <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-black text-white/40 tracking-widest italic">{pkg.label}</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-syncopate font-black text-white italic">{totalCredits.toLocaleString()}</span>
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Breathe Points</span>
          </div>
        </div>
        <span className="text-4xl font-syncopate font-black text-[#00f0ff] italic">${pkg.priceUsd}</span>
      </div>

      {/* 🚀 THE SATURDAY MONEY PRINTER: THREE RAILS */}
      <div className="grid grid-cols-1 gap-4">

        {/* 🥇 #1: THE MONEY PRINTER: DIRECT WALLET (Sovereign Elite) */}
        <button
          onClick={() => alert(`Direct USDC Bridge Syncing to your Treasury [${SYNDICATE_TREASURY_SOL.slice(0,6)}...]. This is your Saturday Money Printer.`)}
          className="w-full h-24 rounded-[2rem] bg-gradient-to-r from-[#00f0ff] to-[#ff00ff] text-white p-[1px] shadow-[0_0_60px_rgba(0,240,255,0.3)] hover:scale-[1.02] active:scale-95 transition-all group"
        >
           <div className="w-full h-full bg-black rounded-[2rem] flex items-center justify-between px-8">
              <div className="flex items-center gap-5 text-left">
                <div className="w-12 h-12 rounded-2xl bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center animate-pulse">
                   <Zap size={28} className="text-[#00f0ff]" fill="#00f0ff" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-black uppercase tracking-[0.2em] text-white italic group-hover:text-[#00f0ff] transition-colors">Direct Wallet Settlement</span>
                  <span className="text-[9px] uppercase tracking-widest text-white/30">Privy/Phantom Bridge • Zero Middleman • Instant Alpha</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-[#ffea00] uppercase tracking-widest animate-pulse italic">Priority Rail</span>
                  <ArrowRight size={20} className="text-white/20 mt-1" />
              </div>
           </div>
        </button>

        {/* 🥈 #2: THE HELIO BRIDGE: P2P LINK */}
        <button
          onClick={handleCryptoChoice}
          disabled={isLoadingCard || isLoadingCrypto || (!pkg.helioPayLink && !isCustom)}
          className="w-full h-20 rounded-2xl bg-white/[0.03] border border-white/5 text-white flex items-center justify-between px-8 hover:bg-white/[0.06] hover:border-white/10 active:scale-95 transition-all disabled:opacity-30"
        >
          <div className="flex items-center gap-4 text-white">
            <Bitcoin size={24} className="text-white/20 shrink-0" />
            <div className="flex flex-col items-start">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">P2P Crypto Link</span>
              <span className="text-[8px] uppercase tracking-widest text-white/20">Legacy Helio Bridge (USDC/SOL/ETH)</span>
            </div>
          </div>
          <ArrowRight size={20} className="text-white/10" />
        </button>

        {/* 🥉 #3: THE FIAT BRIDGE: CARD (Stripe Onramp) */}
        <button
          onClick={handleCardChoice}
          disabled={isLoadingCard || isLoadingCrypto}
          className="w-full h-20 rounded-2xl bg-white/[0.02] border border-white/5 text-white flex items-center justify-between px-8 hover:bg-white/[0.04] hover:border-white/10 active:scale-95 transition-all disabled:opacity-50"
        >
          <div className="flex items-center gap-4">
            <CreditCard size={24} className="shrink-0 text-white/20" />
            <div className="flex flex-col items-start">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40">Fiat-to-Asset Bridge</span>
              <span className="text-[8px] uppercase tracking-widest text-white/10">Secure Card Settlement (Stripe Crypto)</span>
            </div>
          </div>
          {isLoadingCard ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} className="text-white/10" />}
        </button>

      </div>

      {/* COMPLIANCE FOOTER */}
      <p className="text-[7px] text-white/10 uppercase tracking-[0.2em] font-black text-center italic">
        Formal Digital Asset Fulfillment. Identity Verification Managed by Stripe. 🛡️
      </p>

    </div>
  );
}
