'use client';

import { X, Zap, Trophy, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { COIN_PACKAGES } from '@/lib/economy/constants';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface TopUpDrawerProps {
  onClose: () => void;
  userId: string;
}

/**
 * $GASPAI HYBRID STAKE HUB v1.7
 * Objective: Maximize revenue via CCBill (Card) + Crypto (USDC) with 1:1 TGE Stake logic.
 */
export default function TopUpDrawer({ onClose, userId }: TopUpDrawerProps) {
  const [loadingPkg, setLoadingPkg] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto'>('card');

  // 🧬 CCBILL ACCOUNT CONFIGURATION
  const CCBILL_ACC_NO = '953456'; 
  const CCBILL_SUBACC = '0001';
  const CCBILL_FORM_NAME = '123flex'; 

  // 🧬 REAL MERCHANT WALLET ADDRESS (SOLANA NETWORK)
  const CRYPTO_WALLET_ADDRESS = 'DGQVNRTWEv1HEwP6Wtcm1LEUPgZKsW9JfwVpEDjPcEkS'; 

  /**
   * HYBRID REDIRECT ENGINE
   * Dispatches to CCBill or provides Crypto instructions.
   */
  async function handlePurchase(pkgId: string) {
    if (loadingPkg) return;
    const pkg = COIN_PACKAGES.find(p => p.id === pkgId);
    if (!pkg) return;

    setLoadingPkg(pkgId);
    
    // 1. Log Intent for Auditor Tracking
    try {
        const { createBrowserClient } = await import('@supabase/ssr');
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        await supabase.from('cart_intent').insert({ 
            user_id: userId, 
            package_id: pkgId, 
            method: paymentMethod 
        });
    } catch (e) { console.warn('Intent log skipped.'); }

    if (paymentMethod === 'card') {
      // CCBILL SECURE REDIRECT
      const baseUrl = 'https://api.ccbill.com/wap-frontflex/flexformv2.php';
      const params = new URLSearchParams({
          clientAccNo: CCBILL_ACC_NO,
          clientSubacc: CCBILL_SUBACC,
          formName: CCBILL_FORM_NAME,
          currencyCode: '840', // USD
          initialPrice: pkg.priceUsd.toString(),
          initialPeriod: '90',
          'X-userId': userId,
          'X-packageId': pkgId
      });
      window.location.href = `${baseUrl}?${params.toString()}`;
    } else {
      // 🧬 CRYPTO BRIDGE FLOW v1.7
      alert(`[CRYPTO PULSE]: Send $${pkg.priceUsd} in USDC (SOLANA or BASE Network) to: ${CRYPTO_WALLET_ADDRESS}. Your $GASPAI Stake (with 15% Bonus) will be credited instantly upon 1 Network Confirmation. 🛡️`);
      setLoadingPkg(null);
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[420px] bg-black/95 backdrop-blur-3xl border-l border-white/10 z-[300] shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col pointer-events-auto font-outfit">
      
      {/* Header */}
      <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-[#ffea00] flex items-center justify-center shadow-[0_0_30px_rgba(255,234,0,0.3)]">
              <Zap size={24} className="text-black" />
           </div>
           <div>
              <h3 className="text-xl font-syncopate font-black uppercase italic text-white leading-none">
                 $GASPAI HUB
              </h3>
              <p className="text-[10px] text-[#ffea00] uppercase font-black tracking-widest mt-2 underline decoration-[#ffea00]/30 underline-offset-4">
                 TGE Stake Reservation
              </p>
           </div>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center">
          <X size={20} className="text-white/40" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-8">
        
        {/* Method Toggles */}
        <div className="bg-white/5 rounded-2xl p-1.5 flex items-center gap-1 border border-white/10">
           <button 
             onClick={() => setPaymentMethod('card')}
             className={`flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentMethod === 'card' ? 'bg-[#ffea00] text-black shadow-[0_0_15px_#ffea0044]' : 'text-white/40 hover:text-white'}`}
           >
              Credit Card
           </button>
           <button 
             onClick={() => setPaymentMethod('crypto')}
             className={`flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden ${paymentMethod === 'crypto' ? 'bg-[#00f0ff] text-black shadow-[0_0_15px_#00f0ff44]' : 'text-white/40 hover:text-white'}`}
           >
              Crypto (USDC)
              {paymentMethod !== 'crypto' && <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-[#00f0ff] text-black text-[6px] font-black rounded-full">+15% Bonus</span>}
           </button>
        </div>

        {/* 🧬 CRYPTO-SPECIFIC INSTRUCTIONS */}
        {paymentMethod === 'crypto' && (
            <div className="p-5 rounded-2xl bg-[#00f0ff]/5 border border-[#00f0ff]/20 animate-in fade-in slide-in-from-top-4 duration-500">
               <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse" />
                     <span className="text-[8px] font-black uppercase tracking-widest text-[#00f0ff]">Gasp Merchant Node v1.7 Active</span>
                  </div>
                  <ShieldCheck size={12} className="text-white/20" />
               </div>
               <p className="text-[10px] text-white/50 leading-relaxed font-bold italic">
                  Node Protocol: <span className="text-white underline decoration-[#00f0ff]/30 text-[11px]">SOLANA Network ONLY</span>. USDC Stablecoin Settlement Active. <span className="text-[#00f0ff]">No USDC? Acquire instantly in Phantom/Trust via Card.</span> 🛡️
               </p>
               <button 
                 onClick={() => {
                   navigator.clipboard.writeText(CRYPTO_WALLET_ADDRESS);
                   alert('Gasp Merchant Address Copied to Clipboard! 🏎️💨');
                 }}
                 className="w-full h-10 mt-4 border border-[#00f0ff]/30 rounded-xl flex items-center justify-between px-4 hover:bg-[#00f0ff]/10 transition-all group"
               >
                  <span className="text-[7px] font-black text-white/40 uppercase tracking-widest group-hover:text-white">Copy Merchant Ledger ID</span>
                  <div className="flex items-center gap-2">
                     <span className="text-[6px] font-mono text-white/10 uppercase group-hover:text-white/30 transition-colors uppercase">USDC (SOL/BASE)</span>
                     <ArrowRight size={10} className="text-[#00f0ff]" />
                  </div>
               </button>
            </div>
        )}

        <div className="space-y-4">
           <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-white/40 italic">Select Your Tier</h4>
           <div className="grid gap-4">
              {COIN_PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  disabled={!!loadingPkg}
                  onClick={() => handlePurchase(pkg.id)}
                  className={`
                    relative group transition-all duration-300
                    p-6 rounded-2xl bg-white/5 border border-white/10 
                    flex items-center justify-between overflow-hidden
                    hover:bg-white/[0.08] hover:border-white/20
                    ${pkg.isPopular ? 'border-[#ffea00]/40 bg-[#ffea00]/5 shadow-[0_0_20px_rgba(255,234,0,0.1)]' : ''}
                    disabled:opacity-50 disabled:grayscale
                  `}
                >
                  <div className="flex flex-col items-start gap-1 relative z-10 text-left">
                    {pkg.isPopular && (
                        <span className="text-[9px] font-black uppercase text-[#ffea00] tracking-[0.2em] mb-3 flex items-center gap-2">
                            <Trophy size={10} fill="#ffea00" />
                            Elite Whale Tier
                        </span>
                    )}
                    <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">{pkg.label}</span>
                    <span className="text-3xl font-syncopate font-bold text-white mt-1 italic leading-none">
                        {(paymentMethod === 'crypto' ? Math.floor(pkg.coins * 1.15) : pkg.coins).toLocaleString()}
                        <span className="text-[10px] uppercase font-black text-white/20 tracking-widest not-italic ml-2">credits</span>
                    </span>
                    <div className="mt-4 px-2.5 py-1 rounded-md bg-white/10 border border-white/10">
                        <span className="text-[8px] font-black text-[#00f0ff] uppercase tracking-widest font-syncopate italic">
                           {paymentMethod === 'crypto' ? 'Exclusive 1.15x Stake Multiplier' : 'Airdrop Multiplier Active'}
                        </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 z-10">
                    <span className="text-xl font-black text-white/20 group-hover:text-white transition-colors italic">
                        ${pkg.priceUsd}
                    </span>
                    <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center
                        ${paymentMethod === 'card' ? 'bg-[#ffea00]' : 'bg-[#00f0ff]'} text-black shadow-lg
                        group-hover:scale-110 active:scale-95 transition-all
                    `}>
                        {loadingPkg === pkg.id ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
                    </div>
                  </div>
                </button>
              ))}
           </div>
        </div>

        {/* Info & CCBill Compliance Array */}
        <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] space-y-4">
            <h5 className="text-[9px] font-black uppercase tracking-[0.25em] text-[#ffea00] flex items-center gap-2">
                <ShieldCheck size={12} /> SECURE PROTOCOL G-V1.7
            </h5>
            <p className="text-[8px] text-white/10 uppercase tracking-[0.3em] mt-2 block leading-loose border-t border-white/5 pt-4 font-black italic">
                {paymentMethod === 'card' 
                  ? 'Processed by AllTheseFlows LLC via CCBill. 18+ Verification Mandatory.' 
                  : 'Direct Crypto Bridge. Zero Chargebacks. 15% Bonus Credits Applied.'}
            </p>
            <p className="text-[7px] text-white/5 uppercase tracking-[0.3em] font-black italic text-center">
                Virtual currency possesses zero cash value until $GASPAI token generation. All reservations are final. 🧬🛡️
            </p>
        </div>
      </div>
    </div>
  );
}



