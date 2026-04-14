'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Target, ArrowRight, ShieldCheck, Loader2, Lock, Unlock, CheckCircle2 } from 'lucide-react';
import { useUser } from '../providers/UserProvider';

interface Mission {
    id: string;
    title: string;
    description: string;
    payout: number;
    link: string;
    type: string;
    network: string;
}

/**
 * 🛰️ SYNDICATE MISSION TERMINAL v16.0 // VAULT UNLOCK EDITION
 * Hard-coded for high-intent 'Joe-Proof' conversion.
 */
export default function SyndicateMissionBoard() {
    const { balance, profile } = useUser();
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);

    const isSpanish = typeof window !== 'undefined' && localStorage.getItem('gasp_locale') === 'es';

    useEffect(() => {
        const fetchMissions = async () => {
            try {
                const res = await fetch('/api/economy/missions?trackingId=' + (localStorage.getItem('gasp_guest_id') || 'anon'));
                const data = await res.json();
                if (data.success) setMissions(data.missions);
            } catch (e) {
                console.error('Mission Uplink Failed:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchMissions();
    }, []);

    const handleMissionClick = (mission: Mission) => {
        // Track locally as 'In Progress'
        const inProgress = JSON.parse(localStorage.getItem('gasp_missions_active') || '[]');
        if (!inProgress.includes(mission.id)) {
            localStorage.setItem('gasp_missions_active', JSON.stringify([...inProgress, mission.id]));
        }
        window.open(mission.link, '_blank');
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <Loader2 size={40} className="animate-spin text-[#00fff2]" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 animate-pulse italic">Scanning Sector...</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            
            {/* 🛰️ VAULT PROGRESS TRACKER */}
            <div className="p-8 bg-gradient-to-br from-[#ff00ff]/10 to-transparent border border-[#ff00ff]/30 rounded-[3rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-5">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#ff00ff]/10 border border-[#ff00ff]/30 rounded-full animate-pulse">
                        <div className="w-1.5 h-1.5 bg-[#ff00ff] rounded-full shadow-[0_0_10px_#ff00ff]" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-[#ff00ff] italic">TRACKER LINKED</span>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex flex-col gap-1 text-left">
                        <span className="text-[10px] font-black text-[#ffea00] uppercase tracking-[0.5em] italic mb-1">REAL-TIME MISSION TRACKER</span>
                        <div className="flex items-end justify-between">
                            <h4 className="text-4xl font-syncopate font-black italic text-white uppercase tracking-tighter tabular-nums leading-none">
                                {balance.toLocaleString()} <span className="text-[12px] text-white/30 tracking-widest not-italic">CR</span>
                            </h4>
                            <div className="flex flex-col items-end leading-none translate-y-2">
                                <span className="text-[12px] font-black text-white italic tracking-tighter">GOAL: 6,000 CR</span>
                                <span className="text-[7px] font-black text-[#ff00ff] uppercase tracking-widest mt-1">PRIVATE VAULT UNLOCK 🌶️</span>
                            </div>
                        </div>
                    </div>

                    {/* 🧬 DYNAMIC PROGRESS BAR */}
                    <div className="h-6 w-full bg-black/40 rounded-full border border-white/5 overflow-hidden p-1.5 shadow-inner ring-1 ring-white/5">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (balance / 6000) * 100)}%` }}
                            className="h-full bg-gradient-to-r from-[#ff00ff] via-[#00f0ff] to-[#ffea00] rounded-full shadow-[0_0_30px_rgba(255,0,255,0.6)]"
                        />
                    </div>
                    
                    <div className="flex items-center justify-between text-[8px] font-black text-white/30 uppercase tracking-[0.3em] italic px-1 pt-1 opacity-60">
                        <span>SIGNAL ACTIVE</span>
                        <span className="text-white animate-pulse">REACH 6,000 CR TO REVEAL PRIVATE ARCHIVES</span>
                    </div>
                </div>
            </div>

            {/* 🍼 DUMMY-PROOF COACHING */}
            <div className="flex flex-col gap-2 px-4 text-left">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#ffea00]/10 border border-[#ffea00]/30 flex items-center justify-center">
                     <Target size={18} className="text-[#ffea00]" />
                  </div>
                  <div className="flex flex-col">
                     <h3 className="text-xl font-syncopate font-black uppercase italic text-white tracking-tighter leading-none">FREE VAULT ACCESS</h3>
                     <span className="text-[9px] font-bold text-[#ffea00] uppercase tracking-widest mt-1 italic">Sponsors pay for your access. use real data to clear signal.</span>
                  </div>
               </div>
               
               <div className="grid grid-cols-3 gap-3 mt-4">
                  {[
                    { s: '01', t: 'CHOOSE', d: 'PICK ANY MISSION' },
                    { s: '02', t: 'REAL INFO', d: 'ENTER VALID EMAIL' },
                    { s: '03', t: 'UNLOCK', d: '6,000 CR VAULT' }
                  ].map((step, i) => (
                    <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-3xl flex flex-col items-center text-center">
                        <span className="text-[12px] font-black text-[#ffea00] mb-1 italic leading-none">{step.s}</span>
                        <span className="text-[9px] font-black text-white uppercase tracking-widest leading-none mb-1">{step.t}</span>
                        <span className="text-[6px] font-bold text-white/30 uppercase tracking-widest leading-tight">{step.d}</span>
                    </div>
                  ))}
               </div>
            </div>

            {/* 🎯 MISSION NODES */}
            <div className="grid grid-cols-1 gap-4">
               <div className="flex items-center gap-2 px-4 mb-2">
                  <span className="text-[10px] font-black text-white/20 tracking-[0.4em] uppercase italic">ACTIVE ACCESS NODES</span>
                  <div className="h-[1px] flex-1 bg-white/5" />
               </div>

                {missions.map((mission, i) => (
                    <motion.button
                        key={mission.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => handleMissionClick(mission)}
                        className="group relative w-full bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-6 hover:border-[#00f0ff]/40 hover:bg-[#00f0ff]/5 transition-all flex items-center justify-between overflow-hidden shadow-2xl"
                    >
                        <div className="flex flex-col gap-2 text-left relative z-10 shrink-0">
                            <span className="text-[9px] font-black text-[#00f0ff] uppercase tracking-widest italic">{mission.type}</span>
                            <h5 className="text-lg font-syncopate font-black italic text-white uppercase tracking-tighter leading-none">{mission.title}</h5>
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest leading-tight pr-10">{mission.description}</p>
                        </div>

                        <div className="flex flex-col items-end gap-3 shrink-0 relative z-10">
                            <div className="flex items-center gap-2 px-4 py-2 bg-[#ffea00]/10 border border-[#ffea00]/30 rounded-2xl shadow-[0_0_20px_rgba(255,234,0,0.1)]">
                                <Zap size={14} className="text-[#ffea00] fill-[#ffea00]" />
                                <span className="text-lg font-syncopate font-black italic text-[#ffea00] tabular-nums">+{mission.payout.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[#00f0ff] opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                                <span className="text-[10px] font-black uppercase tracking-widest italic">STEP 1: UNLOCK</span>
                                <ArrowRight size={14} />
                            </div>
                        </div>

                        {/* 🧬 SCANNER ANIMATION ON HOVER */}
                        <div className="absolute inset-y-0 left-0 w-1 bg-[#00f0ff] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.button>
                ))}
            </div>

            <div className="p-10 opacity-10 flex flex-col items-center gap-2 border-t border-white/5">
                <ShieldCheck size={24} />
                <span className="text-[8px] font-black uppercase tracking-[0.5em] italic italic">Verified Syndicate Uplink // Real Data Only</span>
            </div>
        </div>
    );
}
