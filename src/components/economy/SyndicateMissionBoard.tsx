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
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 border-2 border-[#ffea00] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_#ffea0044]" />
                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[#ffea00] animate-pulse italic">
                    {isCompliance ? 'ESTABLISHING SECURE SIGNAL...' : 'Syncing Syndicate Feed...'}
                </p>
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
                
                <div className="flex flex-col items-end">
                    <div className="bg-[#00fff2]/10 border border-[#00fff2]/30 px-3 py-1 rounded-lg">
                        <span className="text-[8px] font-black text-[#00fff2] uppercase tracking-widest block text-right italic">
                            {isCompliance ? 'TOTAL ALLOCATION' : 'Stash Potential'}
                        </span>
                        <span className="text-sm font-black text-white italic">+{totalPotential.toLocaleString()} <span className="text-[10px] text-[#00fff2]">
                            {isCompliance ? 'UNITS' : 'CREDITS'}
                        </span></span>
                    </div>
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
                                <span className="text-white">{isCompliance ? 'SELECT GATEWAY:' : 'PICK A TASK:'}</span> {isCompliance ? 'Choose any verification node below.' : 'Choose any mission from the list below.'}
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
                                <span className="text-[#ffea00]">{isCompliance ? 'SECURE SYNC REQUIRED' : 'GET YOUR CREDITS'}:</span> {isCompliance ? 'Allocation units matched upon signal clearance.' : 'Credits are added instantly after you finish.'} <br/>
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
