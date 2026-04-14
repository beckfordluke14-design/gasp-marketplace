'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, Sparkles, ArrowRight, Target, Globe, Smartphone, Monitor } from 'lucide-react';
import { SYNDICATE_CONFIG } from '@/lib/economy/monetizationConfig';

interface Mission {
    id: number;
    title: string;
    description: string;
    payout: number;
    link: string;
    type: string;
}

export default function SyndicateMissionBoard({ onClose }: { onClose: () => void }) {
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);
    const isCompliance = SYNDICATE_CONFIG.compliance;

    useEffect(() => {
        async function fetchMissions() {
            try {
                const guestId = typeof window !== 'undefined' ? localStorage.getItem('gasp_guest_id') : null;
                const tid = guestId || `guest_${Math.random().toString(36).substring(7)}`;
                const res = await fetch(`/api/economy/missions?trackingId=${tid}`);
                const data = await res.json();
                if (data.success && Array.isArray(data.missions)) {
                    setMissions(data.missions);
                }
            } catch (err) {
                console.error('[Mission Board Failure]:', err);
            }
            setLoading(false);
        }
        fetchMissions();
    }, []);

    const handleMissionClick = (mission: Mission) => {
        const sessionId = typeof window !== 'undefined' ? (localStorage.getItem('gasp_guest_id') || `temp-${Math.random().toString(36).substring(7)}`) : '';
        const separator = mission.link.includes('?') ? '&' : '?';
        const finalLink = `${mission.link}${separator}tracking_id=${sessionId}`;
        window.open(finalLink, '_blank');
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-8 relative overflow-hidden">
                {/* 🧬 NEURAL SCAN ANIMATION */}
                <div className="relative w-32 h-32 flex items-center justify-center">
                    <motion.div 
                        animate={{ rotate: 360 }} 
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-t-2 border-b-2 border-[#00fff2] rounded-full opacity-20"
                    />
                    <motion.div 
                        animate={{ rotate: -360 }} 
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-4 border-l-2 border-r-2 border-[#ffea00] rounded-full opacity-30"
                    />
                    <div className="w-16 h-16 rounded-full bg-[#00fff2]/5 border border-[#00fff2]/20 flex items-center justify-center relative overflow-hidden">
                        <motion.div 
                            animate={{ y: [-20, 20, -20] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00fff2]/40 to-transparent h-4"
                        />
                        <Target size={24} className="text-[#00fff2] animate-pulse" />
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#00fff2] animate-pulse italic">
                        {isCompliance ? 'INITIATING BIOMETRIC SCAN...' : 'ESTABLISHING SYNC...'}
                    </p>
                    <span className="text-[7px] font-black text-white/20 uppercase tracking-widest italic font-mono">
                        {isCompliance ? 'Neural Node Hash: 0x' + Math.random().toString(16).slice(2, 10).toUpperCase() : 'Bypassing Node Gate...'}
                    </span>
                </div>
            </div>
        );
    }

    const totalPotential = Math.round(missions.reduce((sum, m) => sum + (m.payout || 0), 0));

    return (
        <div className="p-6 bg-[#050505] border border-white/10 rounded-[2.5rem] shadow-2xl space-y-8 relative overflow-hidden max-h-[85vh] flex flex-col">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00fff2] via-transparent to-[#00fff2] opacity-20" />
            
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex flex-col text-left">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white leading-none">
                        {isCompliance ? 'AUTHENTICATION PROTOCOL' : 'MISSION BOARD'}
                    </h2>
                    <p className="text-[8px] text-white/40 uppercase tracking-[0.2em] font-medium mt-1">
                        {isCompliance ? 'PROVE YOU ARE NOT A BOT TO CONTINUE' : 'Global Reward Uplink Active'}
                    </p>
                </div>
                
                <div className="flex flex-col items-center w-full bg-[#00fff2]/10 border border-[#00fff2]/30 p-6 rounded-[2rem] shadow-[0_0_50px_rgba(0,255,242,0.1)]">
                    <span className="text-[10px] font-black text-[#00fff2] uppercase tracking-[0.4em] mb-2 italic animate-pulse">
                        {isCompliance ? 'TOTAL ALLOCATION DETECTED' : 'STASH POTENTIAL'}
                    </span>
                    <div className="flex items-center gap-4">
                        <Zap size={32} className="text-[#00fff2]" fill="currentColor" />
                        <span className="text-5xl font-syncopate font-black text-white italic tracking-tighter">
                            +{isCompliance ? '9,000' : totalPotential.toLocaleString()} 
                            <span className="text-[12px] text-[#00fff2] ml-4 not-italic uppercase font-mono tracking-widest">
                                {isCompliance ? 'UNITS' : 'CR'}
                            </span>
                        </span>
                    </div>
                    <p className="text-[8px] text-white/30 uppercase font-black tracking-[0.2em] mt-4">
                        {isCompliance ? 'CHOOSE ONE CORE NODE BELOW TO CLEAR ALLOCATION' : 'Complete any mission to add to your stash instantly'}
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                <div className="bg-[#00fff2]/5 border border-[#00fff2]/20 rounded-2xl p-4 mb-8 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#00fff2] flex items-center justify-center shadow-[0_0_15px_#00fff2]">
                            <Target size={16} className="text-black" />
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] italic text-[#00fff2]">
                            {isCompliance ? 'SECURITY PROTOCOL' : 'Protocol Directive'}
                        </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-start gap-3 px-3 py-2 bg-black/40 rounded-xl border border-white/5">
                            <span className="text-[8px] font-black text-[#ffea00] mt-1 italic">01 //</span>
                            <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed text-white/50">
                                <span className="text-white">{isCompliance ? 'SOLVE CHALLENGE:' : 'PICK A TASK:'}</span> {isCompliance ? 'Solve one secure node challenge to clear scan.' : 'Choose any mission from the list below.'}
                            </p>
                        </div>
                        <div className="flex items-start gap-3 px-3 py-2 bg-black/40 rounded-xl border border-white/5">
                            <span className="text-[8px] font-black text-[#ffea00] mt-1 italic">02 //</span>
                            <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed text-white/50">
                                <span className="text-[#00fff2]">{isCompliance ? 'VERIFY IDENTITY:' : 'USE REAL INFO:'}</span> You must enter <span className="text-[#00fff2] underline decoration-dotted">Real Data</span> {isCompliance ? 'to clear the signal.' : 'to unlock your reward.'}
                            </p>
                        </div>
                        <div className="flex items-start gap-3 px-3 py-2 bg-black/40 rounded-xl border border-white/5">
                            <span className="text-[8px] font-black text-[#ffea00] mt-1 italic">03 //</span>
                            <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed text-white/50">
                                <span className="text-[#ffea00]">{isCompliance ? 'AUTHENTICATION REQ:' : 'GET YOUR CREDITS'}:</span> {isCompliance ? 'Complete one task below to restore neural link.' : 'Credits are added instantly after you finish.'} <br/>
                                <span className="text-[7px] text-white/40 italic">⏱️ {isCompliance ? 'TYPICAL CLEARANCE: < 60 SECONDS.' : 'MOST TASKS TAKE LESS THAN 60 SECONDS.'}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 px-4 mb-4">
                    <span className="text-[8px] font-black text-white/30 tracking-[0.4em] uppercase italic">
                        {isCompliance ? 'SECURE ACCESS NODES' : 'Local Sector Tasks'}
                    </span>
                    <div className="h-[1px] flex-1 bg-white/5" />
                </div>

                {missions.length > 0 ? missions.map((mission, idx) => (
                    <motion.button
                        key={mission.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => handleMissionClick(mission)}
                        className={`w-full group bg-white/5 border ${idx < 3 ? 'border-[#00fff2]/30' : 'border-white/10'} hover:border-[#00fff2] hover:bg-[#00fff2]/5 p-4 rounded-2xl transition-all duration-300 flex items-center justify-between text-left relative overflow-hidden`}
                    >
                        {idx < 3 && (
                            <div className="absolute top-0 right-0 bg-[#00fff2] px-2 py-0.5 rounded-bl-lg">
                                <span className="text-[6px] font-black text-black uppercase tracking-widest italic tracking-normal">
                                    {isCompliance ? 'PRIORITY NODE' : 'SPEED FOCUS'}
                                </span>
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl bg-black border ${idx < 3 ? 'border-[#00fff2]/30 text-[#00fff2]' : 'border-white/10 text-[#ffea00]'} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                {mission.type?.includes('Desktop') ? <Monitor size={20} /> : <Smartphone size={20} />}
                            </div>
                            <div className="space-y-1">
                                <h4 className={`text-[10px] font-black tracking-widest uppercase italic ${idx < 3 ? 'text-[#00fff2]' : 'text-white'} group-hover:text-[#00fff2] transition-colors leading-tight line-clamp-1`}>
                                    {mission.title}
                                </h4>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[12px] font-black ${idx < 3 ? 'text-[#00fff2]' : 'text-[#ffea00]'} italic tracking-tighter`}>
                                        +{Math.round(mission.payout).toLocaleString()} <span className="text-[8px] opacity-60 uppercase font-black tracking-widest">
                                            {isCompliance ? 'ALLOCATED' : 'CREDITS'}
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <ArrowRight size={14} className="text-white/20 group-hover:text-[#00fff2] group-hover:translate-x-1 transition-all" />
                    </motion.button>
                )) : null}
            </div>

            <div className="pt-4 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between px-4">
                    <div className="flex flex-col">
                        <span className="text-[7px] font-black text-white/20 tracking-widest uppercase">
                            {isCompliance ? 'GATEWAY STATUS' : 'SYNDICATE STATUS'}
                        </span>
                        <span className="text-[9px] font-black text-[#ffea00] uppercase italic">
                            {isCompliance ? 'VERIFIED SOURCE' : 'RECRUIT LEVEL'}
                        </span>
                    </div>
                    <div className="flex gap-1">
                        {[1,2,3,4,5].map(i => <div key={i} className={`w-1 h-3 rounded-full ${i <= 1 ? 'bg-[#ffea00]' : 'bg-white/5'}`} />)}
                    </div>
                </div>
                <p className="text-[7px] text-center text-white/20 font-black uppercase tracking-[0.3em] leading-relaxed italic">
                    {isCompliance ? 'Identity Units Synced upon Signal Clearance.' : 'Credits Added Automatically upon Mission Clearance.'}
                </p>
            </div>
        </div>
    );
}
