'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, User, Clock, Shield, Search, RefreshCcw, Activity, Ghost, Zap, Terminal, Eye, TrendingUp, BarChart3, Target } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface Conversation {
    user_id: string;
    persona_id: string;
    last_message: string;
    last_role: 'user' | 'assistant';
    created_at: string;
    total_messages: number;
    user_messages: number;
    persona_name: string;
    persona_image: string;
}

export default function FunnelIntelDashboard() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedThread, setSelectedThread] = useState<any[] | null>(null);
    const [currentThreadDetails, setCurrentThreadDetails] = useState<any | null>(null);

    const fetchConversations = async (silent = false) => {
        const adminKey = localStorage.getItem('admin_gasp_key');
        if (!silent) setLoading(true);
        try {
            const res = await fetch('/api/admin/audit', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-admin-key': adminKey || ''
                },
                body: JSON.stringify({ action: 'get-funnel-conversations', payload: {} })
            });
            const data = await res.json();
            if (data.success) setConversations(data.conversations);
        } catch (err) {
            console.error('[Funnel Intel] Failure:', err);
        } finally {
            setLoading(false);
        }
    };

    const viewThread = async (conv: any) => {
        const adminKey = localStorage.getItem('admin_gasp_key');
        setIsRefreshing(true);
        setCurrentThreadDetails(conv);
        try {
            const res = await fetch('/api/admin/audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey || '' },
                body: JSON.stringify({ action: 'get-thread', payload: { user_id: conv.user_id, persona_id: conv.persona_id } })
            });
            const data = await res.json();
            if (data.success) setSelectedThread(data.messages);
        } catch (err) {
            console.error('Thread Fetch Failure:', err);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchConversations();
        const interval = setInterval(() => fetchConversations(true), 15000);
        return () => clearInterval(interval);
    }, []);

    const filtered = conversations.filter(c => 
        c.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.persona_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.last_message.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Analysis Stats
    const totalLeads = conversations.length;
    const highIntentCount = conversations.filter(c => c.user_messages >= 3).length;
    const wallHitCount = conversations.filter(c => c.user_messages >= 5).length;

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-outfit pb-32">
            
            {/* 🛰️ HEADER: FUNNEL INTEL COMMAND */}
            <header className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-syncopate font-bold uppercase italic tracking-tighter leading-none text-white drop-shadow-[0_0_30px_rgba(255,165,0,0.2)]">
                        Funnel <span className="text-[#ffea00]">Intel</span>
                    </h1>
                    <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] text-white/30 flex items-center gap-3">
                        <Target size={14} className="text-[#ffea00] animate-pulse" /> High-Intent Conversion Stream • Ad Spend Monitoring
                    </p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#ffea00] transition-colors" size={16} />
                        <input 
                            type="text"
                            placeholder="TRACE LEAD ID / CAPTION"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-xs font-bold tracking-widest focus:outline-none focus:border-[#ffea00]/50 transition-all placeholder:text-white/10"
                        />
                    </div>
                    
                    <button 
                        onClick={() => fetchConversations()}
                        disabled={isRefreshing}
                        className={`p-4 rounded-2xl transition-all ${isRefreshing ? 'bg-[#ffea00]/20 text-[#ffea00]' : 'bg-[#ffea00] text-black hover:scale-105 shadow-[0_0_30px_rgba(255,234,0,0.3)]'}`}
                    >
                        <RefreshCcw size={20} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                    <Link href="/admin">
                       <button className="h-14 px-8 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/60">
                          EXIT
                       </button>
                    </Link>
                </div>
            </header>

            <main className="max-w-7xl mx-auto">
                {/* 📊 MACRO INTEL: Conversion Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                   <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-2">
                       <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Total Ad Leads</p>
                       <h2 className="text-4xl font-syncopate font-black text-white">{totalLeads}</h2>
                       <div className="flex items-center gap-2 text-[9px] font-black text-green-500 uppercase">
                          <TrendingUp size={12} /> Live Capture Active
                       </div>
                   </div>
                   <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-2">
                       <p className="text-[10px] font-black uppercase tracking-widest text-[#ffea00]/60">Engaged Leads (3+ msgs)</p>
                       <h2 className="text-4xl font-syncopate font-black text-[#ffea00]">{highIntentCount}</h2>
                       <p className="text-[9px] font-black text-white/20 uppercase tracking-widest italic">
                          {totalLeads > 0 ? ((highIntentCount / totalLeads) * 100).toFixed(1) : 0}% Engagement Rate
                       </p>
                   </div>
                   <div className="p-8 rounded-[2.5rem] bg-[#ff00ff]/5 border border-[#ff00ff]/20 space-y-2">
                       <p className="text-[10px] font-black uppercase tracking-widest text-[#ff00ff]/60">Paywall Hits (5+ msgs)</p>
                       <h2 className="text-4xl font-syncopate font-black text-[#ff00ff]">{wallHitCount}</h2>
                       <p className="text-[9px] font-black text-[#ff00ff]/40 uppercase tracking-widest italic animate-pulse">
                          Crucial Conversion Point
                       </p>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* 📡 CONVERSATION STREAM */}
                    <div className="lg:col-span-2 space-y-6">
                        {loading && !conversations.length ? (
                            <div className="py-20 flex flex-col items-center gap-6 opacity-30 text-center">
                               <div className="w-16 h-16 border-4 border-[#ffea00] border-t-transparent rounded-full animate-spin" />
                               <p className="text-[10px] font-black uppercase tracking-[0.5em]">Harvesting Funnel Intel...</p>
                            </div>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {filtered.map((conv, idx) => {
                                    const isSelected = currentThreadDetails?.user_id === conv.user_id && currentThreadDetails?.persona_id === conv.persona_id;
                                    
                                    return (
                                        <motion.div
                                            key={`${conv.user_id}-${conv.persona_id}`}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            onClick={() => viewThread(conv)}
                                            className={`group relative bg-black/40 border ${isSelected ? 'border-[#ffea00] shadow-[0_0_50px_rgba(255,234,0,0.1)]' : 'border-white/5'} rounded-[2.5rem] p-6 md:p-8 backdrop-blur-3xl hover:border-[#ffea00]/20 transition-all cursor-pointer overflow-hidden`}
                                        >
                                            <div className="relative flex flex-col md:flex-row gap-8 items-start">
                                                <div className="flex-1 space-y-4 w-full text-left">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2.5 rounded-xl bg-[#ffea00]/10 text-[#ffea00] border border-[#ffea00]/20">
                                                                <Target size={16} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Ad Lead Profile</p>
                                                                <p className="text-xs font-bold font-mono tracking-tight text-[#ffea00]">{conv.user_id}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Time Captured</p>
                                                            <div className="flex items-center gap-2 justify-end">
                                                                <Clock size={12} className="text-white/20" />
                                                                <p className="text-[10px] font-bold text-white/60">{new Date(conv.created_at).toLocaleTimeString()}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 relative">
                                                        <div className="absolute top-4 left-4">
                                                            <p className={`text-[8px] font-black uppercase tracking-[0.2em] ${conv.last_role === 'user' ? 'text-[#ffea00]' : 'text-white/40'}`}>
                                                                {conv.last_role === 'user' ? 'USER RESPONSE' : 'SYSTEM PUSH'}
                                                            </p>
                                                        </div>
                                                        <p className="text-sm leading-relaxed text-white/60 pt-6 italic italic-clamp-2">
                                                            {conv.last_message}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex items-center gap-2">
                                                                <MessageSquare size={12} className="text-white/20" />
                                                                <p className="text-[9px] font-black uppercase tracking-widest text-white/20">
                                                                    {conv.total_messages} msgs ({conv.user_messages} from user)
                                                                </p>
                                                            </div>
                                                            {conv.user_messages >= 5 && (
                                                                <span className="text-[8px] bg-[#ff00ff]/10 text-[#ff00ff] border border-[#ff00ff]/20 px-2 py-1 rounded-full font-black uppercase tracking-widest animate-pulse">
                                                                    PAYWALL ACTIVE
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                           <p className="text-[10px] font-black uppercase tracking-tighter italic text-white/60">{conv.persona_name}</p>
                                                           <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10">
                                                              <img src={conv.persona_image} className="w-full h-full object-cover grayscale" />
                                                           </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        )}
                    </div>

                    {/* 🕵️ THREAD DEEP DIVE */}
                    <div className="relative h-full">
                       <div className="sticky top-12 h-[calc(100vh-12rem)]">
                          <AnimatePresence mode="wait">
                             {selectedThread ? (
                                 <motion.div
                                    key={`${currentThreadDetails.user_id}-thread`}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="h-full bg-black/60 border border-white/10 rounded-[2.5rem] flex flex-col overflow-hidden backdrop-blur-3xl"
                                 >
                                    <div className="p-8 border-b border-white/5 flex items-center justify-between bg-[#ffea00]/5">
                                       <div>
                                          <h3 className="text-[10px] font-syncopate font-black uppercase tracking-widest text-[#ffea00]">Lead Analysis</h3>
                                          <p className="text-[8px] font-mono text-[#ffea00]/40 mt-1 uppercase tracking-widest">{currentThreadDetails.user_id}</p>
                                       </div>
                                       <button onClick={() => setSelectedThread(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/20">
                                          EXIT
                                       </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                                       {selectedThread.map((msg: any, mIdx: number) => (
                                          <div key={mIdx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                             <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${
                                                msg.role === 'user' 
                                                ? 'bg-white/5 border border-white/10 text-white/80 rounded-br-none' 
                                                : 'bg-[#ffea00]/10 border border-[#ffea00]/20 text-[#ffea00] rounded-bl-none'
                                             }`}>
                                                {msg.content}
                                             </div>
                                          </div>
                                       ))}
                                    </div>

                                    <div className="p-8 bg-white/[0.01] border-t border-white/5">
                                       <div className="flex items-center justify-between">
                                          <div>
                                             <p className="text-[8px] text-white/20 uppercase font-black tracking-widest leading-none">Status</p>
                                             <p className="text-xs font-bold text-white uppercase tracking-tighter italic">
                                                {currentThreadDetails.user_messages >= 5 ? 'High Value Target' : 'Incubating'}
                                             </p>
                                          </div>
                                          <div className="text-right">
                                             <p className="text-[8px] text-white/20 uppercase font-black tracking-widest leading-none">Retention</p>
                                             <p className="text-xs font-bold text-[#ffea00] uppercase">{currentThreadDetails.user_messages} Interactions</p>
                                          </div>
                                       </div>
                                    </div>
                                 </motion.div>
                             ) : (
                                 <div className="h-full border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-12 opacity-20 group hover:opacity-100 transition-opacity">
                                    <BarChart3 size={40} className="mb-6 text-white/40 group-hover:text-[#ffea00] transition-colors" />
                                    <h3 className="text-[10px] font-syncopate font-black uppercase tracking-widest">Awaiting Lead Target...</h3>
                                    <p className="text-[8px] uppercase font-black tracking-widest mt-4 leading-relaxed">Select an ad-captured lead <br /> to audit the conversion flow</p>
                                 </div>
                             )}
                          </AnimatePresence>
                       </div>
                    </div>
                </div>
            </main>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 234, 0, 0.1); border-radius: 10px; }
                .italic-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
            `}</style>
        </div>
    );
}
