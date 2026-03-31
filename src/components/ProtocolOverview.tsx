'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, ShieldCheck, Zap, Users, ChevronRight, Fuel, LayoutGrid, Activity } from 'lucide-react';
import { useUser } from './providers/UserProvider';

/**
 * ⛽ THE SYNDICATE PROTOCOL: Intelligence-First Governance Hub
 * Strategy: Reward users for activity, burn supply through utility, 
 * and govern through sovereign GASPai tokens.
 */
export default function ProtocolOverview() {
    const { user } = useUser();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // 📡 FETCH LIVE BURN & POINT DATA
    const fetchProtocolStats = async () => {
        if (!user?.id) return;
        try {
            const res = await fetch(`/api/user/points?userId=${user.id}`);
            const data = await res.json();
            if (data.success) {
                setStats(data.data);
            }
        } catch (e) {
            console.error('[Protocol] Metrics Failure', e);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchProtocolStats();
    }, [user?.id]);

    const burnContracted = stats?.globalBurn || 0;
    
    return (
        <div className="flex-1 w-full bg-[#050505] p-4 md:p-12 overflow-y-auto no-scrollbar pb-32">
            {/* 🛡️ SOVEREIGN PROTOCOL HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <ShieldCheck size={16} className="text-[#00f0ff]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#00f0ff]">Syndicate Intelligence Consensus 🛡️</span>
                    </div>
                    <h1 className="text-4xl md:text-7xl font-syncopate font-black italic tracking-tighter uppercase leading-none">
                        GASPai <span className="text-[#ffea00]">PROTOCOL</span>
                    </h1>
                    <p className="text-white/40 max-w-xl text-xs md:text-sm font-outfit uppercase tracking-widest font-black leading-relaxed">
                        The world’s first deflationary intelligence network. 
                        Fueling the sovereign weather board through direct utility contraction.
                    </p>
                </div>

                {/* LIVE BURN COUNTER - MOBILE FIRST */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 flex items-center gap-6 shadow-[0_0_50px_rgba(255,234,0,0.05)]">
                    <div className="w-12 h-12 rounded-full bg-[#ffea00]/10 border border-[#ffea00]/20 flex items-center justify-center">
                        <Flame size={24} className="text-[#ffea00] animate-pulse" />
                    </div>
                    <div>
                        <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-[#ffea00]">Global Shadow Burn</p>
                        <h3 className="text-2xl md:text-4xl font-syncopate font-black italic tracking-tighter">
                            {burnContracted.toLocaleString()} <span className="text-sm text-white/20">CR</span>
                        </h3>
                    </div>
                </div>
            </div>

            {/* 🧬 THE 3-PHASE EVOLUTION (RESPONSIVE GRID) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {[
                    { phase: 'Phase 1', title: 'Accumulate', desc: 'Every 1 Credit purchased unlocks 1 GASP Point. These are the governance weights for the upcoming TGE.', icon: Zap, color: '#00f0ff', label: 'Match Active' },
                    { phase: 'Phase 2', title: 'Contract', desc: 'Site activity (Weather/Chat) triggers the Shadow Burn. This permanently reduces total circulating supply before launch.', icon: Fuel, color: '#ffea00', label: 'Shadow Burn Live' },
                    { phase: 'Phase 3', title: 'Govern', desc: 'At TGE, GASP Points convert 1:1 to GASPai Tokens. Hold for voting power on the Weather Alpha Board.', icon: LayoutGrid, color: '#ff00ff', label: 'TGE Pending 2026' }
                ].map((p, idx) => (
                    <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                        className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-8 hover:border-white/10 transition-all group relative overflow-hidden"
                    >
                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase text-white/20 tracking-tighter">{p.phase}</span>
                                <h3 style={{ color: p.color }} className="text-2xl font-syncopate font-black italic tracking-tighter uppercase">{p.title}</h3>
                            </div>
                            <div style={{ borderColor: p.color }} className="px-3 py-1 rounded-full border border-dashed text-[8px] font-black uppercase tracking-widest text-white/60">{p.label}</div>
                        </div>
                        <p className="text-white/40 text-sm font-outfit leading-relaxed relative z-10 line-clamp-3">{p.desc}</p>
                        
                        <div style={{ backgroundColor: p.color }} className="absolute -bottom-10 -right-10 w-32 h-32 blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity" />
                    </motion.div>
                ))}
            </div>

            {/* 🐋 YOUR SYNDICATE STANDING */}
            <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-[3rem] p-8 md:p-12 overflow-hidden relative group">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                    <div className="space-y-6 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-4">
                            <Activity size={24} className="text-[#00f0ff]" />
                            <h2 className="text-3xl font-syncopate font-black italic tracking-tighter uppercase">Your Protocol <span className="text-[#00f0ff]">Weight</span></h2>
                        </div>
                        <div className="flex flex-wrap justify-center md:justify-start gap-12">
                             <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/30">GASP Points (Match)</p>
                                <h4 className="text-3xl md:text-5xl font-syncopate font-black italic tracking-tighter text-[#00f0ff]">
                                    {(stats?.balance || 0).toLocaleString()} <span className="text-xs text-white/20">PTS</span>
                                </h4>
                             </div>
                             <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Total Burn Contribution</p>
                                <h4 className="text-3xl md:text-5xl font-syncopate font-black italic tracking-tighter text-[#ffea00]">
                                    {(stats?.totalSpent || 0).toLocaleString()} <span className="text-xs text-white/20">CR</span>
                                </h4>
                             </div>
                        </div>
                    </div>

                    <a href="/?tab=weather" className="px-10 py-5 bg-white text-black rounded-3xl text-[12px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center gap-4">
                        Grow Your Weight <ChevronRight size={18} />
                    </a>
                </div>

                <div className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00f0ff]/10 blur-[120px] rounded-full" />
                </div>
            </div>

            {/* 🛡️ THE MISSION DISCLAMER: NO SCAM NARRATIVE */}
            <div className="mt-12 p-8 border border-white/5 rounded-3xl bg-black/40 backdrop-blur-xl">
                 <p className="text-[9px] font-outfit uppercase tracking-[0.1em] text-white/20 text-center leading-relaxed max-w-4xl mx-auto">
                    $GASPai is an Intelligence Governance Token. GASP Points represent user loyalty and participation in the Syndicate network protocol. 
                    Tokens are not investments. All deflationary burns are functions of site utility consumption. Participation is subject to the Syndicate Terms of Service and local regulatory compliance.
                 </p>
            </div>
        </div>
    );
}
