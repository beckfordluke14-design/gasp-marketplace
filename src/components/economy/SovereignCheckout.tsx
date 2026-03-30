'use client';

import { useState } from 'react';
import { CreditCard, Zap, Loader2, ArrowRight, Bitcoin } from 'lucide-react';
import { CREDIT_PACKAGES } from '@/lib/economy/constants';

interface SovereignCheckoutProps {
  userId: string;
  packageId: string;
  onSuccess: (credits: number) => void;
  onCancel: () => void;
}

export default function SovereignCheckout({ userId, packageId, onSuccess, onCancel }: SovereignCheckoutProps) {
  const [isLoadingCard, setIsLoadingCard] = useState(false);
  const [isLoadingCrypto, setIsLoadingCrypto] = useState(false);

  const isCustom = packageId.startsWith('custom_');
  const customVal = isCustom ? parseFloat(packageId.split('_')[1]) : 0;
  const pkg = isCustom 
    ? { id: packageId, priceUsd: customVal, credits: customVal * 15, label: 'Custom Terminal Infusion', helioPayLink: '', stripeLink: '' }
    : (CREDIT_PACKAGES.find(p => p.id === packageId) || CREDIT_PACKAGES[0]);

  const totalCredits = pkg.credits;

  // 🥇 CARD RAIL: Stripe Checkout Session
  const handleCardPayment = async () => {
    setIsLoadingCard(true);
    try {
      const res = await fetch('/api/economy/stripe/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId, userId })
      });
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
        return;
      }
      if (pkg.stripeLink) { window.location.href = pkg.stripeLink; return; }
      console.error('[Card Rail] Error:', data.error);
    } catch (err) {
      console.error('[Card Rail] Fault:', err);
      if (pkg.stripeLink) { window.location.href = pkg.stripeLink; return; }
    }
    setIsLoadingCard(false);
  };

  // 🥈 CRYPTO RAIL: Helio Pay
  const handleCryptoPayment = () => {
    setIsLoadingCrypto(true);
    if (pkg.helioPayLink) {
      window.location.href = pkg.helioPayLink;
      return;
    }
    alert('Crypto bridge offline for this tier. Use card settlement.');
    setIsLoadingCrypto(false);
  };

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

      {/* DUAL RAIL */}
      <div className="grid grid-cols-1 gap-4">

        {/* 🥇 CARD RAIL */}
        <button
          onClick={handleCardPayment}
          disabled={isLoadingCard || isLoadingCrypto}
          className="w-full h-20 rounded-2xl bg-white text-black flex items-center justify-between px-8 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
        >
          <div className="flex items-center gap-4">
            <CreditCard size={24} className="shrink-0" />
            <div className="flex flex-col items-start">
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">Pay by Card</span>
              <span className="text-[8px] uppercase tracking-widest text-black/40">Visa • Mastercard • Apple Pay</span>
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

        {/* 🥈 CRYPTO RAIL */}
        <button
          onClick={handleCryptoPayment}
          disabled={isLoadingCard || isLoadingCrypto || !pkg.helioPayLink}
          className="w-full h-20 rounded-2xl bg-transparent border border-[#ff00ff]/30 text-white flex items-center justify-between px-8 hover:bg-[#ff00ff]/5 hover:border-[#ff00ff]/60 active:scale-95 transition-all disabled:opacity-30"
        >
          <div className="flex items-center gap-4">
            <Bitcoin size={24} className="text-[#ff00ff] shrink-0" />
            <div className="flex flex-col items-start">
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">Pay with Crypto</span>
              <span className="text-[8px] uppercase tracking-widest text-white/30">USDC • SOL • ETH via Helio</span>
            </div>
          </div>
          {isLoadingCrypto ? <Loader2 size={20} className="animate-spin text-[#ff00ff]" /> : <ArrowRight size={20} className="text-[#ff00ff]" />}
        </button>

      </div>

      {/* COMPLIANCE FOOTER */}
      <p className="text-[7px] text-white/10 uppercase tracking-[0.2em] font-black text-center italic">
        Fulfilled by AllTheseFlows LLC. Card via Stripe • Crypto via Helio Pay. 🛡️
      </p>

      <button onClick={onCancel} className="w-full text-[9px] font-black uppercase tracking-widest text-white/10 hover:text-white transition-colors pt-2">
        Return to Selection Gate
      </button>

    </div>
  );
}
