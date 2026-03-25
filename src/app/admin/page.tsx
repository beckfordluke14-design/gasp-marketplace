'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Zap, Star, Trash2, LayoutDashboard, Baby, Activity, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';

/**
 * GASP SYNDICATE: COMMAND HUB (V10.2)
 * Objective: Centralized Administrative Oversight & Billboard Management.
 */
export default function AdminHub() {
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        setIsAdmin(document.cookie.includes('admin_gasp_override=granted'));
    }, []);

    const toggleAdmin = () => {
        if (isAdmin) {
            document.cookie = "admin_gasp_override=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
            setIsAdmin(false);
        } else {
            document.cookie = "admin_gasp_override=granted; path=/; max-age=31536000;";
            setIsAdmin(true);
        }
    };

    return (
        <main className="min-h-screen bg-[#050505] text-white font-outfit pb-20 overflow-hidden">
            <Header />

            <div className="container max-w-5xl mx-auto py-24 px-6 relative">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#ff00ff]/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#00f0ff]/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <div className="space-y-16 relative z-10">
                    {/* Header Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#ff00ff] shadow-2xl">
                                <ShieldAlert size={24} />
                            </div>
                            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30 italic">
                                Syndicate Control Matrix v10.2
                            </h2>
                        </div>
                        <h1 className="text-5xl md:text-8xl font-syncopate font-bold uppercase italic tracking-tighter leading-none">
                            Command <span className="text-[#ff00ff]">Hub</span>
                        </h1>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* 1. BILLBOARD MANAGER */}
                        <motion.div 
                            whileHover={{ y: -5 }}
                            onClick={() => window.location.href = '/admin/billboard'}
                            className="p-8 rounded-[3rem] bg-gradient-to-br from-[#ffea00]/10 to-[#ffea00]/5 border border-[#ffea00]/20 backdrop-blur-3xl space-y-8 flex flex-col justify-between cursor-pointer group"
                        >
                            <div className="space-y-4">
                                <div className="w-10 h-10 rounded-xl bg-[#ffea00]/20 flex items-center justify-center text-[#ffea00]">
                                    <Star size={20} fill="#ffea00" />
                                </div>
                                <h3 className="text-xl font-black uppercase italic tracking-tighter">Billboard Manager</h3>
                                <p className="text-[10px] text-white/30 uppercase tracking-widest leading-relaxed">
                                    Strategic Oversight: View all posts in a grid and pin the Top 5 most lethal assets to the homepage.
                                </p>
                            </div>
                            
                            <div className="flex items-center justify-between text-[#ffea00]">
                                <span className="text-[10px] font-black uppercase tracking-widest">Crate Billboard</span>
                                <Star size={16} className="group-hover:scale-125 transition-transform" />
                            </div>
                        </motion.div>

                        {/* 2. COMMAND MODE */}
                        <motion.div 
                            whileHover={{ y: -5 }}
                            className="p-8 rounded-[3rem] bg-white/[0.03] border border-white/10 backdrop-blur-3xl space-y-8 flex flex-col justify-between"
                        >
                            <div className="space-y-4">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/40">
                                    <LayoutDashboard size={20} />
                                </div>
                                <h3 className="text-xl font-black uppercase italic tracking-tighter">Command Mode</h3>
                                <p className="text-[10px] text-white/30 uppercase tracking-widest leading-relaxed">
                                    Toggle global administrative visibility. Unlocks Stars and Purge tools on the Live Feed.
                                </p>
                            </div>
                            
                            <button 
                                onClick={toggleAdmin}
                                className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isAdmin ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-white text-black shadow-xl'} hover:scale-105 active:scale-95`}
                            >
                                {isAdmin ? 'DEACTIVATE MATRIX' : 'ACTIVATE COMMAND'}
                            </button>
                        </motion.div>

                        {/* 2. BIRTH STATION */}
                        <motion.div 
                            whileHover={{ y: -5 }}
                            onClick={() => window.location.href = '/admin/birth'}
                            className="p-8 rounded-[3rem] bg-white/[0.03] border border-white/10 backdrop-blur-3xl space-y-8 flex flex-col justify-between cursor-pointer group"
                        >
                            <div className="space-y-4">
                                <div className="w-10 h-10 rounded-xl bg-[#00f0ff]/10 flex items-center justify-center text-[#00f0ff]">
                                    <Baby size={20} />
                                </div>
                                <h3 className="text-xl font-black uppercase italic tracking-tighter">Birth Station</h3>
                                <p className="text-[10px] text-white/30 uppercase tracking-widest leading-relaxed">
                                    Initiate Neural Genesis. Mass-produce personas or birth single identities with precision slang.
                                </p>
                            </div>
                            
                            <div className="flex items-center justify-between text-[#00f0ff]">
                                <span className="text-[10px] font-black uppercase tracking-widest">Enter Node</span>
                                <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                            </div>
                        </motion.div>

                        {/* 3. FACTORY MONITOR */}
                        <motion.div 
                            whileHover={{ y: -5 }}
                            onClick={() => window.location.href = '/admin/monitor'}
                            className="p-8 rounded-[3rem] bg-white/[0.03] border border-white/10 backdrop-blur-3xl space-y-8 flex flex-col justify-between cursor-pointer group"
                        >
                            <div className="space-y-4">
                                <div className="w-10 h-10 rounded-xl bg-[#ff00ff]/10 flex items-center justify-center text-[#ff00ff]">
                                    <Activity size={20} />
                                </div>
                                <h3 className="text-xl font-black uppercase italic tracking-tighter">Live Monitor</h3>
                                <p className="text-[10px] text-white/30 uppercase tracking-widest leading-relaxed">
                                    Real-time xAI Video Pipeline health. View successful renders and troubleshoot failures.
                                </p>
                            </div>
                            
                            <div className="flex items-center justify-between text-[#ff00ff]">
                                <span className="text-[10px] font-black uppercase tracking-widest">Observe Hub</span>
                                <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                            </div>
                        </motion.div>
                    </div>

                    {/* Billboard Context */}
                    <div className="p-10 rounded-[4rem] bg-gradient-to-br from-[#ff00ff]/10 to-[#00f0ff]/10 border border-white/10 space-y-8 relative overflow-hidden group">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[200px] text-white/[0.01] font-black pointer-events-none uppercase italic tracking-tighter select-none">SYNDICATE</div>
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                            <div className="space-y-4 max-w-xl">
                                <div className="flex items-center gap-3 text-[#ffea00]">
                                    <Star size={24} fill="#ffea00" />
                                    <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">The Billboard Protocol</h3>
                                </div>
                                <p className="text-sm text-white/50 leading-relaxed font-medium">
                                    Once **Command Mode** is active, navigate to your Global Feed. Every post will now feature a **Gold Star** on the right edge. Tapping this star instantly pins that post to the Top 5 spots of the site. Use this to rotate high-conversion assets into the primary viewing window.
                                </p>
                            </div>
                            <div className="flex flex-col items-center gap-4 p-8 bg-black/40 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                </div>
                                <Trash2 className="text-white/10 group-hover:text-red-500 transition-colors" size={40} />
                                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/20">Legacy Purge Active</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}



