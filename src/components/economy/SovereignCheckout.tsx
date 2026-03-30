'use client';

import { useState } from 'react';
import { ShieldCheck, Zap, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { CREDIT_PACKAGES } from '@/lib/economy/constants';
import { motion } from 'framer-motion';

interface SovereignCheckoutProps {
  userId: string;
  packageId: string;
  onSuccess: (credits: number) => void;
  onCancel: () => void;
}

export default function SovereignCheckout({ userId, packageId, onSuccess, onCancel }: SovereignCheckoutProps) {
  const [isVerifying, setIsVerifying] = useState(false);

  const isCustom = packageId.startsWith('custom_');
  const customVal = isCustom ? parseFloat(packageId.split('_')[1]) : 0;
  const pkg = isCustom 
    ? { id: packageId, priceUsd: customVal, credits: customVal * 15, label: 'Custom Terminal Infusion', helioPayLink: '' }
    : (CREDIT_PACKAGES.find(p => p.id === packageId) || CREDIT_PACKAGES[0]);

  const totalCredits = pkg.credits;

  // 🛡️ INSTITUTIONAL SETTLEMENT: Unified Gate Protocol
  const handleSovereignCheckout = async () => {
    setIsVerifying(true);
    if (pkg.helioPayLink) {
        window.location.href = pkg.helioPayLink;
    } else {
        alert('Sovereign Bridge Synchronizing. Attempt Standard Tier Infusion.');
        setIsVerifying(false);
    }
  };

  return (
    <div className="p-8 md:p-12 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
       <div className="flex items-center gap-4 mb-8">
          <button onClick={onCancel} className="p-2 hover:bg-white/5 rounded-full transition-colors"><ArrowRight size={20} className="rotate-180 text-white/40" /></button>
          <div className="flex flex-col">
             <span className="text-[8px] font-black uppercase text-[#00f0ff] tracking-widest">Institutional Gate Active</span>
             <h3 className="text-2xl font-syncopate font-black uppercase text-white italic">Confirm Settlement</h3>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* LEFT: SETTLEMENT INFO */}
          <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 flex flex-col gap-6 shadow-2xl">
              <div className="space-y-2 border-b border-white/5 pb-6">
                 <span className="text-[10px] uppercase font-black text-white/40 tracking-widest italic">{pkg.label}</span>
                 <div className="flex items-baseline gap-3">
                    <span className="text-4xl md:text-5xl font-syncopate font-black text-white italic tracking-tighter">
                       {totalCredits.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Credits</span>
                 </div>
              </div>

              <div className="flex items-center justify-between">
                 <span className="text-[10px] font-black text-white/40 uppercase tracking-widest italic leading-none">Total Settlement</span>
                 <span className="text-4xl font-syncopate font-black text-[#00f0ff] italic leading-none">${pkg.priceUsd}</span>
              </div>

              {/* 🛡️ UNIFIED SETTLEMENT: Digital Fulfillment Bridge */}
              <div className="space-y-6 pt-4 border-t border-white/5">
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#00f0ff]/10 rounded-lg text-[#00f0ff]"><ShieldCheck size={16} /></div>
                        <span className="text-[9px] font-black uppercase text-white/60">Sovereign Encryption Node Active</span>
                     </div>
                     <CheckCircle2 size={16} className="text-green-500/40" />
                  </div>
                  <button 
                    onClick={handleSovereignCheckout}
                    disabled={isVerifying}
                    className="w-full h-16 rounded-2xl bg-white text-black text-[11px] font-black uppercase tracking-[0.25em] flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    {isVerifying ? <Loader2 size={24} className="animate-spin" /> : <Zap size={20} fill="black" />}
                    {isVerifying ? 'Routing...' : 'Finalize Terminal Infusion'}
                  </button>
                  <p className="text-[7px] text-white/20 uppercase tracking-[0.2em] font-black text-center italic">
                     Fulfilled by AllTheseFlows LLC. Card / Crypto / Apple Pay Settlement Managed by MoonPay Gate.
                  </p>
              </div>
          </div>

          {/* RIGHT: SECURITY/SOCIAL PROOF */}
          <div className="hidden lg:flex flex-col gap-6">
              <div className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.01] space-y-4">
                  <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00f0ff] flex items-center gap-2">
                      <ShieldCheck size={14} /> Operational Priority Tier 5
                  </h5>
                  <p className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-black italic leading-loose">
                      Institutional-grade digital media fulfillment. Your infusion level authorizes immediate access to Level 5 Strategic Archives and High-Heat Persona Vaults.
                  </p>
              </div>
              <div className="p-6 rounded-[2rem] border border-[#00f0ff]/20 bg-[#00f0ff]/5 flex items-center justify-center gap-4">
                  <span className="text-[9px] font-black uppercase text-[#00f0ff] tracking-widest leading-tight">Secure Sovereign Bridge Protocol Active</span>
              </div>
          </div>
       </div>

       <button onClick={onCancel} className="w-full text-[9px] font-black uppercase tracking-widest text-white/10 hover:text-white transition-colors pt-4">Return to Selection Gate</button>
    </div>
  );
}
