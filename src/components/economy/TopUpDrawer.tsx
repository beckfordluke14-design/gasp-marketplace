'use client';

import { X, Zap, Trophy, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { CREDIT_PACKAGES } from '@/lib/economy/constants';
import { useState } from 'react';
import { motion } from 'framer-motion';
import SovereignCheckout from './SovereignCheckout';

interface TopUpDrawerProps {
  onClose: () => void;
  userId: string;
}

/**
 * ⛽ SOVEREIGN STAKE HUB v2.0
 * Objective: 100% Bank-Free Revenue via Direct P2P Crypto Settlement.
 */
export default function TopUpDrawer({ onClose, userId }: TopUpDrawerProps) {
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // 🧬 CUSTOM STAKE LOGIC
  const [customAmount, setCustomAmount] = useState<string>('');
  const handleCustomStake = () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount < 1) return;
    setSelectedPkgId(`custom_${amount}`);
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-y-0 right-0 w-full md:w-[420px] bg-black/95 backdrop-blur-3xl border-l border-white/10 z-[300] flex flex-col items-center justify-center p-8 text-center font-outfit">
        <div className="w-20 h-20 rounded-full bg-[#00f0ff]/20 flex items-center justify-center mb-6 border border-[#00f0ff]/40 shadow-[0_0_50px_rgba(0,240,255,0.2)]">
          <Zap size={40} className="text-[#00f0ff] animate-pulse" />
        </div>
        <h3 className="text-2xl font-syncopate font-black uppercase italic text-white mb-2">Stake Confirmed</h3>
        <p className="text-xs text-white/40 uppercase tracking-[0.3em] font-black leading-relaxed">
          The Blockchain Node has verified your settlement. Credits + 15% Bonus injected into your identity node. 🧬🛡️
        </p>
        <button 
          onClick={onClose}
          className="mt-12 w-full h-14 rounded-2xl bg-white text-black text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
        >
          Return to Console
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[420px] bg-black/95 backdrop-blur-3xl border-l border-white/10 z-[300] shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col pointer-events-auto font-outfit">
      
      {/* Header */}
      <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-[#00f0ff] flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.3)]">
              <Zap size={24} className="text-black" />
           </div>
           <div>
              <h3 className="text-xl font-syncopate font-black uppercase italic text-white leading-none">
                 $GASPAI HUB
              </h3>
              <p className="text-[10px] text-[#00f0ff] uppercase font-black tracking-widest mt-2 underline decoration-[#00f0ff]/30 underline-offset-4">
                 Sovereign Stake Terminal
              </p>
           </div>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center">
          <X size={20} className="text-white/40" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        
        {selectedPkgId ? (
          <SovereignCheckout 
            userId={userId}
            packageId={selectedPkgId}
            onSuccess={() => setIsSuccess(true)}
            onCancel={() => setSelectedPkgId(null)}
          />
        ) : (
          <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* 🧬 MERCHANT STATUS */}
            <div className="p-5 rounded-2xl bg-[#00f0ff]/5 border border-[#00f0ff]/20 flex items-center justify-between">
               <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse" />
                     <span className="text-[8px] font-black uppercase tracking-widest text-[#00f0ff]">P2P Ledger Logic v2.0 Active</span>
                  </div>
                  <p className="text-[10px] text-white/40 font-bold italic mt-1">Bank-Free Sovereign Settlement Enabled.</p>
               </div>
               <ShieldCheck size={16} className="text-[#00f0ff]/30" />
            </div>

            {/* 🪙 CUSTOM WHALE STAKE */}
            <div className="space-y-4">
               <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#00f0ff] italic">Custom Whale Stake</h4>
               <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                     <span className="text-lg font-black text-[#00f0ff]">$</span>
                  </div>
                  <input 
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Enter USD Amount (e.g. 5000)"
                    className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-32 text-xl font-black text-white focus:outline-none focus:border-[#00f0ff]/40 transition-all"
                  />
                  <button 
                    onClick={handleCustomStake}
                    className="absolute inset-y-2 right-2 px-6 rounded-xl bg-[#00f0ff] text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,240,255,0.2)]"
                  >
                     Stake Now
                  </button>
               </div>
               <p className="text-[7px] text-white/20 uppercase tracking-[0.2em] font-black ml-1">
                  Custom amounts automatically qualify for the 1.15x Multiplier. 🛡️
               </p>
            </div>

            <div className="space-y-4">
               <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-white/40 italic">Select Your Tier</h4>
               <div className="grid gap-4">
                  {CREDIT_PACKAGES.map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedPkgId(pkg.id)}
                      className={`
                        relative group transition-all duration-300
                        p-6 rounded-2xl bg-white/5 border border-white/10 
                        flex items-center justify-between overflow-hidden
                        hover:bg-white/[0.08] hover:border-[#00f0ff]/40
                        ${pkg.isPopular ? 'border-[#00f0ff]/40 bg-[#00f0ff]/5 shadow-[0_0_20px_rgba(0,240,255,0.1)]' : ''}
                      `}
                    >
                      <div className="flex flex-col items-start gap-1 relative z-10 text-left">
                        {pkg.isPopular && (
                            <span className="text-[9px] font-black uppercase text-[#00f0ff] tracking-[0.2em] mb-3 flex items-center gap-2">
                                <Trophy size={10} fill="#00f0ff" />
                                Elite Genesis Tier
                            </span>
                        )}
                        <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">{pkg.label}</span>
                        <span className="text-3xl font-syncopate font-bold text-white mt-1 italic leading-none">
                            {Math.floor(pkg.credits * 1.15).toLocaleString()}
                            <span className="text-[10px] uppercase font-black text-white/20 tracking-widest not-italic ml-2">credits</span>
                        </span>
                        <div className="mt-4 px-2.5 py-1 rounded-md bg-[#00f0ff]/10 border border-[#00f0ff]/10">
                            <span className="text-[8px] font-black text-[#00f0ff] uppercase tracking-widest font-syncopate italic">
                               Exclusive 1.15x Stake Multiplier
                            </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3 z-10">
                        <span className="text-xl font-black text-white/20 group-hover:text-white transition-colors italic">
                            ${pkg.priceUsd}
                        </span>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#00f0ff] text-black shadow-lg group-hover:scale-110 active:scale-95 transition-all">
                            <Zap size={20} />
                        </div>
                      </div>
                    </button>
                  ))}
               </div>
            </div>

            {/* Compliance / Info Array */}
            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] space-y-4">
                <h5 className="text-[9px] font-black uppercase tracking-[0.25em] text-[#00f0ff] flex items-center gap-2">
                    <ShieldCheck size={12} /> SECURE PROTOCOL G-V1.8
                </h5>
                <p className="text-[8px] text-white/10 uppercase tracking-[0.3em] mt-2 block leading-loose border-t border-white/5 pt-4 font-black italic">
                    Decentralized P2P Settlement. Zero Chargebacks. 15% Bonus Credits Applied to every Sovereign Tier. 🪙
                </p>
                <p className="text-[7px] text-white/5 uppercase tracking-[0.3em] font-black italic text-center">
                    All reservations are final and settled on the blockchain. 🧬🛡️
                </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



