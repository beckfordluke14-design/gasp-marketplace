'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Zap, ChevronRight, Activity, Database, Globe } from 'lucide-react';
import { useUser } from './providers/UserProvider';

/**
 * ⛽ THE GASP REWARDS DASHBOARD
 * Simple, high-status overview of user points and global activity.
 */
export default function ProtocolOverview() {
    const { user } = useUser();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchProtocolStats = async () => {
        try {
            const url = user?.id ? `/api/user/points?userId=${user.id}` : `/api/user/points`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                setStats(data.data);
            }
        } catch (e) {
            console.error('[Rewards] Metrics Failure', e);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchProtocolStats();
    }, [user?.id]);

    const [displayBurn, setDisplayBurn] = useState(0);
    useEffect(() => {
        if (stats?.globalBurn) {
            setDisplayBurn(stats.globalBurn);
        }
    }, [stats?.globalBurn]);
    
    return (
        <div className="flex-1 w-full bg-[#050505] p-4 md:p-12 overflow-y-auto no-scrollbar pb-32">
            
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <ShieldCheck size={16} className="text-[#00f0ff]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#00f0ff]">Member Rewards Program 🛡️</span>
                    </div>
                    <h1 className="text-4xl md:text-7xl font-syncopate font-black italic tracking-tighter uppercase leading-none">
                        GASP <span className="text-[#ffea00]">REWARDS</span>
                    </h1>
                    <p className="text-white/40 max-w-xl text-xs md:text-sm font-outfit uppercase tracking-widest font-black leading-relaxed">
                        The premium digital media archive. 
                        Support your favorite creators and earn points for your activity.
                    </p>
                </div>

                {/* METRICS */}
                <div className="flex flex-wrap items-center gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 flex items-center gap-6 shadow-2xl flex-1 min-w-[240px]">
                        <div className="w-12 h-12 rounded-full bg-[#ffea00]/10 border border-[#ffea00]/20 flex items-center justify-center">
                            <Activity size={24} className="text-[#ffea00] animate-pulse" />
                        </div>
                        <div>
                            <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-[#ffea00]">Global Activity</p>
                            <h3 className="text-2xl md:text-4xl font-syncopate font-black italic tracking-tighter">
                                {displayBurn.toLocaleString()} <span className="text-sm text-white/20">PTS</span>
                            </h3>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 flex items-center gap-6 shadow-2xl flex-1 min-w-[240px]">
                        <div className="w-12 h-12 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/20 flex items-center justify-center">
                            <Database size={24} className="text-[#00f0ff] animate-pulse" />
                        </div>
                        <div>
                            <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-[#00f0ff]">Community Status</p>
                            <h3 className="text-xl md:text-3xl font-syncopate font-black italic tracking-tighter">
                                System Active
                            </h3>
                         </div>
                     </div>
                 </div>
            </div>

            {/* YOUR STANDING */}
            <div className="bg-gradient-to-br from-[#ff00ff]/5 to-transparent border border-white/10 rounded-[3rem] p-8 md:p-12 overflow-hidden relative group mb-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                    <div className="space-y-6 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-4">
                            <Activity size={24} className="text-[#00f0ff]" />
                            <h2 className="text-3xl font-syncopate font-black italic tracking-tighter uppercase">Your Member <span className="text-[#00f0ff]">Status</span></h2>
                        </div>
                        <div className="flex flex-wrap justify-center md:justify-start gap-12">
                              <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/30">$GASPai Protocol Points</p>
                                <h4 className="text-3xl md:text-5xl font-syncopate font-black italic tracking-tighter text-[#00f0ff]">
                                    {(stats?.balance || 0).toLocaleString()} <span className="text-xs text-white/20">PTS</span>
                                </h4>
                                <p className="text-[7px] text-[#00f0ff] uppercase font-black tracking-widest italic mt-1 animate-pulse">6-Month Lock For Voting Power 🛡️</p>
                             </div>
                             <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Credits Spent</p>
                                <h4 className="text-3xl md:text-5xl font-syncopate font-black italic tracking-tighter text-[#ffea00]">
                                    {(stats?.totalSpent || 0).toLocaleString()} <span className="text-xs text-white/20">CR</span>
                                </h4>
                             </div>
                        </div>
                    </div>

                    <button 
                       onClick={() => window.location.href = '/'}
                       className="px-10 py-5 bg-white text-black rounded-3xl text-[12px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center gap-4"
                    >
                        Boost Your Rank <ChevronRight size={18} />
                    </button>
                </div>
            </div>


            {/* LATEST FEED ACTIVITY */}
            <div className="mt-12 bg-black border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative group">
                <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Latest Feed Activity 🛰️</span>
                    </div>
                </div>

                <div className="p-6 md:p-8 font-mono text-[9px] md:text-[10px] leading-relaxed h-48 overflow-hidden relative">
                    <NetworkActivityPulse />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
                </div>
            </div>

            {/* DISCLAIMER */}
            <div className="mt-8 p-8 border border-white/5 rounded-3xl bg-black/40 backdrop-blur-xl">
                 <p className="text-[9px] font-outfit uppercase tracking-[0.1em] text-white/20 text-center leading-relaxed max-w-4xl mx-auto italic">
                    Gasp Points represent user loyalty and participation in the community. 
                    Points have no cash value and are not securities. 
                    Participation is subject to our terms of service.
                 </p>
            </div>
        </div>
    );
}

function NetworkActivityPulse() {
    const [reports, setReports] = useState<any[]>([]);
    
    useEffect(() => {
        const fetchLatest = async () => {
           try {
              const res = await fetch('/api/rpc/db', {
                 method: 'POST',
                 body: JSON.stringify({ action: 'get_latest_news', payload: { limit: 5 } })
              });
              const data = await res.json();
              if (data.success) setReports(data.posts);
           } catch(e) {}
        };
        fetchLatest();
        const interval = setInterval(fetchLatest, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-4">
            <AnimatePresence>
                {reports.length === 0 ? (
                    <div className="text-white/20 uppercase tracking-widest text-[8px] animate-pulse">Updating feed activity...</div>
                ) : reports.map((rpt, i) => (
                    <motion.div 
                        key={rpt.id + i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex items-center gap-4 cursor-pointer group ${i === 0 ? 'text-[#00f0ff]' : 'text-white/20 hover:text-white/40'}`}
                    >
                        <span className="shrink-0 font-mono text-[7px] opacity-40">[{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]</span>
                        <span className="shrink-0">{i === 0 ? '►' : '  '}</span>
                        <span className="uppercase tracking-widest leading-none truncate group-hover:underline">{rpt.title}</span>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
