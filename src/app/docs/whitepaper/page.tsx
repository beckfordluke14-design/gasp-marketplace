'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Trophy, Coins, ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';

/**
 * 🍱 GASP TOKEN ACCESS (THE PROTOCOL)
 * Simple, high-status overview of the upcoming $GASP coin.
 */
export default function WhitepaperPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-white font-outfit selection:bg-[#ff00ff] selection:text-white">
      
      {/* 🧬 HEADER */}
      <header className="fixed top-0 left-0 right-0 h-20 border-b border-white/5 bg-black/50 backdrop-blur-3xl z-50 px-8 flex items-center justify-between font-syncopate">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#ffea00] flex items-center justify-center">
               <Zap size={18} className="text-black" />
            </div>
            <span className="text-lg font-black uppercase italic tracking-tighter">GASP REWARDS</span>
         </div>
         <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">
            Return to Feed →
         </Link>
      </header>

      <main className="pt-40 pb-40 px-8 max-w-4xl mx-auto space-y-24">
         
         {/* 1. THE VISION */}
         <section className="space-y-8">
            <div className="flex items-center gap-4">
               <div className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse" />
               <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#00f0ff] italic">Rewards Protocol v1.0</h4>
            </div>
            <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.85] font-syncopate">
               Support is <br /> <span className="text-[#ffea00]">Rewarded</span>.
            </h1>
            <p className="text-xl md:text-2xl text-white/60 leading-relaxed font-bold italic">
               Gasp is the first media network where you get rewarded for being a member. Every credit spent is a vote for the future of the platform. 🛡️
            </p>
         </section>

         {/* 2. THE REWARDS MODEL */}
         <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 space-y-6 group hover:border-[#ffea00]/30 transition-all">
               <div className="w-12 h-12 rounded-2xl bg-[#ffea00] flex items-center justify-center">
                  <Coins size={24} className="text-black" />
               </div>
               <h3 className="text-xl font-black uppercase italic italic font-syncopate">1:1 Liquidity Match</h3>
               <p className="text-white/40 text-[13px] leading-secondary font-bold">
                  Every credit you purchase injecting liquidity into the protocol is tracked automatically. When we launch our coin ($GASPai), members will receive tokens based on their total deposits.
               </p>
            </div>
            
            <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 space-y-6 group hover:border-[#ff00ff]/30 transition-all">
               <div className="w-12 h-12 rounded-2xl bg-[#ff00ff] flex items-center justify-center">
                  <Zap size={24} className="text-white" />
               </div>
               <h3 className="text-xl font-black uppercase italic italic font-syncopate">Sovereign Comp</h3>
               <p className="text-white/40 text-[13px] leading-secondary font-bold">
                  <strong>Proof of Liquidity:</strong> The protocol algorithmically routes up to 8% of top-tier member LTV natively through the Bitrefill API. This gives the AI autonomy to deploy real-world assets (Uber/Starbucks rewards) strictly to high-volume depositors.
               </p>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 space-y-6 group hover:border-[#00f0ff]/30 transition-all">
               <div className="w-12 h-12 rounded-2xl bg-[#00f0ff] flex items-center justify-center">
                  <Star size={24} className="text-black" />
               </div>
               <h3 className="text-xl font-black uppercase italic italic font-syncopate">Member Status</h3>
               <p className="text-white/40 text-[13px] leading-secondary font-bold">
                  The more support you give, the higher your status. Top-tier members who hold their points for <strong>6 months</strong> (The Genesis Lock) unlock elite voting power. Over 80% protocol revenue retention.
               </p>
            </div>
         </div>

         {/* 3. THE ROADMAP */}
         <section className="space-y-12">
            <h2 className="text-3xl font-syncopate font-black uppercase italic">The Roadmap</h2>
            <div className="space-y-1">
               {[
                 { node: 'Phase 01: Launch', status: 'ACTIVE', desc: 'The Gasp Reward Tracker is officially online. All credit spending is being logged 1:1 for future rewards. No complicated wallet setup required yet.' },
                 { node: 'Phase 02: Expansion (April)', status: 'PENDING', desc: 'A massive wave of new creators joining the platform. Enhanced direct messaging and high-heat archive drops.' },
                 { node: 'Phase 03: The Coin Launch (July 1st)', status: 'UPCOMING', desc: 'Official launch of $GASPai on Base L2. Distribution will be sent directly to your Member Wallet (Privy Unified).' },
                 { node: 'Phase 04: Exclusive Access', status: 'UPCOMING', desc: 'Full token utility unlocked. Use $GASPai on Base to get special member-only access to premium creator archives.' },
               ].map((step, i) => (
                  <div key={i} className="flex items-start gap-8 p-10 border-b border-white/5 hover:bg-white/[0.02] transition-all group">
                     <span className="text-[#ffea00] font-syncopate font-black text-2xl italic opacity-50 group-hover:opacity-100 italic">0{i+1}</span>
                     <div className="flex-1 space-y-2 pt-1">
                        <div className="flex items-center gap-4">
                           <h4 className="text-xl font-black uppercase italic tracking-tighter">{step.node}</h4>
                           <span className={`text-[8px] font-black px-2 py-0.5 rounded border ${step.status === 'ACTIVE' ? 'border-green-500/40 text-green-500 bg-green-500/5' : 'border-white/10 text-white/20'}`}>
                              {step.status}
                           </span>
                        </div>
                        <p className="text-white/40 text-[13px] font-bold leading-relaxed">{step.desc}</p>
                     </div>
                  </div>
               ))}
            </div>
         </section>

         {/* 4. FOOTER */}
         <footer className="pt-20 border-t border-white/10 text-center space-y-8">
            <div className="flex flex-col gap-2">
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 italic font-syncopate">Gasp Archive Protocol v1.0</p>
               <span className="text-[8px] text-[#00f0ff] font-black uppercase tracking-[0.2em] italic">Member Access Active</span>
            </div>
            <div className="flex items-center justify-center gap-8 py-4">
               <ShieldCheck size={24} className="text-[#ffea00]" />
               <Zap size={24} className="text-[#00f0ff]" />
               <Trophy size={24} className="text-[#ff00ff]" />
            </div>
            <p className="text-[11px] text-white/40 font-black italic max-w-lg mx-auto leading-relaxed">
               Gasp is a premium digital media platform. Reward points show community loyalty and have no cash value until the official token launch. 🧿
            </p>
         </footer>

      </main>

      {/* BACKGROUND EFFECTS */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
         <div className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] bg-[#ffea00] rounded-full blur-[200px] opacity-10 animate-pulse" />
         <div className="absolute bottom-1/4 -left-1/4 w-[800px] h-[800px] bg-[#00f0ff] rounded-full blur-[200px] opacity-10 animate-pulse" />
      </div>

    </div>
  );
}
