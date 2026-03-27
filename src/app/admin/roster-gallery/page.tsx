'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { proxyImg } from '@/lib/profiles';
import { LayoutGrid, Zap, Lock, Eye, Trash2 } from 'lucide-react';
import Header from '@/components/Header';

export const dynamic = 'force-dynamic';

interface PersonaSummary {
  id: string;
  name: string;
  seed_image_url: string;
  is_active: boolean;
  city: string;
  // Vault data will be fetched per persona or merged
}

export default function RosterGallery() {
  const [roster, setRoster] = useState<PersonaSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoster();
  }, []);

  async function fetchRoster() {
    console.log('🏁 Fetching Master Roster Gallery (Service Route)...');
    try {
        // 🛰️ SERVICE API: Use personas?all=true to see everything
        const res = await fetch('/api/personas?all=true');
        const json = await res.json();
        
        if (json.success) {
           setRoster(json.personas || []);
        }
    } catch (e) {
        console.error('[Roster] Pulse Failure:', e);
    }
    setLoading(false);
  }

  if (loading) return <div className="h-screen bg-black flex flex-col items-center justify-center gap-6 text-[#ffea00] font-black uppercase tracking-[0.5em]"><Zap size={40} className="animate-spin" /><span>Syncing Roster...</span></div>;

  const [deadIds, setDeadIds] = useState(new Set<string>());
  return (
    <div className="min-h-screen bg-[#050505] text-white font-outfit">
      <Header onOpenTopUp={() => {}} deadIds={deadIds} setDeadIds={setDeadIds} />
      
      <div className="pt-40 px-6 pb-40 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-16 gap-8">
            <div className="text-center sm:text-left">
                <h1 className="text-4xl sm:text-6xl font-syncopate font-black italic uppercase tracking-tighter">Neural <span className="text-[#ffea00]">Roster</span></h1>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mt-4 leading-none italic">Global Identity Audit: Active + Hibernating Nodes</p>
            </div>
            <div className="flex gap-4">
               <div className="px-10 py-5 bg-white/[0.03] rounded-[2rem] border border-white/10 flex flex-col items-center backdrop-blur-3xl shadow-2xl">
                  <span className="text-[28px] font-syncopate font-black italic text-[#ffea00] leading-none mb-2">{roster.length}</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Authorized Nodes</span>
               </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {roster.map((p, idx) => (
                <motion.div 
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className={`p-6 bg-white/[0.02] border rounded-[3rem] backdrop-blur-3xl flex flex-col gap-6 group transition-all relative overflow-hidden ${p.is_active ? 'border-white/10 hover:border-[#ffea00]/30 shadow-2xl' : 'border-red-500/10 grayscale opacity-40 hover:opacity-100 hover:grayscale-0'}`}
                >
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    {/* Main Identity */}
                    <div className="flex gap-6 items-start relative z-10">
                        <div className={`w-32 h-44 rounded-3xl overflow-hidden border-2 shrink-0 bg-black relative shadow-2xl transition-all ${p.is_active ? 'border-[#ffea00]/20 group-hover:border-[#ffea00]/50 group-hover:scale-105' : 'border-red-500/20'}`}>
                             {p.seed_image_url?.toLowerCase().endsWith('.mp4') ? (
                                <video src={proxyImg(p.seed_image_url)} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                             ) : (
                                <img src={proxyImg(p.seed_image_url || '/v1.png')} className="w-full h-full object-cover" onError={(e: any) => e.target.src = '/icons/icon-512x512.png'} />
                             )}
                             {!p.is_active && (
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center p-2 backdrop-blur-sm">
                                    <span className="text-[7px] font-black uppercase text-white/40 tracking-widest">Hibernating</span>
                                </div>
                             )}
                        </div>
                        <div className="flex-1 space-y-4">
                            <div className="space-y-1">
                                <h3 className={`text-2xl font-syncopate font-black italic uppercase tracking-tighter leading-none transition-colors ${p.is_active ? 'text-white group-hover:text-[#ffea00]' : 'text-white/20'}`}>{p.name || 'Anonymous'}</h3>
                                <p className="text-[8px] font-black uppercase text-[#ffea00] tracking-widest opacity-60 italic">{p.city}</p>
                            </div>
                            <p className="text-[10px] font-mono text-white/30 uppercase truncate bg-black/60 p-3 rounded-2xl border border-white/5 shadow-inner tracking-tighter">{p.id}</p>
                            <div className="flex gap-3">
                                {p.is_active ? (
                                  <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-500 text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5"><Zap size={8} fill="currentColor" /> Live Node</span>
                                ) : (
                                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/20 text-[8px] font-black uppercase tracking-widest">Retired</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-2 pt-2 border-t border-white/5">
                        <a href={`/admin/audit?p=${p.id}`} className="text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-[#00f0ff] transition-colors flex items-center gap-2 italic">Audit Node <LayoutGrid size={12}/></a>
                        <a href={`/admin/profiles?id=${p.id}`} className="text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-[#ff00ff] transition-colors flex items-center gap-2 italic">Architect <Zap size={12}/></a>
                    </div>
                </motion.div>
            ))}
        </div>
      </div>
    </div>
  );
}
