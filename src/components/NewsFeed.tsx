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
    };
}

export default function NewsFeed() {
    const [news, setNews] = useState<NewsPost[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNews = async () => {
        try {
            const res = await fetch('/api/news');
            if (res.ok) {
                const data = await res.ok ? await res.json() : [];
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
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[.5em]">Syncing Neural Transmisssions...</span>
        </div>
    );

    return (
        <div className="h-full w-full overflow-y-auto overflow-x-hidden flex flex-col pt-20 px-4 md:px-8 pb-32">
             <header className="mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                   <h1 className="text-4xl md:text-5xl font-outfit font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#ff00ff] to-white/50 flex items-center gap-4">
                       Neural <span className="text-white">Reports</span>
                   </h1>
                   <p className="text-white/40 text-[10px] font-mono mt-2 uppercase tracking-[0.3em] flex items-center gap-2">
                       <RadioReceiver size={14} className="animate-pulse text-[#ff00ff]" /> Global Intelligence Transmissions
                   </p>
                </div>
                
                <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[8px] font-black uppercase text-white/60">Brave Search Active</span>
                    </div>
                </div>
            </header>

            <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
                {news.length === 0 ? (
                    <div className="p-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                        <p className="text-white/20 uppercase text-xs font-black tracking-widest italic">Awaiting Next Sync Cycle...</p>
                    </div>
                ) : (
                    news.map((item, i) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="group relative bg-white/5 border border-white/10 p-8 md:p-12 rounded-[2.5rem] hover:bg-white/10 hover:border-[#ff00ff]/30 transition-all duration-500"
                        >
                            {/* Heat level badge */}
                            <div className="absolute top-8 right-8 flex items-center gap-2">
                                <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${item.meta?.heat === 'Critical' ? 'bg-red-500/20 text-red-500 border-red-500/30' : item.meta?.heat === 'High' ? 'bg-[#ff00ff]/20 text-[#ff00ff] border-[#ff00ff]/30' : 'bg-white/10 text-white/40 border-white/20'}`}>
                                    {item.meta?.heat || 'Standard'} Priority
                                </div>
                            </div>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                                    <img src={item.persona_image || '/placeholder.jpg'} alt="" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase text-[#ff00ff] tracking-widest">{item.persona_name}</span>
                                    <span className="text-[8px] font-mono text-white/30 tracking-[0.2em]">{item.meta?.city || 'Global Hub'} Analyst</span>
                                </div>
                                <div className="ml-auto flex items-center gap-2 text-white/20 text-[9px] font-mono uppercase italic">
                                    <Clock size={10} /> {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>

                            <h2 className="text-3xl md:text-5xl font-outfit font-black italic uppercase tracking-tighter mb-8 group-hover:text-white transition-colors">
                                {item.title}
                            </h2>
                            
                            <p className="text-white/70 text-base md:text-lg font-mono leading-relaxed mb-10 whitespace-pre-wrap max-w-3xl">
                                {item.content}
                            </p>

                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-10 border-t border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-black/40 rounded-full border border-white/10 text-[9px] font-black text-white/60 uppercase tracking-widest">
                                        <Zap size={10} className="text-[#ffea00]" /> Signal Verified: {item.meta?.city || 'HQ'}
                                    </div>
                                    <a href={item.meta?.source || '#'} target="_blank" className="text-white/20 hover:text-white transition-colors p-2 underline text-[8px] font-mono tracking-widest">
                                        Source Logs
                                    </a>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <button className="w-10 h-10 rounded-full bg-white/5 hover:bg-[#ff00ff]/20 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#ff00ff] transition-all">
                                        <Share2 size={16} />
                                    </button>
                                    <button className="px-6 py-2.5 bg-[#ff00ff] text-white rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(255,0,255,0.4)] hover:scale-105 transition-all">
                                        Analyze Arbitrage <CornerRightUp size={14} />
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
