'use client';

import { X, Diamond, ShieldCheck, ArrowRight, Clock, CreditCard, Globe, Zap } from 'lucide-react';
import { CREDIT_PACKAGES } from '@/lib/economy/constants';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SovereignCheckout from './SovereignCheckout';

interface TopUpDrawerProps {
  onClose: () => void;
  userId: string;
}

/**
 * ⛽ TERMINAL TOP-UP v2.0
 * Objective: 100% Bank-Free Revenue via Direct P2P Crypto Settlement.
 */
export default function TopUpDrawer({ onClose, userId }: TopUpDrawerProps) {
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // 🧬 CUSTOM CREDIT LOGIC
  const [customAmount, setCustomAmount] = useState<string>('');
  const handleCustomAddCredits = () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount < 4.99) return;
    setSelectedPkgId(`custom_${amount}`);
  };

  // 🧬 RECOVERY PORTAL: Check for unsaved orders
  const [activeOrder, setActiveOrder] = useState<any>(null);
  useEffect(() => {
    const stored = localStorage.getItem('gasp_active_order');
    if (stored) {
        try { setActiveOrder(JSON.parse(stored)); } catch { }
    }
  }, []);

  const loadHistory = async () => {
    if (historyLoading) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/economy/history?userId=${userId}`);
      const data = await res.json();
      if (data.success) setHistory(data.transactions);
    } catch {}
    setHistoryLoading(false);
  };

  const toggleHistory = () => {
    if (!showHistory) loadHistory();
    setShowHistory(v => !v);
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 m-auto w-[95%] md:w-[420px] h-fit bg-black/95 backdrop-blur-3xl border border-white/10 z-[300] flex flex-col items-center justify-center p-10 text-center font-outfit rounded-[3rem] shadow-2xl">
        <div className="w-24 h-24 rounded-full bg-[#ff6b00]/20 flex items-center justify-center mb-8 border border-[#ff6b00]/40 shadow-[0_0_60px_rgba(16,185,129,0.3)]">
          <Diamond size={48} className="text-[#ff6b00] animate-pulse" />
        </div>
        <h3 className="text-3xl font-syncopate font-black uppercase italic text-white mb-4">Access Authorized</h3>
        <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-black leading-relaxed px-6">
          The Terminal has verified your digital settlement. System Credits + 15% Bonus successfully infused into your active identity node. 🧬🛡️
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
                  GASP // ARCHIVE
               </h3>
               <p className="text-[10px] text-[#ff6b00] uppercase font-black tracking-widest mt-2 underline decoration-[#ff6b00]/30 underline-offset-4">
                  GASP CREDITS
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
            onSuccess={() => { setIsSuccess(true); setActiveOrder(null); }}
            onCancel={() => setSelectedPkgId(null)}
          />
        ) : (
          <div className="p-5 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-500">
            {/* 🧬 RECOVERY PORTAL INDICATOR */}
            {activeOrder && activeOrder.packageId && (
               <button 
                 onClick={() => setSelectedPkgId(activeOrder.packageId)}
                 className="w-full p-6 rounded-[2rem] bg-[#ffea00]/10 border border-[#ffea00]/30 flex items-center justify-between group hover:bg-[#ffea00]/20 transition-all animate-pulse"
               >
                  <div className="flex flex-col items-start gap-1">
                     <span className="text-[10px] font-black uppercase text-[#ffea00] tracking-widest italic group-hover:scale-110 transition-transform">Pending Order Detected</span>
                     <span className="text-[8px] text-[#ffea00]/60 uppercase font-black tracking-widest">Resume your Credit Purchase Session</span>
                  </div>
                  <ArrowRight size={20} className="text-[#ffea00]" />
               </button>
            )}
            {/* 🧬 MERCHANT STATUS */}
            <div className="p-4 md:p-5 rounded-2xl bg-[#ff6b00]/5 border border-[#ff6b00]/20 flex items-center justify-between">
               <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                     <div className="w-1 h-1 rounded-full bg-[#ffea00] animate-pulse" />
                     <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-white/60">Digital Media Fulfillment v2.1 Active</span>
                  </div>
                  <p className="text-[9px] md:text-[10px] text-white/40 font-bold italic mt-1">Verified Digital Content Settlement Enabled.</p>
               </div>
               <ShieldCheck size={16} className="text-[#ffea00]/30" />
            </div>

            {/* 🧬 PREMIUM CARD ACCESS (MIN $19.97) */}
            <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6 shadow-2xl relative overflow-hidden group hover:bg-white/[0.07] transition-all">
                <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#ff6b00] italic">Premium Onramp Access</h4>
                    <span className="text-[7px] font-black uppercase text-white/20 tracking-widest italic">Min. $1.00</span>
                </div>
                
                <div className="flex flex-col gap-4">
                    <div className="flex gap-3">
                        <div className="flex-1 relative font-syncopate">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 font-black text-xl">$</div>
                            <input 
                              type="number"
                              value={customAmount}
                              onChange={(e) => setCustomAmount(e.target.value)}
                              placeholder="1.00"
                              className="w-full h-16 bg-black/40 border border-white/10 rounded-2xl px-12 text-xl font-black text-white outline-none focus:border-[#ff6b00]/50 transition-all placeholder:text-white/10"
                            />
                        </div>

                        <button 
                          onClick={handleCustomAddCredits}
                          disabled={!customAmount || parseFloat(customAmount) < 1.00}
                          className="h-16 px-8 rounded-2xl bg-[#ff6b00] disabled:bg-white/5 disabled:text-white/20 text-black font-black uppercase text-[10px] tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(255,107,0,0.2)]"
                        >
                            Onramp Access
                        </button>
                    </div>
                </div>
            </div>

            {/* 🧬 STRATEGIC P2P BRIDGE (NO MINIMUMS) */}
            <div className="p-8 bg-[#00f0ff]/5 border border-[#00f0ff]/20 rounded-[2.5rem] space-y-6 relative overflow-hidden group hover:bg-[#00f0ff]/10 transition-all cursor-pointer shadow-xl">
                 <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#00f0ff] italic">Strategic P2P Link</h4>
                    <div className="flex items-center gap-2">
                       <ShieldCheck size={10} className="text-[#00f0ff] animate-pulse" />
                       <span className="text-[7px] font-black uppercase text-white/20 tracking-widest italic tracking-[0.3em]">NO MINIMUMS // ZERO FEES</span>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#00f0ff]/20 flex items-center justify-center border border-[#00f0ff]/40 shadow-[0_0_50px_rgba(0,240,255,0.3)]">
                        <Zap size={28} className="text-[#00f0ff] animate-pulse" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <p className="text-[10px] text-white/80 font-black uppercase tracking-widest leading-relaxed">Direct SOL / USDC Bridge</p>
                        <p className="text-[8px] text-white/40 font-bold italic">Perfect for small amounts ($1+). Node-to-node fulfillment.</p>
                    </div>
                </div>
                <div className="flex flex-col gap-3">
                   <button 
                     onClick={() => {
                       const amt = parseFloat(customAmount);
                       const baseUrl = 'https://hel.io/pay/69cd2e9c8a77d8d75027d9ce';
                       const url = amt > 0 ? `${baseUrl}?amount=${amt.toFixed(2)}` : baseUrl;
                       window.open(url, '_blank');
                     }}
                     className="w-full h-14 rounded-2xl bg-[#00f0ff] text-black font-black uppercase text-[10px] tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-[0_10px_40px_rgba(0,240,255,0.3)]"
                   >
                       Open P2P Bridge
                   </button>
                   <p className="text-[7px] text-white/20 text-center font-black uppercase tracking-widest italic">Credits granted automatically on confirmation</p>
                </div>
            </div>

            {/* 🧬 SIMPLIFIED TIER SELECTION */}
            <div className="space-y-4 pt-4">
               <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-white/40 italic">Or Select Asset Tier</h4>
               <div className="grid gap-3">
                  {CREDIT_PACKAGES.filter(p => ['tier_starter', 'tier_entry', 'tier_whale', 'tier_master'].includes(p.id)).map((pkg) => (
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
                        {pkg.id === 'tier_master' && (
                            <span className="text-[9px] font-black uppercase text-[#ff6b00] tracking-[0.2em] mb-3 flex items-center gap-2">
                                <Diamond size={10} fill="#ff6b00" />
                                Syndicate Elite
                            </span>
                        )}
                        <span className="text-[10px] font-black uppercase text-white/40 tracking-widest leading-none">
                            {pkg.id === 'tier_starter' ? 'Starter Access' : pkg.id === 'tier_entry' ? 'Member Access' : pkg.id === 'tier_whale' ? 'Elite Access' : 'Archive Master'}
                        </span>
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

            {/* 🧬 PAYMENT HISTORY */}
            <div className="mt-4 border-t border-white/5 pt-6">
              <button
                onClick={toggleHistory}
                className="w-full flex items-center justify-between group"
              >
                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
                  <Clock size={12} /> Payment History
                </span>
                <ArrowRight size={14} className={`text-white/20 transition-transform duration-300 ${showHistory ? 'rotate-90' : ''}`} />
              </button>

              {showHistory && (
                <div className="mt-4 space-y-2">
                  {historyLoading ? (
                    <p className="text-[9px] text-white/20 uppercase font-black tracking-widest text-center py-4 animate-pulse">Loading transactions...</p>
                  ) : history.length === 0 ? (
                    <p className="text-[9px] text-white/20 uppercase font-black tracking-widest text-center py-4">No transactions yet.</p>
                  ) : history.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="flex items-center gap-3">
                        {tx.provider === 'stripe_onramp' 
                          ? <CreditCard size={14} className="text-white/30" />
                          : <Globe size={14} className="text-[#00f0ff]/50" />}
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">
                            +{tx.amount.toLocaleString()} credits
                          </span>
                          <span className="text-[7px] text-white/20 font-black uppercase tracking-widest">
                            ${tx.meta?.actualAmountUsd?.toFixed(2) || '—'} · {tx.provider === 'stripe_onramp' ? 'Card' : 'Crypto'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[7px] text-white/20 font-black">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Compliance */}
            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] space-y-4">
                <h5 className="text-[9px] font-black uppercase tracking-[0.25em] text-[#ff6b00] flex items-center gap-2">
                    <ShieldCheck size={12} /> SECURE FULFILLMENT G-V1.9
                </h5>
                <p className="text-[8px] text-white/10 uppercase tracking-[0.3em] mt-2 block leading-loose border-t border-white/5 pt-4 font-black italic">
                    Digital Media Credits Issued by AllTheseFlows Strategic Media LLC. Instant Fulfillment. 💎
                </p>
                <p className="text-[7px] text-white/20 uppercase tracking-[0.2em] font-black text-center italic">
                   Fulfilled by AllTheseFlows LLC. Card / Crypto Settlement managed by Stripe & Helio. 🛡️
                </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



