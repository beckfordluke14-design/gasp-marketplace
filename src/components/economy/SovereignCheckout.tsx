'use client';

import { useState } from 'react';
import { CreditCard, Loader2, ArrowRight, Globe, AlertCircle, ShieldCheck } from 'lucide-react';
import { CREDIT_PACKAGES } from '@/lib/economy/constants';
import { trackEvent } from '@/lib/telemetry';

interface SovereignCheckoutProps {
  userId: string;
  packageId: string;
  onSuccess: (credits: number) => void;
  onCancel: () => void;
}

const HELIO_LINKS = {
  '19.99': 'https://helio.xyz/pay/65f1e1a2f6b3a9c7d8e9f0a1', // Placeholder
  '49.99': 'https://helio.xyz/pay/65f1e1a2f6b3a9c7d8e9f0a2',
  '99.99': 'https://helio.xyz/pay/65f1e1a2f6b3a9c7d8e9f0a3',
  '999.99': 'https://helio.xyz/pay/65f1e1a2f6b3a9c7d8e9f0a4',
};

/**
 * 🛰️ SOVEREIGN AUTONOMOUS CHECKOUT
 * Choice: Card (Stripe Redirect) OR Crypto (Helio P2P Link)
 */
export default function SovereignCheckout({ userId, packageId, onSuccess, onCancel }: SovereignCheckoutProps) {
  const [isLoadingCard, setIsLoadingCard] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCustom = packageId.startsWith('custom_');
  const customVal = isCustom ? parseFloat(packageId.split('_')[1]) : 0;
  const pkg = isCustom 
    ? { id: packageId, priceUsd: customVal, credits: customVal * 15, label: 'Custom Terminal Infusion' }
    : (CREDIT_PACKAGES.find(p => p.id === packageId) || CREDIT_PACKAGES[0]);

  const totalCredits = pkg.credits;

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
      if (data.success && data.onrampUrl) {
          window.location.href = data.onrampUrl;
      } else {
        setError(data.error || 'Uplink Refused (Onramp Session Error)');
      }
    } catch (err: any) {
      console.error('[Card Choice] Fault:', err);
      setError('System Fault: Uplink Terminal Disconnected.');
    }
    setIsLoadingCard(false);
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

      {/* ERROR FEEDBACK */}
      {error && (
        <div className="p-6 rounded-[2rem] bg-red-500/10 border border-red-500/30 text-red-500 flex flex-col gap-3 animate-in shake-in shadow-[0_0_40px_rgba(239,68,68,0.1)]">
            <div className="flex items-center gap-3">
                <AlertCircle size={20} className="shrink-0" />
                <span className="text-xs font-black uppercase tracking-widest">{error}</span>
            </div>
        </div>
      )}

      {/* PACKAGE SUMMARY */}
      <div className="p-5 md:p-8 rounded-[2rem] bg-white/5 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00f0ff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex flex-col gap-1 relative z-10 shrink-0">
          <span className="text-[9px] md:text-[11px] uppercase font-black text-white/40 tracking-[0.3em] italic mb-1">Terminal Tier: {pkg.label}</span>
          <div className="flex flex-col items-start leading-none">
            <span className="text-3xl md:text-5xl font-syncopate font-black text-white italic drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">{totalCredits.toLocaleString()}</span>
            <span className="text-[8px] md:text-[10px] font-black text-[#00f0ff] uppercase tracking-[0.3em] italic animate-pulse mt-1 md:mt-2">SYSTEM CREDITS</span>
          </div>
        </div>
        <div className="flex flex-col items-start md:items-end relative z-10 text-left md:text-right border-t md:border-t-0 border-white/5 pt-4 md:pt-0 shrink-0">
            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Settlement Amount</span>
            <span className="text-2xl md:text-5xl font-syncopate font-black text-[#ffea00] italic transition-all group-hover:text-white whitespace-nowrap tracking-tighter">${pkg.priceUsd}</span>
        </div>
      </div>

      {/* AUTONOMOUS SETTLEMENT RAILS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        
        {/* 🥇 OPTION 1: STRIPE CARD BRIDGE */}
        <button 
          onClick={handleCardChoice}
          disabled={isLoadingCard}
          className="group p-6 md:p-8 rounded-[2rem] bg-white text-black hover:bg-[#ffea00] transition-all flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden shadow-2xl disabled:opacity-50"
        >
           <CreditCard size={32} className="group-hover:scale-110 transition-transform duration-500" />
           <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Option 01</span>
              <span className="text-sm font-syncopate font-black uppercase italic">Card Bridge</span>
           </div>
           {isLoadingCard && (
             <div className="absolute inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-black" />
             </div>
           )}
        </button>

        {/* 🥈 OPTION 2: HELIO CRYPTO RAIL */}
        <button 
          onClick={() => {
            trackEvent('vault_unlock_intent', packageId);
            const link = HELIO_LINKS[packageId as keyof typeof HELIO_LINKS] || HELIO_LINKS['19.99'];
            window.location.href = link;
          }}
          className="group p-6 md:p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:border-[#00f0ff]/40 hover:bg-[#00f0ff]/5 transition-all flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden shadow-2xl"
        >
           <Globe size={32} className="text-[#00f0ff] group-hover:scale-110 transition-transform duration-500" />
           <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Option 02</span>
              <span className="text-sm font-syncopate font-black uppercase text-white italic">Crypto Link</span>
           </div>
           <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/20 text-[#00f0ff] text-[8px] font-black uppercase tracking-widest italic group-hover:bg-[#00f0ff] group-hover:text-black transition-colors">
              P2P Active
           </div>
        </button>

      </div>

      <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-white/20 italic mt-8">
        Institutional Settlement Gate // Secure Verification Active 🛡️
      </p>
    </div>
  );
}
