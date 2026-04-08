'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    RadioReceiver, 
    Activity, 
    Globe, 
    Share2, 
    CornerRightUp, 
    Zap, 
    Clock, 
    Loader2, 
    MessageSquare,
    Lock,
    Shield
} from 'lucide-react';
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
    persona_meta?: {
        persona_note?: string;
        heat?: 'Standard' | 'High' | 'Critical';
        source?: string;
        city?: string;
    };
    meta?: any;
}

interface NewsFeedProps {
    onSelectProfile?: (id: string) => void;
}

export default function NewsFeed({ onSelectProfile }: NewsFeedProps) {
    const [news, setNews] = useState<NewsPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNews, setSelectedNews] = useState<NewsPost | null>(null);
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
                        setTimeout(() => (el as HTMLElement).style.borderColor = '', 2000);
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
        <div className="h-full w-full overflow-y-auto overflow-x-hidden flex flex-col pt-44 md:pt-20 px-4 md:px-8 pb-32 no-scrollbar">
            
            {/* 🎭 INTEL THEATER (OVERLAY) */}
            <AnimatePresence>
                {selectedNews && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] flex items-start md:items-center justify-center p-0 pt-44 md:p-12"
                    >
                        <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={() => setSelectedNews(null)} />
                        
                        <motion.div 
                            initial={{ scale: 0.95, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-[#0a0a0a] border border-white/10 w-full max-w-7xl h-full md:h-full md:max-h-[900px] rounded-none md:rounded-[4rem] overflow-hidden flex flex-col md:flex-row relative z-10 shadow-[0_0_100px_rgba(0,0,0,1)]"
                        >
                            {/* Mobile Exit */}
                            <button 
                                onClick={() => setSelectedNews(null)}
                                className="md:hidden absolute top-6 right-6 z-[1100] w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white"
                            >
                                <Zap size={20} />
                            </button>

                            {/* Left: Intel Content */}
                            <div className="flex-1 overflow-y-auto p-8 md:p-16 border-b md:border-b-0 md:border-r border-white/5 no-scrollbar order-2 md:order-1">
                                <div className="mb-8 flex items-center gap-3">
                                    <div className="bg-[#ff00ff] text-white text-[9px] font-black px-6 py-2 rounded-full tracking-[.4em] italic">
                                        RESTRICTED ACCESS
                                    </div>
                                    <div className="text-white/20 text-[9px] uppercase font-black tracking-widest italic font-mono">
                                        ID: {selectedNews.id.slice(0, 8)}
                                    </div>
                                </div>
                                <h2 className="text-3xl md:text-6xl font-black italic uppercase tracking-tighter text-white mb-8 leading-tight">
                                    {selectedNews.title}
                                </h2>
                                <p className="text-white/40 text-sm md:text-xl font-outfit leading-relaxed mb-12 border-l-4 border-[#ff00ff] pl-8 py-2">
                                    {selectedNews.content}
                                </p>
                                
                                <div className="w-full bg-white/5 border border-white/10 rounded-[3rem] p-4 md:p-8 mb-12 overflow-hidden group/archive">
                                    <div className="flex items-center justify-between mb-6 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#00f0ff] italic">Shielded Connection Established</span>
                                        </div>
                                        <a 
                                            href={selectedNews.content_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="px-4 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-[8px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all backdrop-blur-md"
                                        >
                                            View Full Intel →
                                        </a>
                                    </div>
                                    
                                    <div className="relative w-full h-[300px] md:h-[500px] rounded-[2rem] overflow-hidden border border-white/5 bg-zinc-950">
                                        {/* 🛰️ SOVEREIGN SIGNAL BACKDROP (Elite Placeholder) */}
                                        <div className="absolute inset-0 z-0">
                                            <img src={selectedNews.persona_image} alt="" className="w-full h-full object-cover opacity-20 blur-2xl scale-110" />
                                            <div className="absolute inset-0 bg-gradient-to-br from-black via-transparent to-black" />
                                            
                                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                                                <div className="w-16 h-16 rounded-full border border-[#00f0ff]/10 flex items-center justify-center mb-4">
                                                    <Lock size={24} className="text-[#00f0ff] opacity-20 animate-pulse" />
                                                </div>
                                                <h3 className="text-[10px] font-syncopate font-black uppercase text-[#00f0ff] tracking-widest mb-1 opacity-40 italic">Signal Masked</h3>
                                                <p className="text-[8px] text-white/10 font-black uppercase tracking-widest max-w-[200px] leading-relaxed">
                                                    External node protocols prevent remote extraction. Access direct node for full briefing.
                                                </p>
                                            </div>
                                        </div>

                                        <iframe 
                                            src={selectedNews.content_url} 
                                            className="w-full h-full border-none grayscale hover:grayscale-0 transition-all duration-1000 opacity-40 hover:opacity-100 relative z-10"
                                            title="External Intel Briefing"
                                        />
                                        
                                        {/* Gradient Overlay */}
                                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/20 via-transparent to-transparent z-20" />
                                    </div>
                                </div>
                            </div>

                            {/* Right: The Node Bridge */}
                            <div className="w-full md:w-[450px] bg-[#0d0d0d] flex flex-col items-center p-8 md:p-12 text-center order-1 md:order-2 shrink-0">
                                <div className="sticky top-0 flex flex-col items-center w-full">
                                    <div className="w-32 h-32 md:w-48 md:h-48 rounded-[2rem] md:rounded-[3rem] overflow-hidden border-2 border-[#ff00ff] shadow-[0_0_40px_rgba(255,0,255,0.2)] mb-6 md:mb-8 shrink-0">
                                        {(selectedNews.persona_image || '').toLowerCase().endsWith('.mp4') ? (
                                            <video src={selectedNews.persona_image} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                                        ) : (
                                            <img src={selectedNews.persona_image} alt="" className="w-full h-full object-cover object-[center_20%]" />
                                        )}
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-widest text-[#ff00ff] mb-2">
                                        {selectedNews.persona_name}
                                    </h3>
                                    
                                    <div className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-6 mb-8 text-left">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping" />
                                            <span className="text-[#00f0ff] text-[9px] font-black uppercase tracking-widest">Connection: Stable</span>
                                        </div>
                                        <p className="text-white/60 text-[11px] italic font-medium leading-relaxed">
                                            "{selectedNews.persona_meta?.persona_note || (isSpanish ? 'He analizado esta filtración... Conéctate conmigo para el informe completo.' : 'My full take on this intelligence is ready in the crypt. Connect with me for the briefing.')}"
                                        </p>
                                    </div>

                                        <button 
                                            onClick={() => {
                                                if (onSelectProfile) {
                                                    onSelectProfile(selectedNews.persona_id);
                                                    setSelectedNews(null);
                                                } else {
                                                    window.location.href = `/?profile=${selectedNews.persona_id}`;
                                                }
                                            }}
                                            className="w-full h-16 md:h-20 rounded-2xl bg-[#ff00ff] text-white font-black italic uppercase tracking-[0.2em] text-sm hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,0,255,0.4)] active:scale-95"
                                        >
                                            CHAT W/ {selectedNews.persona_name.split(' ')[0]}
                                        </button>
                                    
                                    <button 
                                        onClick={() => setSelectedNews(null)}
                                        className="hidden md:block mt-6 text-white/20 hover:text-white text-[9px] font-black uppercase tracking-widest transition-all"
                                    >
                                        [ Close Terminal ]
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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

            <div className="flex flex-col gap-12 max-w-4xl mx-auto w-full px-2">
                {news.length === 0 ? (
                    <div className="p-20 text-center border border-dashed border-white/5 rounded-[3rem]">
                        <p className="text-white/20 uppercase text-[10px] font-black tracking-widest italic leading-relaxed">
                            {isSpanish ? 'Esperando Siguiente Ciclo de Sincronización...' : 'Awaiting Next Sync Cycle...'}
                        </p>
                    </div>
                ) : (
                    news.flatMap((item, i) => {
                        const newsCard = (
                            <motion.div
                                key={item.id}
                                id={`news-${item.id}`}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: (i % 3) * 0.1 }}
                                className={`group relative bg-[#0a0a0a] border p-8 md:p-12 rounded-[3.5rem] transition-all duration-500 ${item.meta?.heat === 'Critical' ? 'border-[#ff00ff]/40 shadow-[0_0_50px_rgba(255,0,255,0.1)]' : 'border-white/5 hover:border-[#ff00ff]/20'}`}
                            >
                                {/* Persona Header */}
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 shrink-0 bg-white/5">
                                        {(item.persona_image || '').toLowerCase().endsWith('.mp4') ? (
                                            <video src={item.persona_image} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                                        ) : (
                                            <img src={item.persona_image || '/placeholder.jpg'} alt="" className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-black uppercase text-white tracking-widest leading-none">
                                            {item.persona_name}
                                        </span>
                                    </div>
                                </div>

                                <Link 
                                    href={`/archive/${item.id}`}
                                    onClick={(e) => { 
                                        e.preventDefault(); 
                                        setSelectedNews(item); 
                                    }} 
                                    className="block text-left w-full outline-none mb-6"
                                >
                                    <h2 className="text-3xl md:text-5xl font-syncopate font-black italic uppercase tracking-tighter mb-4 leading-tight hover:text-[#00f0ff] transition-colors text-white/90">
                                        {item.title}
                                    </h2>
                                </Link>
                                
                                <p className="text-white/60 text-sm md:text-lg font-outfit leading-relaxed mb-10 max-w-3xl border-l border-white/10 pl-8 py-2">
                                    {item.content}
                                </p>

                                <div className="flex flex-col md:flex-row gap-4 relative z-20">
                                     <Link 
                                        href={`/archive/${item.id}`}
                                        onClick={(e) => { 
                                            e.preventDefault(); 
                                            setSelectedNews(item); 
                                        }}
                                        className="flex-1 h-16 rounded-xl bg-white text-black flex items-center justify-center gap-3 hover:bg-[#00f0ff] transition-all font-syncopate font-black italic text-[10px] tracking-widest uppercase shadow-xl"
                                    >
                                        READ INTEL <Zap size={16} />
                                    </Link>

                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            if (onSelectProfile) {
                                                onSelectProfile(item.persona_id);
                                            } else {
                                                window.location.href = `/?profile=${item.persona_id}`; 
                                            }
                                        }}
                                        className="px-8 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-3 hover:bg-white/10 transition-all text-white hover:text-[#ff00ff] uppercase text-[9px] font-black tracking-widest italic"
                                    >
                                        <MessageSquare size={16} />
                                        CHAT W/ {item.persona_name.split(' ')[0]}
                                    </button>
                                </div>
                            </motion.div>
                        );

                        // Inject Promo Card every 4 items
                        if (i > 0 && (i + 1) % 4 === 0) {
                            return [
                                newsCard,
                                <motion.div
                                    key={`promo-${item.id}`}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    className="relative h-[650px] md:h-[750px] w-full rounded-[4rem] overflow-hidden group/promo border border-[#ff00ff]/20"
                                >
                                    <img src={item.persona_image} alt="" className="absolute inset-0 w-full h-full object-cover object-[center_15%] transition-transform duration-1000 group-hover/promo:scale-110" />
                                    <div className="absolute inset-0 bg-black/10" />
                                    
                                    <div className="absolute inset-x-8 bottom-8 md:inset-x-12 md:bottom-12 flex flex-col items-center text-center">
                                        <div className="mb-4 flex items-center gap-2 px-6 py-2 bg-[#ff00ff] text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-full shadow-[0_0_30px_rgba(255,0,255,0.4)]">
                                            <Zap size={14} fill="white" /> LIVE CONNECTION
                                        </div>
                                        <h3 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white mb-2">
                                            CONNECT W/ {item.persona_name}
                                        </h3>
                                        <button 
                                            onClick={() => { 
                                                if (onSelectProfile) {
                                                    onSelectProfile(item.persona_id);
                                                } else {
                                                    window.location.href = `/?profile=${item.persona_id}`; 
                                                }
                                            }}
                                            className="px-20 h-20 rounded-2xl bg-[#00f0ff] text-black font-black italic uppercase tracking-[0.2em] text-sm hover:scale-105 transition-all shadow-[0_0_40px_rgba(240,255,0,0.4)]"
                                        >
                                            CHAT W/ {item.persona_name.split(' ')[0]}
                                        </button>
                                    </div>
                                </motion.div>
                            ];
                        }

                        return [newsCard];
                    })
                )}

                {/* 🛡️ COMPLIANCE FOOTER */}
                <div className="mt-20 py-12 border-t border-white/5 flex flex-col items-center gap-6 opacity-30">
                    <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                        <Link href="/terms">Terms</Link>
                        <Link href="/privacy">Privacy</Link>
                        <Link href="/refunds">Refunds</Link>
                        <Link href="/contact">Contact</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
