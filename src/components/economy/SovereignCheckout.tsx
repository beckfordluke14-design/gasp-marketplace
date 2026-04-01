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
  const [showDirectWallet, setShowDirectWallet] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [signature, setSignature] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const isCustom = packageId.startsWith('custom_');
  const customVal = isCustom ? parseFloat(packageId.split('_')[1]) : 0;
  const pkg = isCustom 
    ? { id: packageId, priceUsd: customVal, credits: customVal * 15, label: 'Custom Terminal Infusion', helioPayLink: '', stripeLink: '' }
    : (CREDIT_PACKAGES.find(p => p.id === packageId) || CREDIT_PACKAGES[0]);

  const totalCredits = pkg.credits;

  // 🥇 OPTION 1: CARD (Stripe-Hosted Redirect Bridge)
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
          // 🚀 SOVEREIGN REDIRECT: Bypassing Iframe Errors
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(SYNDICATE_TREASURY_SOL);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleVerifySignal = async () => {
    if (!signature) {
       alert('Protocol Error: Missing Transaction Signature (TX Hash)');
       return;
    }
    setIsVerifying(true);
    try {
      const res = await fetch('/api/economy/manual-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, packageId, signature })
      });
      const data = await res.json();
      if (data.success) {
        alert("SYNCRONIZING BLOCKCHAIN...\n\nHandshake signal recorded in Syndicate Registry. Stand by for block finality verification.");
        setShowDirectWallet(false);
      } else {
        alert(`Uplink Denied: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Fatal Error: Uplink terminal lost. Attempt again.`);
    } finally {
      setIsVerifying(false);
    }
  };

  // 🛡️ DIRECT WALLET SUB-VIEW
  if (showDirectWallet) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${SYNDICATE_TREASURY_SOL}&bgcolor=050505&color=00f0ff`;
    
    return (
      <div className="p-8 md:p-12 space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowDirectWallet(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <ArrowRight size={20} className="rotate-180 text-white/40" />
            </button>
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase text-[#ffea00] tracking-widest">Sovereign Rail active</span>
              <h3 className="text-xl font-syncopate font-black uppercase text-white italic">Verify Handshake</h3>
            </div>
          </div>

          <div className="flex flex-col items-center gap-8 py-4">
             <div className="relative group">
                <div className="absolute -inset-4 bg-[#00f0ff]/20 blur-3xl opacity-50 group-hover:opacity-80 transition-opacity animate-pulse" />
                <div className="w-52 h-52 bg-black border border-[#00f0ff]/30 rounded-3xl p-4 relative z-10 shadow-[0_0_50px_rgba(0,240,255,0.1)]">
                   <img src={qrUrl} alt="USDC Settlement QR" className="w-full h-full rounded-xl mix-blend-lighten" />
                   <div className="absolute inset-0 border border-[#00f0ff]/20 rounded-3xl pointer-events-none" />
                </div>
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-[#00f0ff] rounded-full flex items-center justify-center text-black shadow-lg animate-bounce duration-[2000ms]">
                   <ShieldCheck size={20} />
                </div>
             </div>

             <div className="w-full space-y-6">
                <div className="space-y-2 text-center">
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00f0ff] italic">Sovereign Treasury Node (USDC / SOL)</span>
                   <button 
                     onClick={copyToClipboard}
                     className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between px-6 group active:scale-95 transition-all overflow-hidden relative"
                   >
                     {hasCopied && <div className="absolute inset-0 bg-[#00f0ff] text-black text-[10px] font-black flex items-center justify-center uppercase tracking-widest animate-in slide-in-from-bottom duration-300">Copied to Clipboard</div>}
                     <code className="text-[10px] text-white/60 font-mono truncate mr-4">{SYNDICATE_TREASURY_SOL}</code>
                     <span className="text-[9px] font-black text-[#00f0ff] uppercase tracking-widest group-hover:scale-110 transition-transform">Copy</span>
                   </button>
                </div>

                <div className="p-6 rounded-3xl bg-[#ffea00]/5 border border-[#ffea00]/20 space-y-4">
                   <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#ffea00] flex items-center justify-center text-black">
                         <span className="text-[10px] font-black italic">!</span>
                      </div>
                      <span className="text-[10px] font-black uppercase text-[#ffea00] tracking-widest">Protocol Instructions</span>
                   </div>
                   <p className="text-[9px] text-[#ffea00]/60 uppercase tracking-widest leading-relaxed font-bold">
                      Transfer <span className="text-white">${pkg.priceUsd} USDC</span> (Solana) to the address above. Credits will infuse automatically once the transaction hits the finality block (~12s). 🛰️
                   </p>
                </div>

                <div className="space-y-4">
                   <div className="space-y-2">
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic">Signature Link</span>
                       <input 
                         type="text"
                         value={signature}
                         onChange={(e) => setSignature(e.target.value)}
                         placeholder="Paste SOL/USDC Signature (Hash)"
                         className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-[10px] font-mono text-white outline-none focus:border-[#00f0ff]/50 transition-all placeholder:text-white/10"
                       />
                   </div>
                   <button
                      onClick={handleVerifySignal}
                      disabled={isVerifying || !signature}
                      className="w-full h-16 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-[0.3em] font-syncopate hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_60px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3 disabled:opacity-30"
                   >
                      {isVerifying ? 'Synchronizing Block...' : 'Verify Settlement Signal'}
                      {!isVerifying && <Zap size={14} fill="currentColor" />}
                      {isVerifying && <Loader2 size={14} className="animate-spin" />}
                   </button>
                </div>
             </div>
          </div>
      </div>
    );
  }

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
      <div className="p-5 md:p-8 rounded-[2rem] bg-white/5 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00f0ff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex flex-col gap-1 relative z-10 w-full md:w-auto">
          <span className="text-[9px] md:text-[11px] uppercase font-black text-white/40 tracking-[0.3em] italic mb-1">Terminal Tier: {pkg.label}</span>
          <div className="flex flex-col items-start leading-none">
            <span className="text-3xl md:text-5xl font-syncopate font-black text-white italic drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] truncate max-w-full">{totalCredits.toLocaleString()}</span>
            <span className="text-[8px] md:text-[10px] font-black text-[#00f0ff] uppercase tracking-[0.3em] italic animate-pulse mt-1 md:mt-2">SYSTEM CREDITS</span>
          </div>
        </div>
        <div className="flex flex-col items-start md:items-end relative z-10 text-left md:text-right border-t md:border-t-0 border-white/5 pt-3 md:pt-0 w-full md:w-auto">
            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Settlement Amount</span>
            <span className="text-3xl md:text-6xl font-syncopate font-black text-[#ffea00] italic underline-offset-4 decoration-wavy transition-all group-hover:text-white">${pkg.priceUsd}</span>
        </div>
      </div>

      {/* 🚀 THE SATURDAY MONEY PRINTER: THREE RAILS */}
      <div className="grid grid-cols-1 gap-5">

        {/* 🥇 #1: THE MONEY PRINTER: DIRECT WALLET (Sovereign Elite) */}
        <button
          onClick={() => { setShowDirectWallet(true); setError(null); }}
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
                  <span className="text-[9px] uppercase tracking-[0.3em] text-white/30 font-bold group-hover:text-white/60 transition-colors mt-1">NO MINIMUM • ZERO FEES • SECURE HANDSHAKE</span>
                </div>
              </div>
              <div className="flex flex-col items-end relative z-10">
                  <div className="px-3 py-1 bg-[#ffea00]/10 border border-[#ffea00]/30 rounded-lg flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-[#ffea00] animate-ping" />
                    <span className="text-[8px] md:text-[9px] font-black text-[#ffea00] uppercase tracking-widest italic leading-none">Best for micro-infusions</span>
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
