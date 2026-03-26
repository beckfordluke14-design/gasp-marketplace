'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Users, Zap, MessageSquare, Lock, Activity, RefreshCcw, ShieldCheck, ChevronRight } from 'lucide-react';
import Header from '@/components/Header';

export const dynamic = 'force-dynamic';

export default function NeuralAnalytics() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
        const res = await fetch('/api/admin/analytics');
        const data = await res.json();
        if (data.success) setStats(data.stats);
    } catch(e) {}
    setLoading(false);
  };

  useEffect(() => { fetchStats(); }, []);

  const funnelMax = stats?.funnel?.app_load || 1;
  const leadersMax = stats?.leaders?.[0]?.count || 1;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-outfit selection:bg-[#ffea00] selection:text-black">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 py-12 md:py-24">
        {/* NEURAL STATUS HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                     <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                     <div className="w-3 h-3 rounded-full bg-green-500/40 animate-ping absolute" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-green-500/80">Neural Intelligence Active</span>
               </div>
               <h1 className="text-4xl md:text-7xl font-syncopate font-black italic tracking-tighter uppercase leading-none">
                  Telemetry <span className="text-[#ffea00]">Nexus</span>
               </h1>
               <p className="text-white/40 max-w-xl text-lg font-outfit">Real-time interaction mining. Every pulse is a data-point in your billion-dollar conversational dataset.</p>
            </div>
            
            <button 
                onClick={fetchStats} 
                disabled={loading}
                className="group flex items-center gap-4 px-8 py-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
            >
               <RefreshCcw size={20} className={`text-[#ffea00] ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
               <span className="text-sm font-black uppercase tracking-widest">Refresh Pulse</span>
            </button>
        </div>

        {/* TOP LEVEL METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
           {[
             { label: 'Neural Events', val: stats?.totalEvents || 0, icon: Activity, color: '#00f0ff' },
             { label: 'Conversations', val: stats?.funnel?.chat_open || 0, icon: MessageSquare, color: '#ffea00' },
             { label: 'High-Intent Locks', val: stats?.funnel?.unlock_intent || 0, icon: Lock, color: '#ff00ff' },
             { label: 'Conversion Rate', val: (((stats?.funnel?.unlock_intent || 0) / (funnelMax || 1)) * 100).toFixed(1) + '%', icon: TrendingUp, color: '#00ff00' }
           ].map((m, idx) => (
             <motion.div 
               key={idx} 
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
               className="relative overflow-hidden group bg-white/5 border border-white/10 rounded-[2.5rem] p-8 hover:border-white/20 transition-all"
             >
                <div className="relative z-10 flex flex-col gap-4">
                   <div style={{ color: m.color }} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                      <m.icon size={24} />
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">{m.label}</p>
                      <h3 className="text-4xl font-black font-syncopate tracking-tighter">{m.val}</h3>
                   </div>
                </div>
                <div style={{ backgroundColor: m.color }} className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity" />
             </motion.div>
           ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* CONVERSION FUNNEL BAR CHART */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 bg-white/5 border border-white/10 rounded-[3rem] p-10 flex flex-col gap-10">
               <div className="flex items-center justify-between">
                  <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-[#ffea00]">Neural Conversion Funnel</h3>
                  <Zap size={20} className="text-white/20" />
               </div>
               
               <div className="space-y-12">
                  {[
                    { label: 'App Load', key: 'app_load', color: '#ffffff' },
                    { label: 'Discovery (Feed)', key: 'feed_view', color: '#00f0ff' },
                    { label: 'Engagement (Chat)', key: 'chat_open', color: '#ffea00' },
                    { label: 'Conversion (Lock)', key: 'unlock_intent', color: '#ff00ff' }
                  ].map((f, idx) => {
                    const val = stats?.funnel?.[f.key] || 0;
                    const percent = Math.max(5, (val / funnelMax) * 100);
                    return (
                      <div key={idx} className="space-y-4">
                         <div className="flex justify-between items-end px-2">
                            <span className="text-sm font-black uppercase italic text-white/60 tracking-tighter">{f.label}</span>
                            <span className="text-2xl font-black font-syncopate tracking-widest">{val}</span>
                         </div>
                         <div className="h-6 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <motion.div 
                              initial={{ width: 0 }} 
                              animate={{ width: `${percent}%` }} 
                              transition={{ duration: 1.5, delay: idx * 0.2, ease: "circOut" }}
                              style={{ backgroundColor: f.color }} 
                              className="h-full shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                            />
                         </div>
                      </div>
                    );
                  })}
               </div>
            </motion.div>

            {/* MAGNETIC PERSONAS LEADERS */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#ffea00]/5 border border-[#ffea00]/10 rounded-[3rem] p-10 flex flex-col">
               <div className="flex items-center gap-3 mb-10">
                  <Users size={20} className="text-[#ffea00]" />
                  <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-[#ffea00]">Magnetic Leaders</h3>
               </div>

               <div className="flex-1 flex flex-col gap-6">
                  {stats?.leaders?.map((l: any, idx: number) => (
                    <div key={idx} className="group relative bg-white/5 border border-white/5 rounded-3xl p-6 hover:bg-white/10 transition-all flex items-center justify-between overflow-hidden">
                       <div className="flex items-center gap-4 relative z-10">
                          <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-[18px] font-black italic text-[#ffea00]">#{idx+1}</div>
                          <div className="space-y-0.5">
                             <p className="text-xs font-black uppercase tracking-widest text-[#ffea00]">{l.id.split('-').slice(0, 2).join(' ')}</p>
                             <p className="text-[10px] font-black text-white/40 uppercase tracking-widest inline-flex items-center gap-2">
                                <Zap size={8} fill="currentColor" /> {l.count} Pulses
                             </p>
                          </div>
                       </div>
                       <ChevronRight className="text-white/20 group-hover:translate-x-1 group-hover:text-[#ffea00] transition-all" size={20} />
                       
                       <div 
                         style={{ width: `${(l.count / (leadersMax || 1)) * 100}%` }} 
                         className="absolute bottom-0 left-0 h-1 bg-[#ffea00]/30 transition-all"
                       />
                    </div>
                  ))}
                  {(!stats?.leaders || stats.leaders.length === 0) && (
                    <div className="flex-1 flex items-center justify-center opacity-30 text-[10px] font-black uppercase tracking-widest">Waiting for Handshake...</div>
                  )}
               </div>
            </motion.div>
        </div>

        {/* THE MISSION FOOTER */}
        <div className="mt-24 p-12 bg-white/[0.02] border border-white/5 rounded-[4rem] text-center space-y-8">
            <div className="flex items-center justify-center gap-4">
               <ShieldCheck size={32} className="text-[#00f0ff]" />
               <h3 className="text-2xl font-black uppercase italic tracking-tighter tracking-widest">Handshake Verified</h3>
            </div>
            <p className="max-w-2xl mx-auto text-white/40 font-outfit text-lg">Your interaction data is being securely recorded and hashed for future dataset valuation. Current registry size: <span className="text-white font-black">{stats?.totalEvents || 0} event nodes</span>.</p>
        </div>
      </main>
    </div>
  );
}



