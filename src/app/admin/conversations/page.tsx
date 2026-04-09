'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, User, Clock, Shield, Search, RefreshCcw, Activity, Ghost, Zap } from 'lucide-react';
import Image from 'next/image';

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

export default function ConversationMonitor() {
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
                body: JSON.stringify({ action: 'get-conversations', payload: {} })
            });
            const data = await res.json();
            if (data.success) setConversations(data.conversations);
        } catch (err) {
            console.error('Pulse Failure:', err);
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

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-outfit selection:bg-[#ff00ff]/30 selection:text-white pb-32">
            
            {/* 🛰️ HEADER DISPATCH */}
            <header className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-syncopate font-bold uppercase italic tracking-tighter leading-none text-white drop-shadow-[0_0_30px_rgba(255,0,255,0.2)]">
                        Neural <span className="text-[#ff00ff]">Pulse</span>
                    </h1>
                    <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] text-white/30 flex items-center gap-3">
                        <Activity size={14} className="text-[#ff00ff] animate-pulse" /> Live Conversation Stream • Sovereign Monitoring
                    </p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#ff00ff] transition-colors" size={16} />
                        <input 
                            type="text"
                            placeholder="OPERATIVE ID / PERSONA / KEYWORD"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-xs font-bold tracking-widest focus:outline-none focus:border-[#ff00ff]/50 transition-all placeholder:text-white/10"
                        />
                    </div>
                    
                    <button 
                        onClick={() => fetchConversations()}
                        disabled={isRefreshing}
                        className={`p-4 rounded-2xl transition-all ${isRefreshing ? 'bg-[#ff00ff]/20 text-[#ff00ff]' : 'bg-[#ff00ff] text-black hover:scale-105 shadow-[0_0_30px_rgba(255,0,255,0.3)]'}`}
                    >
                        <RefreshCcw size={20} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                    <Link href="/admin">
                       <button className="h-14 px-8 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                          <Activity size={16} /> Exit
                       </button>
                    </Link>
                </div>
            </header>

            <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 📡 CONVERSATION STREAM */}
                <div className="lg:col-span-2 space-y-6">
                    {loading && !conversations.length ? (
                        <div className="py-20 flex flex-col items-center gap-6 opacity-30 text-center">
                           <div className="w-16 h-16 border-4 border-[#ff00ff] border-t-transparent rounded-full animate-spin" />
                           <p className="text-[10px] font-black uppercase tracking-[0.5em]">Syncing Neural Buffer...</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {filtered.map((conv, idx) => {
                                const isGuest = conv.user_id.startsWith('guest-');
                                const isSelected = currentThreadDetails?.user_id === conv.user_id && currentThreadDetails?.persona_id === conv.persona_id;
                                
                                return (
                                    <motion.div
                                        key={`${conv.user_id}-${conv.persona_id}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        onClick={() => viewThread(conv)}
                                        className={`group relative bg-black/40 border ${isSelected ? 'border-[#ff00ff] shadow-[0_0_50px_rgba(255,0,255,0.1)]' : 'border-white/5'} rounded-[2.5rem] p-6 md:p-8 backdrop-blur-3xl hover:border-[#ff00ff]/20 transition-all cursor-pointer overflow-hidden`}
                                    >
                                        <div className="relative flex flex-col md:flex-row gap-8 items-start">
                                            <div className="flex-1 space-y-4 w-full text-left">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2.5 rounded-xl ${isGuest ? 'bg-white/5 text-white/40' : 'bg-green-500/10 text-green-400'} border border-white/10`}>
                                                            {isGuest ? <Ghost size={16} /> : <Shield size={16} />}
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Target Operative</p>
                                                            <p className="text-xs font-bold font-mono tracking-tight text-white/60">{conv.user_id}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Activity</p>
                                                        <div className="flex items-center gap-2 justify-end">
                                                            <Clock size={12} className="text-white/20" />
                                                            <p className="text-[10px] font-bold text-white/60">{new Date(conv.created_at).toLocaleTimeString()}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 relative">
                                                    <div className="absolute top-4 left-4">
                                                        <p className={`text-[8px] font-black uppercase tracking-[0.2em] ${conv.last_role === 'user' ? 'text-[#ff00ff]' : 'text-[#00f0ff]'}`}>
                                                            {conv.last_role === 'user' ? 'INCOMING SIGNAL' : 'OUTGOING RESPONSE'}
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
                                                                {conv.total_messages} msgs ({conv.user_messages} user)
                                                            </p>
                                                        </div>
                                                        {conv.user_messages >= 5 && isGuest && (
                                                            <span className="text-[8px] bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-1 rounded-full font-black uppercase tracking-widest animate-pulse">
                                                                GUEST WALL HIT
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                       <p className="text-[10px] font-black uppercase tracking-tighter italic text-[#ff00ff]">{conv.persona_name}</p>
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

                    {filtered.length === 0 && !loading && (
                        <div className="py-20 flex flex-col items-center justify-center opacity-30 text-center">
                            <Ghost size={40} className="mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-[0.4em]">No active neural bridges detected.</p>
                        </div>
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
                                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                   <div>
                                      <h3 className="text-[10px] font-syncopate font-black uppercase tracking-widest text-[#ff00ff]">Neural Thread</h3>
                                      <p className="text-[8px] font-mono text-white/40 mt-1 uppercase tracking-widest">{currentThreadDetails.user_id}</p>
                                   </div>
                                   <button onClick={() => setSelectedThread(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                      <RefreshCcw size={14} className="text-white/40" />
                                   </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                                   {selectedThread.map((msg: any, mIdx: number) => (
                                      <div key={mIdx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                         <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${
                                            msg.role === 'user' 
                                            ? 'bg-white/5 border border-white/10 text-white/80 rounded-br-none' 
                                            : 'bg-[#ff00ff]/10 border border-[#ff00ff]/20 text-[#ff00ff] rounded-bl-none'
                                         }`}>
                                            {msg.content}
                                            {msg.media_url && (
                                               <div className="mt-2 rounded-lg overflow-hidden border border-white/10">
                                                  <img src={msg.media_url} className="w-full grayscale h-32 object-cover" />
                                               </div>
                                            )}
                                         </div>
                                         <p className="text-[7px] font-black uppercase tracking-widest text-white/10 mt-2">
                                            {new Date(msg.created_at).toLocaleTimeString()}
                                         </p>
                                      </div>
                                   ))}
                                </div>

                                <div className="p-8 bg-white/[0.01] border-t border-white/5">
                                   <div className="flex items-center justify-between">
                                      <div>
                                         <p className="text-[8px] text-white/20 uppercase font-black tracking-widest">Persona</p>
                                         <p className="text-xs font-bold text-white uppercase tracking-tighter italic">{currentThreadDetails.persona_name}</p>
                                      </div>
                                      <div className="text-right">
                                         <p className="text-[8px] text-white/20 uppercase font-black tracking-widest text-shadow-[0_0_10px_#00f0ff]">Sync Index</p>
                                         <p className="text-xs font-bold text-[#00f0ff] uppercase">{currentThreadDetails.user_messages}/5</p>
                                      </div>
                                   </div>
                                </div>
                             </motion.div>
                         ) : (
                             <div className="h-full border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-12 opacity-20 group hover:opacity-100 transition-opacity">
                                <Terminal size={40} className="mb-6 text-white/40 group-hover:text-[#ff00ff] transition-colors" />
                                <h3 className="text-[10px] font-syncopate font-black uppercase tracking-widest">Awaiting Command...</h3>
                                <p className="text-[8px] uppercase font-black tracking-widest mt-4 leading-relaxed">Select a session to <br /> decrypt the thread</p>
                             </div>
                         )}
                      </AnimatePresence>
                   </div>
                </div>
            </main>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 0, 255, 0.1); border-radius: 10px; }
            `}</style>
        </div>
    );
}

// 🛰️ IMPORTS MISSING FROM BOTCHED EDIT
import { Ghost, Shield, Zap, RefreshCcw, Terminal, Search, Clock, Eye, MessageSquare, Activity } from 'lucide-react';
import Link from 'next/link';
