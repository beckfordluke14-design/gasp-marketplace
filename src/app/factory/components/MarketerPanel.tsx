'use client';

import { useState, useEffect } from 'react';
import { Target, TrendingUp, BarChart3, Zap, MapPin, Search, UserPlus, RefreshCcw, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MarketerPanel({ onBirth }: { onBirth?: () => void }) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);

  const fetchMarketAlpha = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/factory/marketer');
      const data = await res.json();
      setAnalysis(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketAlpha();
  }, []);

  const handleStrategicDeployment = async () => {
    if (!analysis || isDeploying) return;
    setIsDeploying(true);
    try {
      const res = await fetch('/api/factory/marketer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vibe_hint: analysis.recommended_birth_vibe })
      });
      if (res.ok) {
        if (onBirth) onBirth();
        fetchMarketAlpha(); // Refresh after birth
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      {/* ── HEADER DRIVER ── */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="space-y-2">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <BarChart3 className="text-blue-400" size={20} />
                </div>
                <div>
                   <h2 className="text-2xl md:text-3xl font-syncopate font-black uppercase italic tracking-tighter text-white">
                      Market <span className="text-blue-400">Alpha</span>
                   </h2>
                   <p className="text-[9px] text-white/30 uppercase tracking-[0.4em]">Strategic Revenue Intelligence</p>
                </div>
            </div>
        </div>
        <button 
          onClick={fetchMarketAlpha}
          disabled={loading}
          className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/50 flex items-center gap-2 transition-all"
        >
          <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Markets
        </button>
      </div>

      {loading ? (
        <div className="h-[400px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Zap size={48} className="text-blue-500 animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Scanning Global Pulse...</p>
            </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ── LEFT: VERDICT ENGINE ── */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* THE MASTER VERDICT */}
            <div className="bg-gradient-to-br from-blue-600/20 to-transparent border border-blue-500/30 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-1000">
                  <Target size={120} />
               </div>
               
               <div className="relative z-10 space-y-8">
                  <div className="space-y-2">
                     <span className="px-3 py-1 bg-blue-500 text-black text-[9px] font-black uppercase tracking-widest rounded-full">AI Verdict</span>
                     <h3 className="text-2xl md:text-3xl font-syncopate font-black uppercase leading-tight text-white drop-shadow-2xl italic">
                        {analysis.market_verdict}
                     </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="bg-black/40 border border-white/5 rounded-2xl p-6 space-y-1">
                        <p className="text-[8px] text-white/20 uppercase tracking-widest font-black">Target Niche</p>
                        <p className="text-lg font-syncopate font-black text-blue-400 uppercase italic">{analysis.target_niche}</p>
                     </div>
                     <div className="bg-black/40 border border-white/5 rounded-2xl p-6 space-y-1">
                        <p className="text-[8px] text-white/20 uppercase tracking-widest font-black">Target Culture</p>
                        <p className="text-lg font-syncopate font-black text-white uppercase italic">{analysis.target_race}</p>
                     </div>
                  </div>

                  <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                     <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <ShieldCheck size={14} className="text-green-500" />
                           <p className="text-[10px] font-black uppercase text-green-500/80">Governance Lock: Active</p>
                        </div>
                        <p className="text-[9px] text-white/30 uppercase tracking-widest">{analysis.scarcity_advice}</p>
                     </div>

                     <button 
                        onClick={handleStrategicDeployment}
                        disabled={isDeploying}
                        className="bg-blue-500 hover:bg-blue-400 text-black px-10 py-5 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] shadow-[0_20px_60px_-15px_rgba(59,130,246,0.6)] flex items-center justify-center gap-3 active:scale-95 transition-all"
                     >
                        {isDeploying ? <RefreshCcw className="animate-spin" /> : <UserPlus size={18} />}
                        Execute Strategic Deployment
                     </button>
                  </div>
               </div>
            </div>

            {/* RAW PULSE LOG */}
            <div className="bg-black/40 border border-white/5 rounded-[2rem] p-8 space-y-4">
               <div className="flex items-center gap-3">
                  <Search size={16} className="text-white/20" />
                  <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">Real-Time Search Ingest</h4>
               </div>
               <p className="text-sm font-outfit text-white/60 lowercase italic leading-relaxed">
                  "... {analysis.raw_pulse} ..."
               </p>
            </div>
          </div>

          {/* ── RIGHT: PERFORMANCE STATS ── */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-8">
               <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Top Performers</h4>
                  <TrendingUp size={16} className="text-green-500" />
               </div>

               <div className="space-y-4">
                  {analysis.performance_leads?.map((id: string, idx: number) => (
                    <div key={id} className="group flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl hover:border-blue-500/50 transition-all cursor-pointer">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-black italic">
                             #{idx + 1}
                          </div>
                          <div>
                             <p className="text-[10px] font-black uppercase text-white tracking-widest">{id}</p>
                             <p className="text-[8px] text-white/30 uppercase tracking-widest">Active Node</p>
                          </div>
                       </div>
                       <ArrowRight size={14} className="text-white/20 group-hover:text-blue-500 transition-transform group-hover:translate-x-1" />
                    </div>
                  ))}
               </div>

               <div className="pt-6 border-t border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                     <p className="text-[9px] text-white/20 uppercase tracking-widest">Total Strategic Nodes</p>
                     <p className="text-xl font-syncopate font-black text-white/70">X-00{analysis.total_active_nodes || 1}</p>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-500 w-1/3 animate-pulse" />
                  </div>
               </div>
            </div>

            {/* UPCOMING TRENDS PREDICTION */}
            <div className="bg-gradient-to-b from-[#ffea00]/10 to-transparent border border-[#ffea00]/20 rounded-[2.5rem] p-8 space-y-4">
               <div className="flex items-center gap-2">
                  <Zap size={14} className="text-[#ffea00]" />
                  <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#ffea00]">Emerging Trends</h4>
               </div>
               <div className="space-y-3">
                  <p className="text-[10px] text-white/50 leading-relaxed font-outfit lowercase italic">
                     Japanese Street Fashion (Harajuku) is spiking in male-centric search queries. Recommended Asian Style pivot for Q2.
                  </p>
               </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
