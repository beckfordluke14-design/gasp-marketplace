'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, User, Zap, Database
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from './providers/UserProvider';
import GlitchText from './ui/GlitchText';
import { SYNDICATE_CONFIG } from '@/lib/economy/monetizationConfig';

/**
 * 🛰️ SIAT: SYNTHETIC INFLUENCER ARCHIVE TERMINAL (V12.1)
 * High-Status premium branding with integrated Ticker.
 * FLEXIBLE RESPONSIVE UI: Desktop (Full) // Mobile (Money-Focused)
 */
export default function Header({ onOpenMenu, onOpenTopUp }: any) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { user, profile } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);

  // 🌍 GLOBAL LOCALE STATE
  const isSpanish = typeof window !== 'undefined' && localStorage.getItem('gasp_locale') === 'es';
  const [tickItems, setTickItems] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
    setIsAdmin(document.cookie.includes('admin_gasp_override=granted'));
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    
    // 📩 UNREAD SYNC: Watch for new message events
    const syncUnreads = () => {
       const stored = JSON.parse(localStorage.getItem('gasp_unread_counts') || '{}');
       const total = Object.values(stored).reduce((a: any, b: any) => a + Number(b), 0);
       setUnreadTotal(total);
    };
    syncUnreads();
    
    window.addEventListener('gasp_unread_sync_trigger', syncUnreads);
    window.addEventListener('resize', checkMobile);
    return () => {
        window.removeEventListener('gasp_unread_sync_trigger', syncUnreads);
        window.removeEventListener('resize', checkMobile);
    };
  }, []);

  useEffect(() => {
    const fetchLatestActivity = async () => {
      try {
        const res = await fetch('/api/news?limit=10');
        const data = await res.json();
        const coreItems = [
          isSpanish ? "🌪️ NUEVO ARCHIVO AÑADIDO" : "🌪️ NEW ARCHIVE ADDED",
          isSpanish ? "💎 PERFIL EN LÍNEA" : "💎 PROFILE ONLINE",
          isSpanish ? "⚡️ ACTUALIZACIÓN v1.9" : "⚡️ UPDATE v1.9",
        ];
        if (data.success && data.posts && data.posts.length > 0) {
          const newsItems = data.posts.map((p: any) => `${p.persona_name.split(' ')[0].toUpperCase()}: ${p.title.toUpperCase()}`);
          setTickItems([...newsItems, ...coreItems].sort(() => 0.5 - Math.random()));
        } else {
          setTickItems(coreItems);
        }
      } catch (e) {
        setTickItems(["⚡️ SYNCING..."]);
      }
    };
    fetchLatestActivity();
    const interval = setInterval(fetchLatestActivity, 60000);
    return () => clearInterval(interval);
  }, [isSpanish]);

  if (!mounted) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col pointer-events-none">
        
        {/* 🧬 GASP FEED TICKER: Slim Desktop Only */}
        <div className="hidden md:flex h-6 bg-[#ff00ff]/10 border-b border-white/5 items-center overflow-hidden whitespace-nowrap pointer-events-auto">
            <div className="px-4 h-full bg-[#ff00ff] flex items-center gap-2 shrink-0 z-10">
                <Database size={10} className="text-white animate-pulse" />
                <span className="text-[7px] font-black uppercase text-white tracking-widest italic font-syncopate">GASP FEED</span>
            </div>
            
            <motion.div animate={{ x: [0, -4000] }} transition={{ duration: 120, repeat: Infinity, ease: "linear" }} className="flex items-center gap-20 pl-6 text-white/40 text-[7px] font-black uppercase tracking-[0.2em] italic">
                {tickItems.map((news, i) => <div key={i} className="flex items-center gap-4">
                  <div className="w-1 h-1 rounded-full bg-[#ff00ff]" /> {news} 
                </div>)}
                {tickItems.map((news, i) => <div key={`dup-${i}`} className="flex items-center gap-4">
                  <div className="w-1 h-1 rounded-full bg-[#ff00ff]" /> {news} 
                </div>)}
            </motion.div>
        </div>

        {/* SIAT Navigation Bar */}
        <header className="h-12 md:h-14 bg-black/80 backdrop-blur-3xl flex items-center justify-between px-4 md:px-12 pointer-events-auto border-b border-white/5">
            
            <div className="flex items-center gap-3 md:gap-10">
                <button onClick={onOpenMenu} className="relative lg:hidden w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                    <Menu size={16} />
                    {unreadTotal > 0 && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#ff00ff] rounded-full animate-pulse shadow-[0_0_10px_#ff00ff]" />
                    )}
                </button>
                <div className="flex flex-col gap-0.5 cursor-pointer group" onClick={() => router.push('/')}>
                  <h1 className="text-lg md:text-2xl font-syncopate font-black italic tracking-tighter text-white uppercase leading-none group-hover:text-[#ff00ff] transition-colors"><GlitchText text="Gasp" /><span className="text-[#ff00ff]">.</span></h1>
                  <span className="hidden md:block text-[6px] font-black uppercase text-white/20 tracking-[0.4em] italic font-syncopate">{isSpanish ? 'ARCHIVO ELITE' : 'PREMIUM ARCHIVE'}</span>
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                {/* 🌍 LOCALE: Desktop Only */}
                <div className="hidden xl:flex items-center p-1 bg-white/5 border border-white/10 rounded-full h-8">
                    <button onClick={() => { localStorage.setItem('gasp_locale', 'en'); window.location.reload(); }} className={`px-3 h-full flex items-center justify-center text-[8px] font-black rounded-full ${!isSpanish ? 'bg-[#ff00ff] text-white' : 'text-white/40'}`}>EN</button>
                    <button onClick={() => { localStorage.setItem('gasp_locale', 'es'); window.location.reload(); }} className={`px-3 h-full flex items-center justify-center text-[8px] font-black rounded-full ${isSpanish ? 'bg-[#ff00ff] text-white' : 'text-white/40'}`}>ES</button>
                </div>

                {/* 🧬 CREDIT WALLET: Essential Everywhere */}
                {profile && (
                    <div onClick={onOpenTopUp} className="flex items-center gap-1.5 md:gap-2 p-1 md:p-1.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all cursor-pointer h-8 md:h-10 ml-1">
                        <div className="flex flex-col px-2">
                            <div className="flex items-center gap-1.5 leading-none">
                              <Zap size={10} className="text-[#ffea00] fill-[#ffea00]" />
                              <span className="text-[10px] md:text-[13px] font-black text-white italic">{(profile?.credit_balance || 0).toLocaleString()}</span>
                            </div>
                            <span className="hidden xs:block text-[5px] md:text-[6px] font-black text-white/30 uppercase tracking-widest mt-0.5 ml-3.5">
                                {SYNDICATE_CONFIG.compliance ? 'UNITS' : 'CREDITS'}
                            </span>
                        </div>
                        <button className="h-6 md:h-7 px-2 md:px-4 rounded-full bg-[#ffea00] text-black text-[7px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg border-none">ADD</button>
                    </div>
                )}

                {user ? (
                    <div onClick={() => router.push('/vault')} className="flex items-center gap-2 p-1 pr-2 md:pr-4 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 cursor-pointer group">
                        <div className="w-6 h-6 rounded-full border border-[#00f0ff]/40 bg-black flex items-center justify-center"><User size={12} className="text-[#00f0ff]" /></div>
                        <span className="hidden xl:block text-[8px] font-black uppercase text-white/40 group-hover:text-white transition-colors truncate max-w-[80px]">{profile?.nickname || 'ACCOUNT'}</span>
                    </div>
                ) : (
                   <button onClick={() => router.push('/login')} className="px-4 md:px-6 py-1.5 md:py-2 rounded-full bg-white text-black text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)] whitespace-nowrap">SIGN IN</button>
                )}
            </div>
        </header>
    </div>
  );
}
