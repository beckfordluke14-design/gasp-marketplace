'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Zap, Flame, ShieldCheck, ChevronRight, TrendingUp } from 'lucide-react';

/**
 * 🛰️ SOVEREIGN DASHBOARD: Leaderboard & Allocation Modeler
 * Strategy: Social competition and ROI modeling for high-ticket whales.
 */
export default function SovereignDashboard() {
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modelAmount, setModelAmount] = useState('500');

    // 🌍 GLOBAL LOCALE STATE
    const isSpanish = typeof window !== 'undefined' && localStorage.getItem('gasp_locale') === 'es';

    // 📡 FETCH LIVE RANKINGS
    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await fetch('/api/protocol/leaderboard');
                const data = await res.json();
                if (data.success) setLeaderboard(data.data);
            } catch (e) {
                console.error('[Protocol] Leaderboard Pulse Failure', e);
            }
            setLoading(false);
        };
        fetchLeaderboard();
        const interval = setInterval(fetchLeaderboard, 60000); // 1m Sync
        return () => clearInterval(interval);
    }, []);

    const modelPoints = parseInt(modelAmount, 10) * 100; // Mock calculation for the Modeler

    return (
        <div className="space-y-12 mt-12 mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                
                {/* 🏆 HALL OF SOVEREIGNS (LEADERBOARD) */}
                <div className="bg-white/5 border border-white/10 rounded-[3rem] p-8 md:p-12 space-y-8 relative overflow-hidden backdrop-blur-3xl shadow-2xl">
                    <div className="flex items-center justify-between border-b border-white/10 pb-6 relative z-10">
                        <div className="flex items-center gap-4">
                            <Users size={24} className="text-[#00f0ff]" />
                            <h2 className="text-2xl font-syncopate font-black italic tracking-tighter italic uppercase text-white/80 underline decoration-[#00f0ff]">
                                {isSpanish ? 'Salón de Soberanos' : 'Hall of Sovereigns'}
                            </h2>
                        </div>
                        <span className="text-[8px] font-black uppercase text-white/20 tracking-widest italic animate-pulse">
                            {isSpanish ? 'Clasificación en Vivo Activa 🛰️' : 'Live Ranking Active 🛰️'}
                        </span>
                    </div>

                    <div className="space-y-4 relative z-10">
                        {loading ? (
                            <div className="h-64 flex items-center justify-center text-[10px] uppercase font-black text-white/20 animate-pulse italic tracking-[0.4em]">
                                {isSpanish ? 'Sincronizando Poder de Red...' : 'Synchronizing Network Power...'}
                            </div>
                        ) : (
                            leaderboard.map((op, idx) => (
                                <motion.div 
                                    key={op.id}
                                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                                    className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-3xl group hover:border-[#00f0ff]/40 transition-all cursor-crosshair"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-xl bg-black border border-white/10 flex items-center justify-center text-[10px] font-syncopate font-black italic text-[#00f0ff]">#{idx + 1}</div>
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">OP_{op.identifier}</p>
                                            <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] italic">
                                                {isSpanish ? 'Poder de Red' : 'Network Power'}: {op.power.toLocaleString()} PTS
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-[#ffea00] font-syncopate italic tracking-tighter uppercase leading-none">{op.burnContribution.toLocaleString()}</p>
                                        <p className="text-[6px] font-black text-white/20 uppercase tracking-[0.2em] mt-1 italic">
                                            {isSpanish ? 'Créditos Contribuidos' : 'Credits Contributed'}
                                        </p>
                                    </div>
                                </motion.div>
                            ))
                        )}
                        {(!loading && leaderboard.length === 0) && (
                            <div className="p-12 text-center text-[10px] font-black uppercase tracking-widest text-white/10 italic">
                                {isSpanish ? 'Esperando Primer Apretón de Manos Soberano...' : 'Awaiting First Sovereign Handshake...'}
                            </div>
                        )}
                    </div>
                </div>

                {/* 🧬 ALLOCATION MODELER (CALCULATOR) */}
                <div className="bg-[#ffea00]/5 border border-[#ffea00]/10 rounded-[3rem] p-12 space-y-12 relative overflow-hidden backdrop-blur-3xl shadow-2xl">
                    <div className="space-y-4 relative z-10">
                        <div className="flex items-center gap-4">
                             <TrendingUp size={24} className="text-[#ffea00]" />
                             <h2 className="text-2xl font-syncopate font-black italic tracking-tighter italic uppercase text-white/80 underline decoration-[#ffea00]">
                                {isSpanish ? 'Modelador de Asignación' : 'Allocation Modeler'}
                             </h2>
                        </div>
                        <p className="text-white/20 text-[10px] font-black uppercase leading-relaxed italic tracking-widest">
                            {isSpanish ? 'Modele su peso en el sindicato antes de entrar. Lógica de paridad verificada activa.' : 'Model your syndicate weight before capital entry. verified 1:1 match logic active.'}
                        </p>
                    </div>

                    <div className="space-y-12 relative z-10">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-white/40 tracking-widest italic flex items-center justify-between">
                                {isSpanish ? 'Asignación Objetivo' : 'Target Allocation'} ($USD)
                                <span className="text-[#ffea00] italic">{isSpanish ? 'Paquete Soberano' : 'Sovereign Pack'}</span>
                            </label>
                            <input 
                                type="number" 
                                value={modelAmount}
                                onChange={(e) => setModelAmount(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] p-10 text-4xl font-syncopate font-black italic tracking-tighter text-[#ffea00] outline-none focus:border-[#ffea00] transition-all appearance-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-2 p-6 bg-white/5 rounded-3xl border border-white/5">
                                <p className="text-[8px] font-black uppercase text-white/40 tracking-widest">{isSpanish ? 'Créditos de Utilidad' : 'Utility Credits'}</p>
                                <h4 className="text-2xl font-syncopate font-black italic tracking-tighter text-white">{(parseInt(modelAmount, 10) * 100 || 0).toLocaleString()} <span className="text-[8px] text-white/20 not-italic uppercase">CR</span></h4>
                            </div>
                            <div className="space-y-2 p-6 bg-white/5 rounded-3xl border border-white/5">
                                <p className="text-[8px] font-black uppercase text-white/40 tracking-widest text-[#00f0ff]">{isSpanish ? 'Puntos GASP (Capital)' : 'GASP Points (Equity)'}</p>
                                <h4 className="text-2xl font-syncopate font-black italic tracking-tighter text-[#00f0ff]">{(parseInt(modelAmount, 10) * 100 || 0).toLocaleString()} <span className="text-[8px] text-white/20 not-italic uppercase">PTS</span></h4>
                            </div>
                        </div>

                        <button 
                           onClick={() => {
                               if ((window as any).onSetActiveTab) (window as any).onSetActiveTab('weather');
                               else window.location.href = '/?tab=weather';
                           }}
                           className="w-full flex items-center justify-between p-8 bg-white text-black rounded-[2.5rem] hover:scale-105 active:scale-95 transition-all shadow-2xl group"
                        >
                            <span className="text-xs font-black uppercase tracking-[0.2em]">
                                {isSpanish ? 'Asegurar Esta Asignación ►' : 'Secure This Allocation ►'}
                            </span>
                            <Zap size={24} className="group-hover:rotate-12 transition-transform" />
                        </button>
                    </div>

                    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#ffea00]/10 blur-[80px] rounded-full pointer-events-none" />
                </div>

            </div>
        </div>
    );
}
