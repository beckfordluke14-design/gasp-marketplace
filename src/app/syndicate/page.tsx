'use client';

import { motion } from 'framer-motion';
import { Shield, Zap, Globe, Users, BarChart3, Target } from 'lucide-react';
import Link from 'next/link';

export default function SyndicateCorporatePage() {
    return (
        <main className="min-h-screen bg-black text-white selection:bg-[#00fff2] selection:text-black">
            {/* 🌌 HERO SECTION */}
            <div className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto text-center space-y-8">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[radial-gradient(circle_at_center,rgba(0,255,242,0.1)_0%,transparent_70%)] pointer-events-none" />
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00fff2]/30 bg-[#00fff2]/5 text-[#00fff2] text-[10px] font-black uppercase tracking-[0.3em] italic"
                >
                    <Zap size={12} fill="currentColor" />
                    Global Publisher Node v2.0
                </motion.div>

                <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter uppercase leading-[0.85]">
                    THE <span className="text-[#00fff2]">SYNDICATE</span><br/>NETWORK
                </h1>
                
                <p className="max-w-xl mx-auto text-white/50 text-sm md:text-lg font-medium leading-relaxed">
                    A premier gamified rewards ecosystem driving high-intent user acquisition and social engagement for global digital brands.
                </p>

                <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                    <Link href="/syndicate/mission-board" className="px-8 py-4 bg-[#00fff2] text-black font-black uppercase tracking-widest text-xs rounded-full hover:scale-105 transition-all shadow-[0_0_30px_#00fff266]">
                        Access Mission Center
                    </Link>
                    <button className="px-8 py-4 border border-white/20 hover:border-[#00fff2] hover:text-[#00fff2] transition-colors font-black uppercase tracking-widest text-xs rounded-full">
                        Documentation
                    </button>
                </div>
            </div>

            {/* 📊 METRICS GRID (FOR NETWORK APPROVAL) */}
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6 pb-32">
                {[
                    { icon: Users, label: 'Active Nodes', val: '14.2k+', color: '#00fff2' },
                    { icon: Globe, label: 'Global Geo-Sync', val: '190+', color: '#ffea00' },
                    { icon: BarChart3, label: 'Avg. Retention', val: '84%', color: '#00fff2' }
                ].map((m, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-[2rem] space-y-4 hover:border-white/20 transition-all">
                        <m.icon size={32} className="opacity-50" style={{ color: m.color }} />
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 italic">{m.label}</p>
                            <p className="text-3xl font-black italic tracking-tighter">{m.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* 🛡️ MISSION STATEMENT */}
            <div className="bg-white/[0.02] border-y border-white/5 py-32">
                <div className="max-w-4xl mx-auto px-6 text-center space-y-12">
                    <Shield size={64} className="mx-auto text-[#00fff2] opacity-20" />
                    <h2 className="text-3xl font-black italic tracking-tighter uppercase">High-Heat User Arbitrage</h2>
                    <p className="text-white/40 leading-loose text-sm italic">
                        The Syndicate Network leverages proprietary AI-driven social listening tools to identify and engage high-LTV users across major vertical markets including Entertainment, E-Commerce, and Digital Security. Our mission-based architecture ensures 100% human verification and maximum CPA payout efficiency.
                    </p>
                </div>
            </div>
        </main>
    );
}
