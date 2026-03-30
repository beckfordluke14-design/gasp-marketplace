'use client';

import { useEffect, useState } from 'react';
import { Cloud, Globe, Loader2, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 🕵️‍♂️ ATMOSPHERIC TERMINAL: Weather Prediction Indicator
 * Tactical widget displaying aviation weather and prediction market data.
 * Focused entirely on Sector Atmospheric Trends for high-status members.
 */

export default function MarketPulseTerminal() {
  const [sectors, setSectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const fetchIntel = async () => {
       try {
          const res = await fetch('/api/intel/weather');
          const json = await res.json();
          if (json.success) setSectors(json.sectors);
       } catch (e) {}
       setLoading(false);
    };

    fetchIntel();
    const interval = setInterval(fetchIntel, 300000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
     if (sectors.length === 0) return;
     const scroll = setInterval(() => {
        setIndex((i) => (i + 1) % sectors.length);
     }, 8000);
     return () => clearInterval(scroll);
  }, [sectors]);

  if (loading) return (
     <div className="mx-6 p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3 animate-pulse">
        <Loader2 size={12} className="animate-spin text-white/20" />
        <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/10">Syncing Sector Hub...</span>
     </div>
  );

  if (sectors.length === 0) return null;

  const current = sectors[index];

  return (
    <div className="mx-6 mb-8 mt-2">
       <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
             <Globe size={11} className="text-[#00f0ff] animate-pulse" />
             <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#00f0ff] italic">Sector Atmosphere</span>
          </div>
          <div className="flex items-center gap-1.5 p-1 px-2 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/20">
             <div className="w-1 h-1 rounded-full bg-[#00f0ff] animate-pulse shadow-[0_0_8px_#00f0ff]" />
             <span className="text-[6px] font-black text-[#00f0ff] uppercase tracking-tighter">METAR Signal</span>
          </div>
       </div>

       <AnimatePresence mode="wait">
          <motion.div 
            key={current.sector}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.5 }}
            className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-4 hover:border-white/10 transition-all group overflow-hidden relative"
          >
             <div className="flex items-start justify-between relative z-10">
                <div className="flex flex-col">
                   <span className="text-[7px] font-black uppercase tracking-[0.2em] text-white/20 italic mb-1">{current.sector} Indicator</span>
                   <span className="text-xl font-syncopate font-black italic tracking-tighter text-white">
                      {current.temp}°C
                   </span>
                </div>
                <div className="p-2 bg-white/5 rounded-xl text-white/40">
                   <Cloud size={14} />
                </div>
             </div>

             <div className="flex items-center justify-between pt-3 border-t border-white/5 relative z-10">
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-ping" />
                   <span className="text-[10px] font-black text-white italic tracking-tighter">Signal Accuracy: <span className="text-[#00f0ff]">{current.prediction}%</span></span>
                </div>
                <span className="text-[8px] font-black text-[#ffea00] uppercase tracking-widest italic animate-pulse">Live Alpha</span>
             </div>
          </motion.div>
       </AnimatePresence>

       <p className="text-[7px] text-white/10 uppercase font-black italic tracking-widest mt-3 px-1">
          Atmospheric Analysis fulfilled by AllTheseFlows Strategic Media LLC.
       </p>
    </div>
  );
}
