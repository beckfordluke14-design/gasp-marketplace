'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, Bell, User, LayoutDashboard, Settings, 
  LogOut, Shield, Zap, Search, RadioReceiver, Database
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from './providers/UserProvider';

interface HeaderProps {
    onOpenMenu?: () => void;
    onOpenTopUp?: () => void;
    deadIds?: Set<string>;
    setDeadIds?: (ids: any) => void;
    profiles?: any[];
    onSelectProfile?: (id: string, initialMsg?: string) => void;
}

/**
 * 🛰️ SIAT: SYNTHETIC INFLUENCER ARCHIVE TERMINAL (V12)
 * High-Status premium branding with integrated Ticker.
 * MULTI-LOCALE GLOBAL SYNC (EN/ES)
 */
export default function Header({ onOpenMenu, onOpenTopUp }: HeaderProps) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { user, profile } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 🌍 GLOBAL LOCALE STATE
  const isSpanish = typeof window !== 'undefined' && localStorage.getItem('gasp_locale') === 'es';

  useEffect(() => {
    const handleBalanceRefresh = () => {
      // Re-fetch handled by provider
    };
    window.addEventListener('gasp_balance_refresh', handleBalanceRefresh);
    return () => window.removeEventListener('gasp_balance_refresh', handleBalanceRefresh);
  }, []);

  useEffect(() => {
    setMounted(true);
    setIsAdmin(document.cookie.includes('admin_gasp_override=granted'));
    
    // 🧬 RESPONSIVE UPLINK BREAKPOINT (768px for Tablet/Mobile)
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const navItems = [
    { label: isSpanish ? 'Feed' : 'Feed', active: true, href: '/' },
    ...(isAdmin ? [{ label: 'Admin', active: false, href: '/admin' }] : []),
    { label: isSpanish ? 'Cómo' : 'How-To', active: false, href: '/how-to' },
    { label: isSpanish ? 'Archivo' : 'Archive', active: false, href: '/vault' },
    { label: isSpanish ? 'Acerca' : 'About', active: false, href: '/' },
  ];

  if (!mounted) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col pointer-events-none">
        
        {/* 🧬 GASP FEED: LATEST ACTIVITY TICKER */}
        <div className="h-6 md:h-7 bg-[#ff00ff]/10 border-b border-white/5 flex items-center overflow-hidden whitespace-nowrap pointer-events-auto shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
            <div className="px-4 h-full bg-[#ff00ff] flex items-center gap-2 shrink-0 z-10 shadow-[5px_0_15px_#ff00ff]">
                <Database size={10} className="text-white animate-pulse" />
                <span className="text-[7px] md:text-[8px] font-black uppercase text-white tracking-widest italic">
                  {isSpanish ? 'GASP FEED' : 'GASP FEED'}
                </span>
            </div>
            
            <motion.div 
               animate={{ x: [0, -2000] }}
               transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
               className="flex items-center gap-20 pl-6"
            >
                {[
                  isSpanish ? "🌪️ NUEVO ARCHIVO AÑADIDO A LA BÓVEDA // ELENA (MIAMI)" : "🌪️ NEW ARCHIVE ADDED TO THE VAULT // ELENA (MIAMI)",
                  isSpanish ? "💎 NUEVO PERFIL EN LÍNEA // VALENTINA LIMA" : "💎 NEW PROFILE ONLINE // VALENTINA LIMA",
                  isSpanish ? "⚡️ NUEVO FEED DROP // CARA (MADRID)" : "⚡️ NEW FEED DROP // CARA (MADRID)",
                  isSpanish ? "🔥 TENDENCIA AHORA // REVISA EL ÚLTIMO ARCHIVO" : "🔥 TRENDING NOW // CHECK THE LATEST ARCHIVE",
                  isSpanish ? "🌪️ NUEVO ARCHIVO AÑADIDO A LA BÓVEDA // ELENA (MIAMI)" : "🌪️ NEW ARCHIVE ADDED TO THE VAULT // ELENA (MIAMI)",
                ].map((news, i) => (
                  <div key={i} className="flex items-center gap-4 text-white/40 text-[7px] md:text-[8px] font-black uppercase tracking-[0.2em] italic">
                     <div className="w-1 h-1 rounded-full bg-[#ff00ff] animate-pulse" />
                     {news}
                  </div>
                ))}
            </motion.div>
        </div>

        {/* SIAT Navigation Bar */}
        <header className="h-12 md:h-14 bg-black/80 backdrop-blur-3xl flex items-center justify-between px-6 md:px-12 pointer-events-auto transition-all border-b border-white/5 shadow-2xl">
            
            {/* Logo Section */}
            <div className="flex items-center gap-4 md:gap-10 pointer-events-auto">
                <button 
                  onClick={onOpenMenu}
                  className="xl:hidden w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all active:scale-90"
                >
                   <Menu size={18} />
                </button>
                
                <div className="flex flex-col gap-0.5 cursor-pointer group" onClick={() => router.push('/')}>
                  <div className="flex items-baseline gap-1.5">
                    <h1 className="text-xl md:text-2xl font-syncopate font-black italic tracking-tighter text-white uppercase leading-none group-hover:text-[#ff00ff] transition-colors whitespace-nowrap">Gasp</h1>
                    {/* 🧬 ARCHIVE TAG REMOVED PER USER REQUEST */}
                  </div>
                  <span className="hidden md:block text-[6px] font-black uppercase text-white/20 tracking-[0.4em] group-hover:text-white/40 transition-colors italic">
                    {isSpanish ? 'Archivo de Elite Digital' : 'Premium Archive'}
                  </span>
                </div>

                {/* Main Nav Items */}
                <nav className="hidden xl:flex items-center gap-6 ml-4">
                    {navItems.map((item) => (
                      <button 
                        key={item.label}
                        onClick={() => router.push(item.href || '/')}
                        className={`text-[9px] font-black uppercase tracking-[0.3em] transition-all hover:text-white relative
                          ${item.active ? 'text-white' : 'text-white/30'}
                        `}
                      >
                        {item.label}
                        {item.active && (
                           <motion.div layoutId="header-nav-active" className="absolute -bottom-3 left-0 right-0 h-0.5 bg-[#ff00ff] shadow-[0_0_15px_#ff00ff]" />
                        )}
                      </button>
                    ))}
                </nav>
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-2 md:gap-4 pointer-events-auto">
                
                {/* 🌍 GLOBAL LOCALE SWITCHER */}
                <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-full h-8 md:h-9">
                    <button 
                        onClick={() => {
                            localStorage.setItem('gasp_locale', 'en');
                            window.location.reload();
                        }}
                        className={`px-2 md:px-3 h-full flex items-center justify-center text-[8px] md:text-[9px] font-black rounded-full transition-all ${!isSpanish ? 'bg-[#00f0ff] text-black shadow-[0_0_10px_rgba(0,240,255,0.4)]' : 'text-white/40 hover:text-white'}`}
                    >
                        EN
                    </button>
                    <button 
                        onClick={() => {
                            localStorage.setItem('gasp_locale', 'es');
                            window.location.reload();
                        }}
                        className={`px-2 md:px-3 h-full flex items-center justify-center text-[8px] md:text-[9px] font-black rounded-full transition-all ${isSpanish ? 'bg-[#ff00ff] text-white shadow-[0_0_10px_rgba(255,0,255,0.4)]' : 'text-white/40 hover:text-white'}`}
                    >
                        ES
                    </button>
                </div>

                {user ? (
                   <>
                    {/* 🧬 CREDIT FUEL GAUGE */}
                    <div 
                      onClick={onOpenTopUp}
                      className="flex items-center gap-2 p-1.5 md:p-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all cursor-pointer group h-9 md:h-11 ml-2"
                    >
                        <div className="flex items-center gap-2 px-2 md:px-3">
                            <Zap size={14} className="text-[#ff6b00] animate-pulse" />
                            <div className="flex flex-col">
                                <span className="text-[10px] md:text-[12px] font-black text-white leading-none italic">
                                   {(profile?.credit_balance || 0).toLocaleString()}
                                </span>
                                <span className="text-[6px] md:text-[7px] font-black text-white/40 uppercase tracking-[0.2em] leading-tight">
                                  {isSpanish ? 'CRÉDITOS' : 'CREDITS'}
                                </span>
                            </div>
                        </div>
                        <button className="h-7 md:h-8 px-3 md:px-4 rounded-full bg-[#ff6b00] text-black text-[7px] md:text-[8px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center">
                            {isSpanish ? 'AÑADIR' : (isMobile ? 'ADD' : 'ADD CREDITS')}
                        </button>
                    </div>

                    {/* Profile Section */}
                    <div 
                      onClick={() => router.push('/vault')}
                      className="flex items-center gap-2 p-1 pr-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all cursor-pointer group"
                    >
                        <div className="w-5 h-5 md:w-6 md:h-6 rounded-full overflow-hidden border border-[#00f0ff]/40 group-hover:border-[#00f0ff] transition-all bg-black flex items-center justify-center shrink-0">
                           <User size={12} className="text-[#00f0ff]" />
                        </div>
                        <span className="hidden md:block text-[8px] font-black uppercase tracking-[0.1em] text-white/40 group-hover:text-white transition-colors truncate max-w-[80px]">
                           {profile?.nickname || (isSpanish ? 'Cuenta' : 'Account')}
                        </span>
                    </div>
                   </>
                ) : (
                   <button 
                    onClick={() => router.push('/login')}
                    className="px-5 py-2 md:py-2.5 rounded-full bg-white text-black text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                   >
                     {isSpanish ? 'ENTRAR' : 'SIGN IN'}
                   </button>
                )}
            </div>
        </header>
    </div>
  );
}
