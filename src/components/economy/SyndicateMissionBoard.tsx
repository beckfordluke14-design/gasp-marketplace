'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, Sparkles, ArrowRight, Target, Globe, Smartphone, Monitor } from 'lucide-react';

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

    useEffect(() => {
        async function fetchMissions() {
            try {
                const guestId = typeof window !== 'undefined' ? localStorage.getItem('gasp_guest_id') : null;
                const tid = guestId || `guest_${Math.random().toString(36).substring(7)}`;
                const res = await fetch(`/api/economy/missions?trackingId=${tid}`);
                const data = await res.json();
                if (data.success) {
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
                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[#ffea00] animate-pulse italic">Syncing Syndicate Feed...</p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-[#050505] border border-white/10 rounded-[2.5rem] shadow-2xl space-y-8 relative overflow-hidden max-h-[85vh] flex flex-col">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ffea00] via-transparent to-[#ffea00] opacity-20" />
            
            <div className="text-center space-y-1">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">MISSION BOARD</h2>
                <div className="flex items-center justify-center gap-2">
                    <div className="px-3 py-0.5 bg-[#ffea00]/5 border border-[#ffea00]/20 rounded-full flex items-center gap-1.5">
                        <Globe size={8} className="text-[#ffea00]" />
                        <span className="text-[7px] font-black text-[#ffea00] tracking-[0.2em] uppercase italic">LIVE NODE UPLINK ACTIVE</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {missions.length > 0 ? missions.map((mission, idx) => (
                    <motion.button
                        key={mission.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => handleMissionClick(mission)}
                        className={`w-full group bg-white/5 border ${idx < 3 ? 'border-[#00fff2]/30 shadow-[0_0_20px_rgba(0,255,242,0.05)]' : 'border-white/10'} hover:border-[#00fff2] hover:bg-[#00fff2]/5 p-4 rounded-2xl transition-all duration-300 flex items-center justify-between text-left relative overflow-hidden`}
                    >
                        {/* ⚡️ FASTEST BADGE */}
                        {idx < 3 && (
                            <div className="absolute top-0 right-0 bg-[#00fff2] px-2 py-0.5 rounded-bl-lg">
                                <span className="text-[6px] font-black text-black uppercase tracking-widest italic">60s COMPLETION</span>
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
                                    <span className={`text-[7px] font-black ${idx < 3 ? 'text-[#00fff2] bg-[#00fff2]/10 border-[#00fff2]/20' : 'text-[#ffea00] bg-[#ffea00]/10 border-[#ffea00]/20'} tracking-widest uppercase px-2 py-0.5 rounded-md italic shadow-[0_0_10px_rgba(0,255,242,0.2)] border`}>
                                        +{(mission.payout % 1 <= 0.5 ? Math.floor(mission.payout) : Math.ceil(mission.payout)) * 1000} $GASP REWARD
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <ArrowRight size={14} className="text-white/20 group-hover:text-[#00fff2] group-hover:translate-x-1 transition-all" />
                    </motion.button>
                )) : (
                    <div className="py-20 text-center opacity-40">
                        <div className="relative w-12 h-12 mx-auto mb-6">
                            <Target size={48} className="absolute inset-0 text-[#00fff2] animate-ping opacity-20" />
                            <Target size={48} className="absolute inset-0 text-white/10" />
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] italic leading-relaxed text-[#00fff2]">
                            Tactical Node Scanning...<br/>
                            <span className="text-white/40">Refreshing Sector in 05:00</span>
                        </p>
                    </div>
                )}
            </div>

            <div className="pt-4 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between px-4">
                    <div className="flex flex-col">
                        <span className="text-[7px] font-black text-white/20 tracking-widest uppercase">SYNDICATE STATUS</span>
                        <span className="text-[9px] font-black text-[#ffea00] uppercase italic">RECRUIT LEVEL</span>
                    </div>
                    <div className="flex gap-1">
                        {[1,2,3,4,5].map(i => <div key={i} className={`w-1 h-3 rounded-full ${i <= 1 ? 'bg-[#ffea00]' : 'bg-white/5'}`} />)}
                    </div>
                </div>
                <p className="text-[7px] text-center text-white/20 font-black uppercase tracking-[0.3em] leading-relaxed italic">
                    Credits Infused Automatically upon Mission Clearance.
                </p>
            </div>
        </div>
    );
}
