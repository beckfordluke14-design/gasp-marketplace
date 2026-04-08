'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RadioReceiver, Activity, Globe, Share2, CornerRightUp, Zap, Clock, Loader2, MessageSquare } from 'lucide-react';
import Link from "next/link";

interface NewsPost {
    id: string;
    persona_id: string;
    persona_name: string;
    persona_image: string;
    persona_city: string;
    persona_age: string | number;
    content_url: string;
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

/**
 * 🛰️ SOVEREIGN NEWS TERMINAL v8.8 // MULTI-LOCALE GLOBAL FEED
 * Strategy: Institutional Intelligence Feed with 100% Bilingual Sync (EN/ES).
 */
export default function NewsFeed() {
    const [news, setNews] = useState<NewsPost[]>([]);
    const [loading, setLoading] = useState(true);

    const [isSpanish, setIsSpanish] = useState(false);

    useEffect(() => {
        setIsSpanish(localStorage.getItem('gasp_locale') === 'es');
    }, []);

    const fetchNews = async () => {
        try {
            const res = await fetch('/api/news');
            if (res.ok) {
                const data = await res.json();
                setNews(Array.isArray(data.posts) ? data.posts : []);
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

    // 🎯 NEURAL JUMP: Auto-scroll to specific ID from Twitter
    useEffect(() => {
        if (!loading && news.length > 0) {
            const params = new URLSearchParams(window.location.search);
            const targetId = params.get('id');
            if (targetId) {
                setTimeout(() => {
                    const el = document.getElementById(`news-${targetId}`);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // Add a subtle highlight flash
                        el.style.borderColor = '#ff00ff';
                        setTimeout(() => el.style.borderColor = '', 2000);
                    }
                }, 500);
            }
        }
    }, [loading, news]);

    if (loading) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-black gap-6">
            <Loader2 size={40} className="text-[#ff00ff] animate-spin" />
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[.5em]">
                {isSpanish ? 'Sincronizando Inteligencia...' : 'Syncing Intelligence...'}
            </span>
        </div>
    );

    return (
        <div className="h-full w-full overflow-y-auto overflow-x-hidden flex flex-col pt-20 px-4 md:px-8 pb-32 no-scrollbar">
            <header className="mb-12 text-center md:text-left flex flex-col md:flex-row md:items-end md:justify-between gap-6 px-4">
                <div className="flex flex-col">
                   <h1 className="text-4xl md:text-5xl font-outfit font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#ff00ff] to-white/50 flex items-center gap-4">
                       GASP <span className="text-white">{isSpanish ? 'NOTICIAS' : 'NEWS'}</span>
                   </h1>
                   <div className="flex items-center gap-2 mt-2">
                       <RadioReceiver size={12} className="animate-pulse text-[#ff00ff]" /> 
                       <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.4em] italic">
                            {isSpanish ? 'Inteligencia de Mercado Global' : 'Global Market Intelligence'}
                       </p>
                   </div>
                </div>
            </header>

            <div className="flex flex-col gap-12 max-w-4xl mx-auto w-full">
                {news.length === 0 ? (
                    <div className="p-20 text-center border border-dashed border-white/5 rounded-[3rem]">
                        <p className="text-white/20 uppercase text-[10px] font-black tracking-widest italic">
                            {isSpanish ? 'Esperando Siguiente Ciclo de Sincronización...' : 'Awaiting Next Sync Cycle...'}
                        </p>
                    </div>
                ) : (
                    news.map((item, i) => (
                        <motion.div
                            key={item.id}
                            id={`news-${item.id}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`group relative bg-[#0a0a0a] border p-8 md:p-12 rounded-[3.5rem] transition-all duration-500 ${item.meta?.heat === 'Critical' ? 'border-[#ff00ff]/40 shadow-[0_0_50px_rgba(255,0,255,0.1)]' : 'border-white/5 hover:border-[#ff00ff]/20'}`}
                        >
                            {/* 🛰️ BREAKING NEURAL FLASH */}
                            {item.meta?.heat === 'Critical' && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30">
                                    <div className="bg-[#ff00ff] text-white text-[8px] font-black uppercase tracking-[0.6em] px-10 py-2 rounded-full shadow-[0_0_40px_#ff00ff] animate-bounce italic whitespace-nowrap">
                                        {isSpanish ? 'SEÑAL CRÍTICA' : 'CRITICAL SIGNAL'}
                                    </div>
                                </div>
                            )}
                            {/* Persona Header */}
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 shrink-0 bg-white/5">
                                    {(item.persona_image || '').toLowerCase().endsWith('.mp4') ? (
                                        <video src={item.persona_image} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                                    ) : (
                                        <img src={item.persona_image || '/placeholder.jpg'} alt="" className="w-full h-full object-cover transition-all duration-500" />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-black uppercase text-white tracking-widest leading-none">
                                        {item.persona_name}{item.persona_age ? `, ${item.persona_age}` : ''}
                                    </span>
                                </div>
                                <div className="ml-auto text-white/20 text-[8px] font-black uppercase tracking-widest italic font-mono">
                                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
                                </div>
                            </div>

                            {/* Activity Status */}
                            <div className="flex items-center gap-3 mb-6 opacity-80">
                                <div className="h-[1px] w-6 bg-gradient-to-r from-[#ff00ff] to-transparent" />
                                <span className="text-[10px] font-black uppercase text-[#ff00ff] tracking-[0.3em] italic flex items-center gap-2">
                                    <Share2 size={12} />
                                    {isSpanish ? `${item.persona_name} DESPACHÓ UN BLURB DE GASP` : `${item.persona_name} DISPATCHED A GASP BLURB`}
                                </span>
                            </div>

                            <a 
                                href={item.content_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block group/title"
                            >
                                <h2 className="text-3xl md:text-5xl font-syncopate font-black italic uppercase tracking-tighter mb-8 leading-tight group-hover/title:text-[#00f0ff] transition-colors text-white/90">
                                    {item.title}
                                </h2>
                            </a>
                            
                            <p className="text-white/60 text-sm md:text-lg font-outfit leading-relaxed mb-10 max-w-3xl border-l border-white/10 pl-8 py-2">
                                {item.content}
                            </p>

                            <div className="flex flex-col md:flex-row gap-4">
                                <a 
                                    href={item.content_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 h-16 rounded-xl bg-white text-black flex items-center justify-center gap-3 hover:bg-[#00f0ff] transition-all font-syncopate font-black italic text-[10px] tracking-widest uppercase shadow-xl active:scale-[0.98]"
                                >
                                    {isSpanish ? 'LEER FUENTE' : 'READ SOURCE'}
                                    <CornerRightUp size={16} />
                                </a>

                                <button 
                                    onClick={() => {
                                        const profileObj = {
                                            id: item.persona_id,
                                            name: item.persona_name,
                                            image: item.persona_image,
                                            city: item.persona_city || 'Global Hub',
                                        };
                                        (window as any).onSelectProfile?.(item.persona_id, '', profileObj);
                                    }}
                                    className="px-8 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-3 hover:bg-white/10 transition-all text-white/40 hover:text-white uppercase text-[9px] font-black tracking-widest italic"
                                >
                                    <MessageSquare size={16} />
                                    {isSpanish ? `CHAT CON ${item.persona_name.split(' ')[0]}` : `CHAT W/ ${item.persona_name.split(' ')[0]}`}
                                </button>
                            </div>

                            <div className="flex items-center justify-between mt-12 pt-8 border-t border-white/5">
                                <div className="flex items-center gap-3 px-6 py-2 bg-black rounded-full border border-white/5 text-[8px] font-black text-white/30 uppercase tracking-[0.3em] italic">
                                    <Activity size={12} className="text-[#ffea00]" /> SIGNAL VERIFIED: {item.meta?.city || 'SOVEREIGN_NODE'}
                                </div>
                                <div className="flex items-center gap-4">
                                     <button className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/20 hover:text-white transition-all hover:bg-white/10 group/share">
                                         <Share2 size={18} className="group-hover/share:scale-110 transition-transform" />
                                     </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
                {/* 🛡️ COMPLIANCE FOOTER */}
                <div className="mt-20 py-12 border-t border-white/5 flex flex-col items-center gap-6">
                    <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                        <Link href="/terms" className="hover:text-[#ff00ff] transition-colors">Terms</Link>
                        <Link href="/privacy" className="hover:text-[#ff00ff] transition-colors">Privacy</Link>
                        <Link href="/refunds" className="hover:text-[#ff00ff] transition-colors">Refunds</Link>
                        <Link href="/contact" className="hover:text-[#ff00ff] transition-colors">Contact</Link>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/10 italic">
                        © 2026 Gasp Syndicate // Sovereign Intelligence Archive
                    </span>
                </div>
            </div>
        </div>
    );
}
