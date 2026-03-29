'use client';

import { X, Diamond, Trophy, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { CREDIT_PACKAGES } from '@/lib/economy/constants';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SovereignCheckout from './SovereignCheckout';

interface TopUpDrawerProps {
  onClose: () => void;
  userId: string;
}

/**
 * ⛽ CREDIT TOP-UP HUB v2.0
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

  // 🧬 RECOVERY HUB: Check for unsaved stakes
  const [activeStake, setActiveStake] = useState<any>(null);
  useEffect(() => {
    const stored = localStorage.getItem('gasp_active_stake');
    if (stored) {
        try { setActiveStake(JSON.parse(stored)); } catch { }
    }
  }, []);

  if (isSuccess) {
    return (
      <div className="fixed inset-0 m-auto w-[95%] md:w-[420px] h-fit bg-black/95 backdrop-blur-3xl border border-white/10 z-[300] flex flex-col items-center justify-center p-10 text-center font-outfit rounded-[3rem] shadow-2xl">
        <div className="w-24 h-24 rounded-full bg-[#ff6b00]/20 flex items-center justify-center mb-8 border border-[#ff6b00]/40 shadow-[0_0_60px_rgba(16,185,129,0.3)]">
          <Diamond size={48} className="text-[#ff6b00] animate-pulse" />
        </div>
        <h3 className="text-3xl font-syncopate font-black uppercase italic text-white mb-4">Transfer Confirmed</h3>
        <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-black leading-relaxed px-6">
          The Blockchain Node has verified your settlement. Credits + 15% Bonus injected into your identity node. 🧬🛡️
        </p>
        <button 
          onClick={onClose}
          className="mt-16 w-full h-16 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
        >
          Return to Console
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-2 inset-y-10 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-[calc(100%-1rem)] md:w-[480px] h-[calc(100%-5rem)] md:h-[90dvh] bg-[#050505]/95 backdrop-blur-3xl border border-white/10 z-[300] shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col pointer-events-auto font-outfit transition-all duration-500 rounded-[2.5rem] overflow-hidden">
      
      {/* Header */}
      <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-[#ff6b00] flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <Diamond size={24} className="text-black" />
           </div>
           <div>
              <h3 className="text-xl font-syncopate font-black uppercase italic text-white leading-none">
                 CREDIT TERMINAL
              </h3>
              <p className="text-[10px] text-[#ff6b00] uppercase font-black tracking-widest mt-2 underline decoration-[#ff6b00]/30 underline-offset-4">
                 Credit Top-Up Terminal
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
            onSuccess={() => { setIsSuccess(true); setActiveStake(null); }}
            onCancel={() => setSelectedPkgId(null)}
          />
        ) : (
          <div className="p-5 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-500">
            {/* 🧬 RECOVERY HUB INDICATOR */}
            {activeStake && activeStake.packageId && (
               <button 
                 onClick={() => setSelectedPkgId(activeStake.packageId)}
                 className="w-full p-6 rounded-[2rem] bg-[#ffea00]/10 border border-[#ffea00]/30 flex items-center justify-between group hover:bg-[#ffea00]/20 transition-all animate-pulse"
               >
                  <div className="flex flex-col items-start gap-1">
                     <span className="text-[10px] font-black uppercase text-[#ffea00] tracking-widest italic group-hover:scale-110 transition-transform">Pending Stake Detected</span>
                     <span className="text-[8px] text-[#ffea00]/60 uppercase font-black tracking-widest">Resume your Sovereign Bridge Session</span>
                  </div>
                  <ArrowRight size={20} className="text-[#ffea00]" />
               </button>
            )}
            {/* 🧬 MERCHANT STATUS */}
            <div className="p-4 md:p-5 rounded-2xl bg-[#ff6b00]/5 border border-[#ff6b00]/20 flex items-center justify-between">
               <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                     <div className="w-1 h-1 rounded-full bg-[#ff6b00] animate-pulse" />
                     <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-[#ff6b00]">P2P Credit Logic v2.0 Active</span>
                  </div>
                  <p className="text-[9px] md:text-[10px] text-white/40 font-bold italic mt-1">Bank-Free Sovereign Settlement Enabled.</p>
               </div>
               <ShieldCheck size={16} className="text-[#ff6b00]/30" />
            </div>

            {/* 🪙 CUSTOM WHALE TOP-UP */}
            <div className="space-y-4">
               <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] text-[#ff6b00] italic">Custom Whale Top-Up</h4>
               <div className="flex flex-col gap-3 group">
                  <div className="relative flex-1">
                     <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                        <span className="text-lg font-black text-[#ff6b00]">💎</span>
                     </div>
                     <input 
                       type="number"
                       value={customAmount}
                       onChange={(e) => setCustomAmount(e.target.value)}
                       placeholder="Enter USD Amount (e.g. 5000)"
                       className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 text-xl font-black text-white focus:outline-none focus:border-[#ff6b00]/40 transition-all placeholder:text-white/10"
                     />
                  </div>
                  <button 
                    onClick={handleCustomStake}
                    className="w-full h-14 rounded-2xl bg-[#ff6b00] text-black text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                  >
                     Add Credits
                  </button>
               </div>
               <p className="text-[7px] text-white/20 uppercase tracking-[0.2em] font-black ml-1">
                  Custom amounts qualify for the 1.15x Multiplier. 🛡️
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
                        hover:bg-white/[0.08] hover:border-[#ff6b00]/40
                        ${pkg.isPopular ? 'border-[#ff6b00]/40 bg-[#ff6b00]/5 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : ''}
                      `}
                    >
                      <div className="flex flex-col items-start gap-1 relative z-10 text-left">
                        {pkg.isPopular && (
                            <span className="text-[9px] font-black uppercase text-[#ff6b00] tracking-[0.2em] mb-3 flex items-center gap-2">
                                <Diamond size={10} fill="#ff6b00" />
                                Sovereign Genesis Tier
                            </span>
                        )}
                        <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">{pkg.label}</span>
                        <span className="text-3xl font-syncopate font-bold text-white mt-1 italic leading-none">
                            {Math.floor(pkg.credits * 1.15).toLocaleString()}
                            <span className="text-[10px] uppercase font-black text-white/20 tracking-widest not-italic ml-2">credits</span>
                        </span>
                      </div>

                      <div className="flex flex-col items-end gap-3 z-10">
                        <span className="text-xl font-black text-white/20 group-hover:text-white transition-colors italic">
                            ${pkg.priceUsd}
                        </span>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#ff6b00] text-black shadow-lg group-hover:scale-110 active:scale-95 transition-all">
                            <Diamond size={20} className="font-black" />
                        </div>
                      </div>
                    </button>
                  ))}
               </div>
            </div>

            {/* Compliance / Info Array */}
            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] space-y-4">
                <h5 className="text-[9px] font-black uppercase tracking-[0.25em] text-[#ff6b00] flex items-center gap-2">
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



