'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { initialAgencies, initialProfiles, type Agency, type Profile } from '@/lib/profiles';
import Header from '@/components/Header';
import { 
  Zap, 
  Plus, 
  ShieldCheck, 
  Globe, 
  LayoutDashboard,
  Users,
  Lock,
  MessageSquare,
  Crown
} from 'lucide-react';
import Image from 'next/image';

const MASTER_UUID = "master-uuid-1"; // Hardcoded Bypass for Mi Amor Agency

export default function GaspCreatorStudio() {
    const [agency] = useState<Agency>(initialAgencies[0]);
    const [profiles, setProfiles] = useState<Profile[]>(initialProfiles.filter(p => p.agency_id === agency.id));
    
    const isMaster = MASTER_UUID === agency.owner_id;
    const profileLimit = 3;
    const hasReachedLimit = !isMaster && profiles.length >= profileLimit;

    return (
        <main className="min-h-screen bg-black text-white selection:bg-gasp-neon selection:text-black">
            <Header />
            
            <div className="container max-w-7xl mx-auto pt-32 pb-20 px-6">
                
                {/* 1. AGENCY HEADER */}
                <header className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16 p-10 bg-white/5 border border-white/10 rounded-[3rem] glass shadow-4xl relative overflow-hidden">
                    <div className="flex flex-col gap-4 relative z-10">
                        <div className="flex items-center gap-2">
                             <div className="px-3 py-1 bg-gasp-neon/10 border border-gasp-neon/20 rounded-md text-gasp-neon text-[8px] font-black uppercase tracking-widest">
                                 Agency active
                             </div>
                             {isMaster && (
                                <div className="px-3 py-1 bg-neon-pink/10 border border-neon-pink/20 rounded-md text-neon-pink text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                    <Crown size={10} /> Master bypass
                                </div>
                             )}
                        </div>
                        <h1 className="text-5xl font-outfit font-black italic uppercase tracking-tighter">
                            {agency.name} <span className="text-white/20 whitespace-nowrap">Creator Studio</span>
                        </h1>
                        <p className="text-white/40 italic lowercase pl-4 border-l border-gasp-neon/40 leading-relaxed pr-12">"{agency.bio}"</p>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-1">Network Capacity</span>
                            <div className="flex items-center gap-4">
                                <span className="text-2xl font-bold font-mono tracking-tighter">{profiles.length} / {isMaster ? '∞' : profileLimit}</span>
                                <div className="w-40 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(profiles.length / (isMaster ? 10 : profileLimit)) * 100}%` }}
                                        className="h-full bg-gasp-neon shadow-[0_0_10px_rgba(0,240,255,0.6)]" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* 2. CREATOR GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    
                    {/* A. NEW PROFILE SLOT (Gated) */}
                    {!hasReachedLimit ? (
                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="h-[500px] border-2 border-dashed border-white/10 rounded-[3rem] flex flex-col items-center justify-center gap-6 hover:border-gasp-neon/40 hover:bg-gasp-neon/5 transition-all group"
                        >
                            <div className="w-20 h-20 rounded-[2.5rem] bg-white/5 flex items-center justify-center group-hover:bg-gasp-neon/20 transition-all border border-white/5 group-hover:border-gasp-neon/20 shadow-2xl">
                                <Plus size={32} className="text-white group-hover:text-gasp-neon transition-all" />
                            </div>
                            <div className="text-center group-hover:scale-105 transition-all">
                                <h3 className="text-xl font-outfit font-black italic uppercase italic tracking-tight">Generate Profile</h3>
                                <p className="text-[9px] uppercase font-black tracking-widest text-white/20 mt-2">New Identity Uplink</p>
                            </div>
                        </motion.button>
                    ) : (
                        <div className="h-[500px] border-2 border-white/5 bg-white/[0.02] rounded-[3rem] p-12 flex flex-col items-center justify-center text-center gap-8 relative overflow-hidden grayscale">
                            <Lock size={48} className="text-white/10" />
                            <div className="space-y-4 relative z-10">
                                <h3 className="text-xl font-outfit font-black italic uppercase italic tracking-tight text-white/30">Limit Reached</h3>
                                <p className="text-xs text-white/20 italic leading-relaxed px-6">
                                    You've hit the Gasp Creator limit for Free Tier agencies.
                                </p>
                            </div>
                            <button className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] uppercase font-black tracking-widest text-gasp-neon hover:bg-gasp-neon/10 transition-all">
                                Request Pro Upgrade
                            </button>
                        </div>
                    )}

                    {/* B. LISTED PROFILES */}
                    {profiles.map((profileItem) => (
                        <div key={profileItem.id} className="h-[500px] bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden group shadow-3xl relative">
                            {/* Portrait */}
                            <div className="relative h-2/3 grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700">
                                <Image src={profileItem.image} alt="" fill className="object-cover" unoptimized />
                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent" />
                                <div className="absolute top-6 left-6 flex items-center gap-2">
                                     <div className="px-3 py-1.5 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-gasp-neon rounded-full animate-pulse shadow-[0_0_8px_rgba(0,240,255,1)]" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Active Neural Link</span>
                                     </div>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-8 flex flex-col justify-between h-1/3">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-2xl font-outfit font-black italic uppercase tracking-tighter">{profileItem.name} {profileItem.flag}</h3>
                                        <span className="text-[10px] font-mono font-bold text-white/40 tracking-tight">{profileItem.city}</span>
                                    </div>
                                    <p className="text-[11px] text-white/40 italic lowercase truncate leading-none">"{profileItem.vibe}"</p>
                                </div>

                                <div className="flex items-center gap-4 pt-4 mt-auto">
                                    <button className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all">
                                        <LayoutDashboard size={14} className="text-gasp-neon" />
                                        <span className="text-[9px] font-black uppercase tracking-widest leading-none">Settings</span>
                                    </button>
                                    <button className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all">
                                        <MessageSquare size={14} className="text-gasp-neon" />
                                        <span className="text-[9px] font-black uppercase tracking-widest leading-none">Logs</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                </div>
            </div>
        </main>
    );
}
