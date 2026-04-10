'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, Mail, MessageSquare, Clock, Globe, 
  Terminal, Search, User, Filter, ChevronRight, X, AlertOctagon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 🛠️ SYNDICATE SUPPORT COMMAND CENTER v1.0
 * High-status administrative dashboard for triage.
 * Audits all JSON manifests from the Support Black Box.
 */

export default function SupportAdminPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/support/logs');
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets);
      }
    } catch (e) {}
    setIsLoading(false);
  };

  const filteredTickets = tickets.filter(t => 
    t.email?.toLowerCase().includes(search.toLowerCase()) || 
    t.userId?.toLowerCase().includes(search.toLowerCase()) ||
    t.problem?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#080808] text-white p-6 md:p-10 selection:bg-[#ffea00]/30 selection:text-white">
      {/* 🚀 HEADER BRIDGE */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff00ff] to-[#7c3aed] flex items-center justify-center shadow-[0_0_20px_rgba(255,0,255,0.2)]">
                <ShieldCheck size={24} className="text-white" />
             </div>
             <div>
                <h1 className="text-3xl font-black uppercase italic tracking-tighter">Support Command</h1>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">GASP INTERNAL TRIAGE</span>
             </div>
          </div>
        </div>
        
        <div className="relative group w-full md:w-96">
           <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#ffea00] transition-colors" />
           <input 
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             placeholder="Search IDs, Emails, Problems..."
             className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm focus:outline-none focus:border-[#ffea00]/40 transition-all font-medium"
           />
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 🛰️ TICKET GRID */}
        <div className="lg:col-span-12 xl:col-span-8 space-y-4">
          {isLoading ? (
             <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-[#ffea00]/20 border-t-[#ffea00] rounded-full animate-spin" />
             </div>
          ) : filteredTickets.length === 0 ? (
             <div className="p-20 bg-white/5 rounded-[2.5rem] border border-white/5 text-center flex flex-col items-center gap-4 text-white/20">
                <AlertOctagon size={48} />
                <p className="font-black uppercase tracking-[0.2em]">No Manifests Detected</p>
             </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTickets.map((t, i) => (
                  <motion.button 
                    key={t.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-6 bg-white/[0.03] border rounded-[2rem] text-left hover:bg-white/5 transition-all group relative overflow-hidden ${selectedTicket?.id === t.id ? 'border-[#ffea00]/50 bg-white/5' : 'border-white/5'}`}
                  >
                     <div className="flex items-start justify-between mb-6">
                        <div className="flex flex-col gap-1">
                           <span className="text-[11px] font-black text-white/40 uppercase tracking-widest">{new Date(t.timestamp).toLocaleString()}</span>
                           <h4 className="text-lg font-black text-white leading-tight pr-10 truncate max-w-[200px]">{t.email || t.userId}</h4>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20 group-hover:text-white transition-colors">
                           <ChevronRight size={18} />
                        </div>
                     </div>
                     <p className="text-[13px] text-white/60 font-medium line-clamp-2 leading-relaxed mb-6">
                        {t.problem || t.messages?.[1]?.content || 'Empty Intel'}
                     </p>
                     <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-1.5 grayscale opacity-40">
                           <Globe size={12} className="text-white" />
                           <span className="text-[9px] font-bold text-white uppercase tracking-tighter">{t.metadata?.ip?.slice(0, 10) || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 grayscale opacity-40">
                           <Terminal size={12} className="text-white" />
                           <span className="text-[9px] font-bold text-white uppercase tracking-tighter">{t.metadata?.platform || 'WEB'}</span>
                        </div>
                     </div>
                  </motion.button>
                ))}
             </div>
          )}
        </div>

        {/* 🕵️ DETAIL COMMAND PANELS (Float or Column) */}
        <AnimatePresence>
          {selectedTicket && (
            <motion.div 
               initial={{ opacity: 0, x: 100 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 100 }}
               className="lg:col-span-12 xl:col-span-4 space-y-6"
            >
               <div className="sticky top-10 flex flex-col gap-6">
                  {/* Intel Summary */}
                  <div className="p-8 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                     <button onClick={() => setSelectedTicket(null)} className="absolute top-6 right-6 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                        <X size={16} />
                     </button>
                     <div className="flex flex-col gap-8">
                        <div>
                           <h3 className="text-[10px] font-black uppercase text-[#ffea00] tracking-[0.3em] mb-3">MANIFEST DATA</h3>
                           <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                 <Mail size={16} className="text-white/40" />
                                 <span className="text-sm font-bold text-white tracking-tight">{selectedTicket.email || 'Anonymous Guest'}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                 <User size={16} className="text-white/40" />
                                 <span className="text-xs font-mono font-bold text-white/60 tracking-tighter select-all">{selectedTicket.userId}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                 <Clock size={16} className="text-white/40" />
                                 <span className="text-[11px] font-black text-white/40 uppercase tracking-widest">{new Date(selectedTicket.timestamp).toLocaleString()}</span>
                              </div>
                           </div>
                        </div>

                        <div>
                           <h3 className="text-[10px] font-black uppercase text-white/40 tracking-[0.3em] mb-4">CHAT ARCHIVE</h3>
                           <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                              {selectedTicket.messages?.map((m: any, i: number) => (
                                 <div key={i} className={`flex flex-col gap-1.5 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <span className="text-[8px] font-black uppercase text-white/20 tracking-widest">{m.role}</span>
                                    <div className={`p-4 rounded-2xl text-xs leading-relaxed max-w-[90%] ${m.role === 'user' ? 'bg-white text-black font-semibold' : 'bg-white/5 text-white/80 border border-white/10'}`}>
                                       {m.content}
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>

                        <div className="pt-6 border-t border-white/10">
                           <a 
                             href={`mailto:${selectedTicket.email}`}
                             className="w-full flex items-center justify-center gap-3 py-4 bg-[#ffea00] text-black font-black uppercase text-xs tracking-[0.2em] rounded-2xl hover:bg-white transition-all active:scale-95 shadow-xl"
                           >
                              <MessageSquare size={16} />
                              Reach Out Now
                           </a>
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
