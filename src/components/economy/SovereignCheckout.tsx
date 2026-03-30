'use client';

import { useState } from 'react';
import { CreditCard, Zap, Loader2, ArrowRight, Bitcoin, ShieldCheck, AlertCircle } from 'lucide-react';
import { CREDIT_PACKAGES } from '@/lib/economy/constants';
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

      {/* DUAL RAIL CHOICE */}
      <div className="grid grid-cols-1 gap-4">

        {/* 🥇 RAILS: CARD (Stripe Onramp) */}
        <button
          onClick={handleCardChoice}
          disabled={isLoadingCard || isLoadingCrypto}
          className="w-full h-20 rounded-2xl bg-white text-black flex items-center justify-between px-8 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
        >
          <div className="flex items-center gap-4">
            <CreditCard size={24} className="shrink-0" />
            <div className="flex flex-col items-start">
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">Pay by Card</span>
              <span className="text-[8px] uppercase tracking-widest text-black/40">Formal Fiat-to-Crypto Onramp (Stripe)</span>
            </div>
          </div>
          {isLoadingCard ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} fill="black" />}
        </button>

        {/* SEPARATOR */}
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-white/5" />
          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/10">or</span>
          <div className="h-px flex-1 bg-white/5" />
        </div>

        {/* 🥈 RAILS: CRYPTO (Helio P2P) */}
        <button
          onClick={handleCryptoChoice}
          disabled={isLoadingCard || isLoadingCrypto || (!pkg.helioPayLink && !isCustom)}
          className="w-full h-20 rounded-2xl bg-transparent border border-[#ff00ff]/30 text-white flex items-center justify-between px-8 hover:bg-[#ff00ff]/5 hover:border-[#ff00ff]/60 active:scale-95 transition-all disabled:opacity-30"
        >
          <div className="flex items-center gap-4">
            <Bitcoin size={24} className="text-[#ff00ff] shrink-0" />
            <div className="flex flex-col items-start">
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">Pay with Crypto</span>
              <span className="text-[8px] uppercase tracking-widest text-white/30">Direct P2P Settlement (USDC/SOL/ETH)</span>
            </div>
          </div>
          {isLoadingCrypto ? <Loader2 size={20} className="animate-spin text-[#ff00ff]" /> : <ArrowRight size={20} className="text-[#ff00ff]" />}
        </button>

      </div>

      {/* COMPLIANCE FOOTER */}
      <p className="text-[7px] text-white/10 uppercase tracking-[0.2em] font-black text-center italic">
        Formal Digital Asset Fulfillment. Identity Verification Managed by Stripe. 🛡️
      </p>

    </div>
  );
}
