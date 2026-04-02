'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RadioReceiver, Activity, Globe, Share2, CornerRightUp, Zap, Clock, Loader2 } from 'lucide-react';

interface NewsPost {
    id: string;
    persona_id: string;
    persona_name: string;
    persona_image: string;
    title: string;
    content: string;
    created_at: string;
    meta?: {
        heat?: 'Standard' | 'High' | 'Critical';
        source?: string;
        city?: string;
        persona_note?: string;
    };
}

export default function NewsFeed() {
    const [news, setNews] = useState<NewsPost[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNews = async () => {
        try {
            const res = await fetch('/api/news');
            if (res.ok) {
                const data = await res.json();
                setNews(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error('News load fail', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNews();
    }, []);

    if (loading) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-black gap-6">
            <Loader2 size={40} className="text-[#ff00ff] animate-spin" />
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[.5em]">Syncing Intelligence...</span>
        </div>
    );

    return (
        <div className="h-full w-full overflow-y-auto overflow-x-hidden flex flex-col pt-20 px-4 md:px-8 pb-32 no-scrollbar">
             <header className="mb-12 text-center md:text-left flex flex-col md:flex-row md:items-end md:justify-between gap-6 px-4">
                <div>
                   <h1 className="text-4xl md:text-5xl font-outfit font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#ff00ff] to-white/50 flex items-center gap-4">
                       GASP <span className="text-white">REPORTS</span>
                   </h1>
                   <p className="text-white/30 text-[9px] font-black mt-2 uppercase tracking-[0.4em] flex items-center gap-2">
                       <RadioReceiver size={12} className="animate-pulse text-[#ff00ff]" /> Global Intel Transmissions
                   </p>
                </div>
            </header>

            <div className="flex flex-col gap-12 max-w-4xl mx-auto w-full">
                {news.length === 0 ? (
                    <div className="p-20 text-center border border-dashed border-white/5 rounded-[3rem]">
                        <p className="text-white/20 uppercase text-[10px] font-black tracking-widest italic">Awaiting Next Sync Cycle...</p>
                    </div>
                ) : (
                    news.map((item, i) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="group relative bg-[#0a0a0a] border border-white/5 p-8 md:p-12 rounded-[3rem] hover:border-[#ff00ff]/20 transition-all duration-500"
                        >
                            {/* Persona Header */}
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                                    <img src={item.persona_image || '/placeholder.jpg'} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase text-white tracking-widest">{item.persona_name}</span>
                                    <span className="text-[8px] font-black text-[#ff00ff] uppercase tracking-[0.2em] italic">{item.meta?.city || 'Global Hub'} Analyst</span>
                                </div>
                                <div className="ml-auto text-white/20 text-[8px] font-black uppercase tracking-widest italic">
                                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>

                            {/* Note Handshake */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#ff00ff] animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#ff00ff] italic">
                                    {item.persona_name} SHARED A NOTE
                                </span>
                            </div>

                            <h2 className="text-2xl md:text-4xl font-syncopate font-black italic uppercase tracking-tighter mb-8 leading-tight group-hover:text-white transition-colors">
                                {item.title}
                            </h2>
                            
                            <p className="text-white/60 text-sm md:text-base font-outfit leading-relaxed mb-10 max-w-2xl border-l-2 border-[#ff00ff]/20 pl-8 bg-white/[0.02] py-6 rounded-r-3xl">
                                {item.content}
                            </p>

                            <button 
                                onClick={() => {
                                    const profileObj = {
                                        id: item.persona_id,
                                        name: item.persona_name,
                                        image: item.persona_image,
                                        city: item.meta?.city || 'Global Hub',
                                    };
                                    (window as any).onSelectProfile?.(item.persona_id, '', profileObj);
                                }}
                                className="w-full h-16 rounded-2xl bg-[#ff00ff]/5 border border-[#ff00ff]/20 flex items-center justify-center gap-3 hover:bg-[#ff00ff]/10 hover:border-[#ff00ff]/40 transition-all group/btn"
                            >
                                <Zap size={14} className="text-[#ff00ff] animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white italic">
                                    CHAT W/ {item.persona_name} FOR DEEP-DIVE ANALYSIS
                                </span>
                                <CornerRightUp size={14} className="text-[#ff00ff] group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                            </button>

                            <div className="flex items-center justify-between mt-10 pt-8 border-t border-white/5">
                                <div className="flex items-center gap-2 px-4 py-2 bg-black rounded-full border border-white/5 text-[8px] font-black text-white/30 uppercase tracking-widest">
                                    <Activity size={10} className="text-[#ffea00]" /> SIGNAL VERIFIED: {item.meta?.city || 'HQ'}
                                </div>
                                <div className="flex items-center gap-4">
                                     <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white transition-all">
                                         <Share2 size={16} />
                                     </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
