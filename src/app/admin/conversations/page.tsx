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

    async function fetchConversations() {
        const adminKey = localStorage.getItem('admin_gasp_key');
        setIsRefreshing(true);
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
            if (data.success) {
                setConversations(data.conversations);
            }
        } catch (e) {
            console.error('[Conversations] Neural Sync Failure:', e);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }

    useEffect(() => {
        fetchConversations();
        const interval = setInterval(fetchConversations, 10000); // 10s auto-refresh
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
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-8">
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
                        onClick={fetchConversations}
                        disabled={isRefreshing}
                        className={`p-4 rounded-2xl transition-all ${isRefreshing ? 'bg-[#ff00ff]/20 text-[#ff00ff]' : 'bg-[#ff00ff] text-black hover:scale-105 shadow-[0_0_30px_rgba(255,0,255,0.3)]'}`}
                    >
                        <RefreshCcw size={20} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-6">
                    <Zap size={40} className="text-[#ff00ff] animate-pulse" />
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Establishing Uplink...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filtered.map((conv, idx) => {
                            const isGuest = conv.user_id.startsWith('guest-');
                            const timeAgo = new Date(conv.created_at).toLocaleTimeString();
                            
                            return (
                                <motion.div 
                                    key={`${conv.user_id}-${conv.persona_id}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group relative bg-black/40 border border-white/5 rounded-[2.5rem] p-6 md:p-8 backdrop-blur-3xl hover:border-[#ff00ff]/20 transition-all shadow-2xl overflow-hidden"
                                >
                                    {/* Abstract Background Glow */}
                                    <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-[#ff00ff]/5 blur-[120px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="relative flex flex-col md:flex-row gap-8 items-start">
                                        
                                        {/* Operative Sync (User Info) */}
                                        <div className="flex-1 space-y-4 w-full">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2.5 rounded-xl ${isGuest ? 'bg-white/5 text-white/40' : 'bg-green-500/10 text-green-400'} border border-white/10`}>
                                                        {isGuest ? <Ghost size={16} /> : <Shield size={16} />}
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Target Operative</p>
                                                        <p className={`text-xs font-bold font-mono tracking-tight ${isGuest ? 'text-white/60' : 'text-green-400 text-shadow-[0_0_10px_rgba(34,197,94,0.3)]'}`}>
                                                            {conv.user_id}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Activity</p>
                                                    <div className="flex items-center gap-2 justify-end">
                                                        <Clock size={12} className="text-white/20" />
                                                        <p className="text-[10px] font-bold text-white/60">{timeAgo}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 relative group/msg">
                                                <div className="absolute top-4 left-4">
                                                    <p className={`text-[8px] font-black uppercase tracking-[0.2em] ${conv.last_role === 'user' ? 'text-[#ff00ff]' : 'text-[#00f0ff]'}`}>
                                                        {conv.last_role === 'user' ? 'INCOMING SIGNAL' : 'OUTGOING RESPONSE'}
                                                    </p>
                                                </div>
                                                <p className="text-sm md:text-base leading-relaxed text-white/80 pt-6">
                                                    {conv.last_message}
                                                </p>
                                                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <MessageSquare size={12} className="text-white/20" />
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/20">
                                                            Session Intelligence: {conv.total_messages} messages ({conv.user_messages} user)
                                                        </p>
                                                    </div>
                                                    {conv.user_messages >= 5 && isGuest && (
                                                        <span className="text-[8px] bg-red-500/20 text-red-500 px-2 py-1 rounded-full font-black uppercase tracking-widest animate-pulse">
                                                            GUEST WALL HIT
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Asset Interlink (Persona Info) */}
                                        <div className="w-full md:w-64 flex flex-row md:flex-col items-center gap-4 p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 self-center md:self-stretch justify-center">
                                            <div className="relative w-20 h-20 md:w-24 md:h-24">
                                                {conv.persona_image ? (
                                                    <Image 
                                                        src={conv.persona_image} 
                                                        alt={conv.persona_name}
                                                        fill
                                                        className="rounded-2xl object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full rounded-2xl bg-white/5 flex items-center justify-center text-white/20">
                                                        <User size={32} />
                                                    </div>
                                                )}
                                                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-black border border-white/10 flex items-center justify-center shadow-2xl">
                                                    <Zap size={14} className="text-[#ff00ff]" fill="currentColor" />
                                                </div>
                                            </div>
                                            <div className="text-center md:text-center text-left">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Sovereign Node</p>
                                                <p className="text-sm font-bold uppercase tracking-tighter italic text-white group-hover:text-[#ff00ff] transition-colors">
                                                    {conv.persona_name || 'ORPHAN NODE'}
                                                </p>
                                            </div>
                                        </div>

                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {filtered.length === 0 && (
                        <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem]">
                            <Ghost size={40} className="text-white/10 mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">No active neural bridges detected.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
