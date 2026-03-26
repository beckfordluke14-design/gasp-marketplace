'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Trophy, Coins, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function WhitepaperPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-white font-outfit selection:bg-[#00f0ff] selection:text-black">
      
      {/* 🧬 HEADER PROTOCOL */}
      <header className="fixed top-0 left-0 right-0 h-20 border-b border-white/5 bg-black/50 backdrop-blur-3xl z-50 px-8 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#ffea00] flex items-center justify-center">
               <Zap size={18} className="text-black" />
            </div>
            <span className="text-lg font-syncopate font-black uppercase italic tracking-tighter">$GASPAI RESERVE</span>
         </div>
         <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">
            Return to Node →
         </Link>
      </header>

      <main className="pt-40 pb-40 px-8 max-w-4xl mx-auto space-y-24">
         
         {/* 1. THE GENESIS VISION */}
         <section className="space-y-8">
            <div className="flex items-center gap-4">
               <div className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse" />
               <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#00f0ff]">Genesis Protocol v1.7</h4>
            </div>
            <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.85] font-syncopate">
               Consumption is <br /> <span className="text-[#ffea00]">Accumulation</span>.
            </h1>
            <p className="text-xl md:text-2xl text-white/60 leading-relaxed font-bold italic">
               Gasp.fun is the world’s first Neural-Creator Protocol where every interaction is a stake. We believe that entertainment value should be durable. 🛡️
            </p>
         </section>

         {/* 2. THE 1:1 STAKE MODEL */}
         <div className="grid md:grid-cols-2 gap-12">
            <div className="p-10 rounded-[2.5rem] bg-white/5 border border-white/10 space-y-6 group hover:border-[#ffea00]/30 transition-all">
               <div className="w-12 h-12 rounded-2xl bg-[#ffea00] flex items-center justify-center">
                  <Coins size={24} className="text-black" />
               </div>
               <h3 className="text-2xl font-black uppercase italic">1:1 Token Reservation</h3>
               <p className="text-white/40 text-[14px] leading-secondary font-bold">
                  Every dollar spent on Gasp.fun creators is logged to the Genesis Ledger. At the Token Generation Event (TGE), users receive an airdrop of $GASPAI tokens equivalent to their lifetime spend.
               </p>
            </div>
            <div className="p-10 rounded-[2.5rem] bg-white/5 border border-white/10 space-y-6 group hover:border-[#00f0ff]/30 transition-all">
               <div className="w-12 h-12 rounded-2xl bg-[#00f0ff] flex items-center justify-center">
                  <Trophy size={24} className="text-black" />
               </div>
               <h3 className="text-2xl font-black uppercase italic">Whale Tier Priority</h3>
               <p className="text-white/40 text-[14px] leading-secondary font-bold">
                  Accumulated 'Aura' (Syndicate Credits) determines your Airdrop Multiplier. Diamond whales receive a 10x multiplier on their reservation, securing the highest yield in the $GASPAI ecosystem.
               </p>
            </div>
         </div>

         {/* 3. ROADMAP NODES */}
         <section className="space-y-12">
            <h2 className="text-3xl font-syncopate font-black uppercase italic">Venture Roadmap</h2>
            <div className="space-y-1">
               {[
                 { node: 'Node 01: The Soft Launch', status: 'ACTIVE', desc: 'Gasp Reserve Protocol v1.7 Activated. Internal Genesis Ledger is recording all user spending 1:1. No wallet connection required to accumulate stakeholder status.' },
                 { node: 'Node 02: Neural Expansion (April)', status: 'PENDING', desc: 'AI Persona "Deep Sync" engine launch. Multi-influencer onboarding surge.' },
                 { node: 'Node 03: The Institutional TGE (June 1st)', status: 'UPCOMING', desc: 'Final audit of the Genesis Ledger. Public Token Generation Event for $GASPAI with Institutional Liquidity Influx from $USD revenue pool to ensure ecosystem stability.' },
                 { node: 'Node 04: The Utility Nexus (August)', status: 'UPCOMING', desc: 'Neural Staking enabled. Users must stake $GASPAI to unlock Tier-1 "Deep Sync" creators. Deflationary Burn Protocol Activated: 2% of all protocol fees permanently removed from circulation.' },
               ].map((step, i) => (
                  <div key={i} className="flex items-start gap-8 p-10 border-b border-white/5 hover:bg-white/[0.02] transition-all group">
                     <span className="text-[#ffea00] font-syncopate font-black text-2xl italic opacity-50 group-hover:opacity-100 italic">0{i+1}</span>
                     <div className="flex-1 space-y-2 pt-1">
                        <div className="flex items-center gap-4">
                           <h4 className="text-lg font-black uppercase italic tracking-tighter">{step.node}</h4>
                           <span className={`text-[8px] font-black px-2 py-0.5 rounded border ${step.status === 'ACTIVE' ? 'border-green-500/40 text-green-500 bg-green-500/5' : 'border-white/10 text-white/20'}`}>
                              {step.status}
                           </span>
                        </div>
                        <p className="text-white/40 text-[13px] font-bold leading-relaxed">{step.desc}</p>
                     </div>
                  </div>
               ))}
            </div>
            
            {/* 🧬 THE LIQUIDITY SHIELD */}
            <div className="mt-8 p-6 rounded-3xl bg-[#00f0ff]/5 border border-[#00f0ff]/20 flex items-center justify-between group overflow-hidden relative">
               <div className="flex flex-col gap-1 relative z-10 text-left">
                  <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#00f0ff]">Founders Treasury Node</span>
                  <p className="text-[10px] text-white/40 font-bold italic leading-relaxed">
                     Total Revenue Settled in <span className="text-white underline decoration-[#00f0ff]/30">USDC Stablecoin</span>. Immediate Liquidity Protocol Enabled for Institutional Swaps (BTC/ETH/USD). 🛡️
                  </p>
               </div>
               <ShieldCheck size={32} className="text-[#00f0ff]/20 group-hover:text-[#00f0ff]/40 transition-all group-hover:scale-110" />
            </div>
         </section>

         {/* 4. THE FOUNDER'S SEAL */}
         <footer className="pt-20 border-t border-white/10 text-center space-y-8">
            <div className="flex flex-col gap-2">
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 italic font-syncopate">Gasp Guardian Protocol v1.7</p>
               <span className="text-[8px] text-[#00f0ff] font-black uppercase tracking-[0.2em]">Sovereign Custody Active • Direct Vault Settlement</span>
            </div>
            <div className="flex items-center justify-center gap-8 py-4">
               <ShieldCheck size={24} className="text-[#ffea00]" />
               <Zap size={24} className="text-[#00f0ff]" />
               <Trophy size={24} className="text-[#ff00ff]" />
            </div>
            <p className="text-[11px] text-white/40 font-black italic max-w-lg mx-auto leading-relaxed">
               Gasp.fun is a premium entertainment protocol. $GASPAI tokens possess zero cash value until the Token Generation Event. Sovereign treasury managed via ATF Founder Vault. 🧬🛡️
            </p>
         </footer>

      </main>

      {/* Background Neural Textures */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
         <div className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] bg-[#ffea00] rounded-full blur-[200px] opacity-10 animate-pulse" />
         <div className="absolute bottom-1/4 -left-1/4 w-[800px] h-[800px] bg-[#00f0ff] rounded-full blur-[200px] opacity-10 animate-pulse" />
      </div>

    </div>
  );
}



