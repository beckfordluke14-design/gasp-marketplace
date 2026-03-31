'use client';

import { motion } from 'framer-motion';
import { Shield, Zap, Flame, Cpu, Users, BarChart3, ArrowUpRight, Lock, Network } from 'lucide-react';

export default function ProtocolOverview() {
    return (
        <div className="h-full w-full overflow-y-auto overflow-x-hidden flex flex-col pt-20 px-4 md:px-8 pb-32">
            <header className="mb-16 text-center md:text-left">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center md:justify-start gap-4 mb-4"
                >
                    <div className="px-4 py-1.5 bg-[#ffea00]/20 text-[#ffea00] text-[10px] font-black uppercase tracking-[0.4em] rounded-full border border-[#ffea00]/30 shadow-[0_0_20px_rgba(255,234,0,0.2)]">
                        Strategic Assets
                    </div>
                </motion.div>
                <h1 className="text-5xl md:text-7xl font-outfit font-black italic uppercase tracking-tighter text-white leading-none">
                    The $GASP<span className="text-[#ffea00]">ai</span> Plan
                </h1>
                <p className="text-white/40 text-[10px] font-mono mt-4 uppercase tracking-[0.5em] flex items-center justify-center md:justify-start gap-2">
                    <Network size={14} className="text-[#ffea00]" /> Intelligence Meets Real Money
                </p>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 max-w-7xl mx-auto w-full">
                
                {/* 🧬 THE BURN CORE - SIMPLE MODE */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="xl:col-span-2 relative p-8 md:p-12 rounded-[3rem] bg-black border border-white/5 overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#ffea00]/5 via-transparent to-transparent" />
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-2xl bg-[#ffea00]/20 flex items-center justify-center text-[#ffea00] border border-[#ffea00]/30">
                                <Flame size={20} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-[#ffea00]">How the Coin Burns</span>
                        </div>

                        <h2 className="text-3xl md:text-6xl font-outfit font-black italic uppercase tracking-tighter mb-8 leading-tight">
                            The Coin That <span className="text-white/40 italic">Eats Itself</span>
                        </h2>

                        {/* 📋 THE 3-STEP FOR DUMMIES */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                             <div className="flex flex-col gap-4">
                                 <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/20 text-xl font-black">1</div>
                                 <p className="text-white text-sm font-black uppercase tracking-tight italic">You use the intel tools (Chat & Weather)</p>
                             </div>
                             <div className="flex flex-col gap-4">
                                 <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-[#ffea00] text-xl font-black italic">2</div>
                                 <p className="text-[#ffea00] text-sm font-black uppercase tracking-tight italic">The site takes a cut of every credit spent</p>
                             </div>
                             <div className="flex flex-col gap-4">
                                 <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-green-500 text-xl font-black italic">3</div>
                                 <p className="text-green-500 text-sm font-black uppercase tracking-tight italic">We use that cut to Buy & Burn $GASPai forever</p>
                             </div>
                        </div>

                        <p className="text-white/60 text-base font-mono leading-relaxed mb-10 max-w-2xl">
                            $GASPai isn't just a token. It's the "Gasoline" for the entire Syndicate. The more people use the site to make money on Weather Arbitrage, the more coins are permanently removed from the supply. Simple as that.
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 text-center md:text-left">
                                <span className="text-[8px] uppercase font-black text-white/30 tracking-widest block mb-1">Burn Action</span>
                                <span className="text-2xl font-black text-[#ffea00]">AUTOMATIC</span>
                            </div>
                            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 text-center md:text-left">
                                <span className="text-[8px] uppercase font-black text-white/30 tracking-widest block mb-1">Syndicate Cut</span>
                                <span className="text-2xl font-black text-white italic">1.0%</span>
                            </div>
                            <div className="hidden md:flex p-6 rounded-3xl bg-white/5 border border-white/10 items-center justify-center">
                                <Zap size={24} className="text-[#ffea00] animate-pulse" />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* 🛰️ STATUS MONITOR */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-8 rounded-[3rem] bg-white/5 border border-white/10 flex flex-col justify-between"
                >
                    <div className="text-center md:text-left">
                        <div className="flex items-center justify-between mb-10">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">Launch Date</span>
                            <div className="px-2 py-1 bg-[#ffea00]/20 text-[#ffea00] text-[8px] font-black uppercase rounded border border-[#ffea00]/30 animate-pulse">
                                INCOMING
                            </div>
                        </div>

                        <div className="py-10">
                            <span className="text-[2.5rem] md:text-[3.5rem] font-black italic text-white tracking-widest leading-none">PENDING<br/><span className="text-[#ffea00]">2026</span></span>
                            <span className="text-[10px] font-mono text-white/20 mt-6 block uppercase tracking-[0.2em]">The $GASPai Mainnet is in Staging. Be ready.</span>
                        </div>
                    </div>

                    <button className="w-full py-4 bg-white/10 hover:bg-white text-white hover:text-black rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                        <BarChart3 size={14} /> Join the Waitlist
                    </button>
                </motion.div>

                {/* 🗓️ ROADMAP */}
                <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                    {[
                        { title: 'Alpha Node Launch', date: 'March 2026', status: 'Completed', icon: <Zap /> },
                        { title: 'Arbitrage Intelligence v2', date: 'April 2026', status: 'Active', icon: <BarChart3 /> },
                        { title: 'Neural Burn Mainnet', date: 'May/June 2026', status: 'Pending', icon: <Flame /> },
                        { title: 'TGE: $GASPai Launch', date: 'STAGED DISPATCH', status: 'Coming Soon', icon: <Users /> }
                    ].map((step, i) => (
                        <div key={i} className="p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 relative overflow-hidden group">
                            <div className={`absolute top-0 right-0 w-2 h-2 m-4 rounded-full ${step.status === 'Completed' ? 'bg-green-500' : step.status === 'Active' ? 'bg-[#ffea00] animate-pulse' : 'bg-white/10'}`} />
                            <div className="text-white/20 mb-6 group-hover:text-white transition-colors">
                                {step.icon}
                            </div>
                            <h3 className="text-lg font-black uppercase italic tracking-tighter mb-2">{step.title}</h3>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{step.date}</span>
                                <span className={`text-[8px] font-black uppercase tracking-widest ${step.status === 'Completed' ? 'text-green-500' : step.status === 'Active' ? 'text-[#ffea00]' : 'text-white/20'}`}>
                                    {step.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 🛡️ NJ / LEGAL AIR GAP */}
                <div className="xl:col-span-3 mt-12 p-8 border border-white/5 rounded-3xl bg-black/40">
                   <div className="flex items-start gap-4">
                       <Shield size={20} className="text-white/20 shrink-0 mt-1" />
                       <div>
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">Syndicate Disclaimer (Sovereign Infrastructure)</h4>
                           <p className="text-[9px] font-mono text-white/20 leading-relaxed uppercase">
                               The $GASPai tokens are strictly intended for network governance and infrastructure fuel purposes. Holders participate in the decentralized decision-making process of the Syndicate Neural Core. Participation in the burn protocol is a direct byproduct of network utility and does not constitute a financial security. Regional laws (NJ/USA) apply. Consult your local legal oracle before deployment.
                           </p>
                       </div>
                   </div>
                </div>

            </div>
        </div>
    );
}
