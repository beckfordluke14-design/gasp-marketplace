'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Zap, Copy, Loader2, ArrowRight, Wallet as WalletIcon, Diamond, CreditCard, Apple, CheckCircle2 } from 'lucide-react';
import { CREDIT_PACKAGES, type CreditPackage } from '@/lib/economy/constants';
import { useWallet } from '../providers/WalletProvider';
import { ethers } from 'ethers';
import * as solanaWeb3 from '@solana/web3.js';
import { motion, AnimatePresence } from 'framer-motion';

interface SovereignCheckoutProps {
  userId: string;
  packageId: string;
  onSuccess: (credits: number) => void;
  onCancel: () => void;
}

export default function SovereignCheckout({ userId, packageId, onSuccess, onCancel }: SovereignCheckoutProps) {
  const [method, setMethod] = useState<'stripe' | 'crypto' | null>(null);
  const [network, setNetwork] = useState<'solana' | 'base'>('solana');
  const [isVerifying, setIsVerifying] = useState(false);
  const [status, setStatus] = useState<'waiting' | 'scanning' | 'confirmed'>('waiting');
  const { isConnected, address, network: walletNetwork } = useWallet();

  const MERCHANT_WALLETS = {
    solana: 'DGQVNRTWEv1HEwP6Wtcm1LEUPgZKsW9JfwVpEDjPcEkS',
    base:   '0xe45e8529487139D9373423282B3485Beb7F0a6C7'
  };

  const isCustom = packageId.startsWith('custom_');
  const customVal = isCustom ? parseFloat(packageId.split('_')[1]) : 0;
  const pkg = isCustom 
    ? { id: packageId, priceUsd: customVal, credits: customVal * 15, label: 'Custom Hub Infusion' }
    : (CREDIT_PACKAGES.find(p => p.id === packageId) || CREDIT_PACKAGES[0]);

  const cryptoBonus = method === 'crypto' ? Math.floor(pkg.credits * 0.15) : 0;
  const totalCredits = pkg.credits + cryptoBonus;

  const handleStripeCheckout = async () => {
    setIsVerifying(true);
    // 🛡️ STRIPE REDIRECT: Digital Media Hub Logic
    try {
        const res = await fetch('/api/economy/stripe/create-session', {
            method: 'POST',
            body: JSON.stringify({ packageId, userId })
        });
        const data = await res.json();
        if (data.url) window.location.href = data.url;
    } catch (e) {
        alert('Stripe Node Connection Refused. Try Crypto Gate.');
    } finally {
        setIsVerifying(false);
    }
  };

  if (!method) {
    return (
      <div className="p-8 md:p-12 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-5xl font-syncopate font-black uppercase italic text-white tracking-tighter">Settlement Gate</h2>
            <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-black">Select Your Access Protocol</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 🛡️ STRIPE GATE: Digital Media Hub */}
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMethod('stripe')}
              className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 flex flex-col items-center gap-6 hover:bg-white/[0.08] hover:border-[#00f0ff]/40 transition-all text-center group"
            >
                <div className="w-16 h-16 rounded-2xl bg-[#00f0ff]/10 flex items-center justify-center text-[#00f0ff] group-hover:scale-110 transition-transform">
                    <CreditCard size={32} />
                </div>
                <div>
                   <h4 className="text-xl font-bold text-white uppercase italic">Digital Hub Access</h4>
                   <p className="text-[9px] text-white/40 uppercase font-black tracking-widest mt-2 px-4 leading-relaxed">Cards / Apple Pay / Google Pay. Fulfilled by AllTheseFlows LLC.</p>
                </div>
                <div className="flex items-center gap-2 pt-2 grayscale opacity-30">
                    <Apple size={14} className="text-white" />
                    <span className="text-[8px] font-black font-sans uppercase">G-Pay</span>
                </div>
            </motion.button>

            {/* 🧬 CRYPTO GATE: Sovereign Protocol */}
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMethod('crypto')}
              className="p-8 rounded-[2.5rem] bg-[#ff6b00]/5 border border-[#ff6b00]/10 flex flex-col items-center gap-6 hover:bg-[#ff6b00]/10 hover:border-[#ff6b00]/40 transition-all text-center group"
            >
                <div className="w-16 h-16 rounded-2xl bg-[#ff6b00]/10 flex items-center justify-center text-[#ff6b00] group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(255,107,0,0.2)]">
                    <Zap size={32} />
                </div>
                <div>
                   <h4 className="text-xl font-bold text-white uppercase italic">Sovereign Protocol</h4>
                   <p className="text-[9px] text-[#ff6b00]/60 uppercase font-black tracking-widest mt-2 px-4 leading-relaxed">+15% Bonus Credits Applied. SOL / USDC / BASE Settlement.</p>
                </div>
                <div className="h-6 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#ff6b00] animate-pulse" />
                    <span className="text-[8px] font-black text-[#ff6b00] uppercase tracking-widest">P2P Node Active</span>
                </div>
            </motion.button>
        </div>

        <button onClick={onCancel} className="w-full text-[9px] font-black uppercase tracking-[0.3em] text-white/10 hover:text-white transition-colors">Cancel Access Request</button>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-12 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
       <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setMethod(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><ArrowRight size={20} className="rotate-180 text-white/40" /></button>
          <div className="flex flex-col">
             <span className="text-[8px] font-black uppercase text-[#ff6b00] tracking-widest">{method === 'stripe' ? 'Digital Fulfillment' : 'Sovereign Bridge'} Active</span>
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
                 <span className="text-4xl font-syncopate font-black text-[#ff6b00] italic leading-none">${pkg.priceUsd}</span>
              </div>

              {method === 'stripe' ? (
                <div className="space-y-6 pt-4 border-t border-white/5">
                   <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><ShieldCheck size={16} /></div>
                         <span className="text-[9px] font-black uppercase text-white/60">One-Click Apple Pay / Card</span>
                      </div>
                      <CheckCircle2 size={16} className="text-green-500/40" />
                   </div>
                   <button 
                     onClick={handleStripeCheckout}
                     disabled={isVerifying}
                     className="w-full h-16 rounded-2xl bg-white text-black text-[11px] font-black uppercase tracking-[0.25em] flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-95 transition-all"
                   >
                     {isVerifying ? <Loader2 size={24} className="animate-spin" /> : <Zap size={20} fill="black" />}
                     {isVerifying ? 'Initializing Hub...' : 'Finalize Hub Infusion'}
                   </button>
                   <p className="text-[7px] text-white/20 uppercase tracking-[0.2em] font-black text-center italic">
                      Fulfilled by AllTheseFlows Strategic Media LLC. Secure SSL Digital Settlement.
                   </p>
                </div>
              ) : (
                <div className="space-y-6 pt-4 border-t border-white/5">
                    <div className="flex flex-col gap-3">
                        <div className="bg-black/20 p-1 rounded-xl flex items-center gap-1 border border-white/5">
                            <button onClick={() => setNetwork('solana')} className={`flex-1 h-8 rounded-lg text-[8px] font-black uppercase transition-all ${network === 'solana' ? 'bg-[#9945FF] text-white' : 'text-white/30'}`}>Solana</button>
                            <button onClick={() => setNetwork('base')} className={`flex-1 h-8 rounded-lg text-[8px] font-black uppercase transition-all ${network === 'base' ? 'bg-[#0052FF] text-white' : 'text-white/30'}`}>Base L2</button>
                        </div>
                        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between group cursor-pointer hover:border-[#ff6b00]/40 transition-all font-mono">
                           <code className="text-[8px] text-white/40 truncate group-hover:text-white">{MERCHANT_WALLETS[network]}</code>
                           <Copy size={12} className="text-white/20 shrink-0 ml-2" />
                        </div>
                        <button className="w-full h-16 rounded-2xl bg-[#ff6b00] text-black text-[11px] font-black uppercase tracking-[0.25em] flex items-center justify-center gap-3">
                            <WalletIcon size={20} /> Sovereign Stake
                        </button>
                    </div>
                </div>
              )}
          </div>

          {/* RIGHT: SECURITY/SOCIAL PROOF */}
          <div className="hidden lg:flex flex-col gap-6">
              <div className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.01] space-y-4">
                  <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ff6b00] flex items-center gap-2">
                      <ShieldCheck size={14} /> Syndicate Priority Tier
                  </h5>
                  <p className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-black italic leading-loose">
                      Your infusion level authorizes immediate access to Level 5 Prime Archives and High-Heat Persona Vaults.
                  </p>
              </div>
              {method === 'crypto' && (
                <div className="p-6 rounded-[2rem] border border-[#ff6b00]/20 bg-[#ff6b00]/5 flex items-center justify-center gap-4 animate-pulse">
                    <Diamond size={24} className="text-[#ff6b00]" />
                    <span className="text-[9px] font-black uppercase text-[#ff6b00] tracking-widest leading-tight">+15% Sovereign Multiplier Applied</span>
                </div>
              )}
          </div>
       </div>

       <button onClick={() => setMethod(null)} className="w-full text-[9px] font-black uppercase tracking-widest text-white/10 hover:text-white transition-colors pt-4">Return to Selection Gate</button>
    </div>
  );
}
