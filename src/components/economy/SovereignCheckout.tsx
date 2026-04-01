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

/**
 * 🛡️ SOVEREIGN AUTONOMOUS CHECKOUT
 * Card: Stripe Crypto Onramp (Approved) | Crypto: Helio P2P
 */
export default function SovereignCheckout({ userId, packageId, onSuccess, onCancel }: SovereignCheckoutProps) {
  const [isLoadingCard, setIsLoadingCard] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCustom = packageId.startsWith('custom_');
  const customVal = isCustom ? parseFloat(packageId.split('_')[1]) : 0;
  const pkg = isCustom 
    ? { id: packageId, priceUsd: customVal, credits: customVal * 15, label: 'Custom Terminal Infusion', helioPayLink: undefined }
    : (CREDIT_PACKAGES.find(p => p.id === packageId) || CREDIT_PACKAGES[0]);

  const totalCredits = pkg.credits;

  const handleCardChoice = async () => {
    setIsLoadingCard(true);
    setError(null);
    try {
      // Load Stripe Onramp JS SDK if not already present
      if (!(window as any).StripeOnramp) {
        await new Promise<void>((resolve, reject) => {
          const s1 = document.createElement('script');
          s1.src = 'https://js.stripe.com/dahlia/stripe.js';
          s1.onload = () => {
            const s2 = document.createElement('script');
            s2.src = 'https://crypto-js.stripe.com/crypto-onramp-outer.js';
            s2.onload = () => resolve();
            s2.onerror = reject;
            document.head.appendChild(s2);
          };
          s1.onerror = reject;
          document.head.appendChild(s1);
        });
      }

      // Exact pattern from Stripe docs — pre-fills amount, currency, network
      const standaloneOnramp = (window as any).StripeOnramp.Standalone({
        source_currency: 'usd',
        amount: { source_amount: pkg.priceUsd.toString() },
        destination_currency: 'usdc',
        destination_network: 'solana',
      });
      window.location.href = standaloneOnramp.getUrl();

    } catch (err: any) {
      setError(`Fault: ${err.message}`);
      setIsLoadingCard(false);
    }
  };

  const handleCryptoChoice = () => {
    trackEvent('vault_unlock_intent', packageId);
    if (!pkg.helioPayLink) {
      setError('Crypto rail not available for this tier.');
      return;
    }
    // Route through server bridge — stores userId before redirecting to Helio
    window.location.href = `/api/economy/helio/redirect?userId=${userId}&packageId=${packageId}`;
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

      {/* ERROR FEEDBACK — shows full Stripe rejection message */}
      {error && (
        <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-start gap-3">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span className="text-[10px] font-mono tracking-wide leading-relaxed break-all">{error}</span>
        </div>
      )}

      {/* PACKAGE SUMMARY */}
      <div className="p-5 md:p-8 rounded-[2rem] bg-white/5 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00f0ff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex flex-col gap-1 relative z-10 shrink-0">
          <span className="text-[9px] md:text-[11px] uppercase font-black text-white/40 tracking-[0.3em] italic mb-1">Terminal Tier: {pkg.label}</span>
          <div className="flex flex-col items-start leading-none">
            <span className="text-3xl md:text-5xl font-syncopate font-black text-white italic">{totalCredits.toLocaleString()}</span>
            <span className="text-[8px] md:text-[10px] font-black text-[#00f0ff] uppercase tracking-[0.3em] italic animate-pulse mt-1 md:mt-2">SYSTEM CREDITS</span>
          </div>
        </div>
        <div className="flex flex-col items-start md:items-end relative z-10 border-t md:border-t-0 border-white/5 pt-4 md:pt-0 shrink-0">
          <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Settlement Amount</span>
          <span className="text-2xl md:text-5xl font-syncopate font-black text-[#ffea00] italic whitespace-nowrap tracking-tighter group-hover:text-white transition-all">${pkg.priceUsd}</span>
        </div>
      </div>

      {/* SETTLEMENT RAILS */}
      <div className={`grid grid-cols-1 ${pkg.helioPayLink ? 'md:grid-cols-2' : ''} gap-4 md:gap-6`}>
        
        {/* CARD: Stripe Onramp — always shown */}
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

        {/* CRYPTO: Helio P2P — only for tiers with a helioPayLink */}
        {pkg.helioPayLink && (
        <button 
          onClick={handleCryptoChoice}
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
        )}

      </div>

      <div className="flex items-center justify-center gap-3 pt-2">
        <ShieldCheck size={12} className="text-[#00f0ff]" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 italic">
          Institutional Settlement Gate // Secure Verification Active 🛡️
        </p>
      </div>
    </div>
  );
}
