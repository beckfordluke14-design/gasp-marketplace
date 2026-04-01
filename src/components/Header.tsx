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
}

/**
 * 🛰️ SIAT: SYNTHETIC INFLUENCER ARCHIVE TERMINAL (V12)
 * High-Status premium branding with integrated Ticker.
 */
export default function Header({ onOpenMenu }: HeaderProps) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { user, profile } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsAdmin(document.cookie.includes('admin_gasp_override=granted'));
  }, []);
  
  const navItems = [
    { label: 'Feed', active: true, href: '/' },
    ...(isAdmin ? [{ label: 'Admin', active: false, href: '/admin' }] : []),
    { label: 'How-To', active: false, href: '/how-to' },
    { label: 'Archive', active: false, href: '/vault' },
    { label: 'About', active: false, href: '/' },
  ];

  if (!mounted) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col pointer-events-none">
        
        {/* 🧬 GASP FEED: LATEST ACTIVITY */}
        <div className="h-6 md:h-7 bg-[#ff00ff]/10 border-b border-white/5 flex items-center overflow-hidden whitespace-nowrap pointer-events-auto shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
            <div className="px-4 h-full bg-[#ff00ff] flex items-center gap-2 shrink-0 z-10 shadow-[5px_0_15px_#ff00ff]">
                <Database size={10} className="text-white animate-pulse" />
                <span className="text-[7px] md:text-[8px] font-black uppercase text-white tracking-widest italic">GASP FEED</span>
            </div>
            
            <motion.div 
               animate={{ x: [0, -2000] }}
               transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
               className="flex items-center gap-20 pl-6"
            >
                {[
                  "🌪️ NEW ARCHIVE ADDED TO THE VAULT // ELENA (MIAMI)",
                  "💎 NEW PROFILE ONLINE // VALENTINA LIMA",
                  "⚡️ NEW FEED DROP // CARA (MADRID)",
                  "🔥 TRENDING NOW // CHECK THE LATEST ARCHIVE",
                  "🌪️ NEW ARCHIVE ADDED TO THE VAULT // ELENA (MIAMI)",
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
                    <h1 className="text-xl md:text-2xl font-syncopate font-black italic tracking-tighter text-white uppercase leading-none group-hover:text-[#ff00ff] transition-colors">GASP</h1>
                    <span className="text-[8px] font-black uppercase text-[#ff00ff] tracking-widest italic animate-pulse">Archive</span>
                  </div>
                  <span className="hidden md:block text-[6px] font-black uppercase text-white/20 tracking-[0.4em] group-hover:text-white/40 transition-colors italic">Synthetic Influencer Archive Terminal</span>
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
            <div className="flex items-center gap-1 md:gap-2 pointer-events-auto">
                {user ? (
                   <div 
                     onClick={() => router.push('/vault')}
                     className="flex items-center gap-2 p-1 pr-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all cursor-pointer group"
                   >
                       <div className="w-5 h-5 md:w-6 md:h-6 rounded-full overflow-hidden border border-[#00f0ff]/40 group-hover:border-[#00f0ff] transition-all bg-black flex items-center justify-center shrink-0">
                          <User size={12} className="text-[#00f0ff]" />
                       </div>
                       <span className="hidden md:block text-[8px] font-black uppercase tracking-[0.1em] text-white/40 group-hover:text-white transition-colors truncate max-w-[100px]">
                          {profile?.nickname || 'Account'}
                       </span>
                   </div>
                ) : (
                   <button 
                    onClick={() => router.push('/login')}
                    className="px-5 py-2 md:py-2.5 rounded-full bg-white text-black text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                   >
                     Sign In
                   </button>
                )}
            </div>
        </header>
    </div>
  );
}
