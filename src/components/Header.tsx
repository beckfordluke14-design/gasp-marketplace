'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Zap, Wallet, Activity, User, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import CoinBalance from './economy/CoinBalance';
import PersonaSearch from './PersonaSearch';
import { useUser } from './providers/UserProvider';
import WalletConnect from './economy/WalletConnect';

export default function Header({ onOpenTopUp, deadIds, setDeadIds }: { onOpenTopUp: () => void, deadIds: Set<string>, setDeadIds: (ids: any) => void }) {
  const router = useRouter();
  const { user, profile } = useUser();
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isGranted = document.cookie.includes('admin_gasp_override=granted');
    setIsAdmin(isGranted);
    setShowAdmin(isGranted);
  }, []);
  
  const navItems = [
    { label: 'Feed', active: true, href: '/' },
    ...(isAdmin ? [{ label: 'Audit Hub', active: false, href: '/admin/audit' }] : []),
    { label: 'Collection', active: false, href: '/vault' },
    { label: 'Hubs', active: false, href: '/' },
  ];

  if (!mounted) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col pointer-events-none">
        {/* MAIN NAVIGATION BAR */}
        <header className="h-14 md:h-24 bg-black/60 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between px-4 md:px-10 pointer-events-auto">
            
            {/* LOGO SECTION */}
            <div className="flex items-center gap-8 md:gap-12 pointer-events-auto">
                <motion.h1 
                  onClick={() => router.push('/')}
                  initial={{ scale: 0.8, opacity: 0, filter: 'blur(10px)' }}
                  animate={{ 
                    scale: 1, 
                    opacity: 1, 
                    filter: 'blur(0px)',
                    textShadow: [
                      "0 0 0px #fff",
                      "5px 0 10px #ff00ff",
                      "-5px 0 10px #00f0ff",
                      "0 0 0px #fff"
                    ],
                    x: [0, -2, 2, -1, 0]
                  }}
                  transition={{ 
                    duration: 0.8, 
                    ease: "easeOut",
                    textShadow: { duration: 0.4, repeat: 1 },
                    x: { duration: 0.2, repeat: 2 }
                  }}
                  className="text-xl md:text-5xl font-black uppercase tracking-tighter text-white font-outfit italic cursor-pointer group leading-none relative shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                >
                  gasp
                  
                  {/* Subtle Glitch Layer */}
                  <motion.span 
                    animate={{ opacity: [0, 0.4, 0], x: [-10, 10, -10] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="absolute inset-0 text-[#00f0ff] mix-blend-screen pointer-events-none select-none opacity-0"
                  >
                    gasp
                  </motion.span>
                </motion.h1>

                {/* DESKTOP NAV */}
                <nav className="hidden xl:flex items-center gap-8">
                    {navItems.map((item) => (
                      <button 
                        key={item.label}
                        onClick={() => router.push(item.href || '/')}
                        className={`text-[10px] font-black uppercase tracking-[0.4em] transition-all hover:text-white relative
                          ${item.active ? 'text-white' : 'text-white/30'}
                        `}
                      >
                        {item.label}
                        {item.active && (
                           <motion.div layoutId="header-nav-active" className="absolute -bottom-4 left-0 right-0 h-0.5 bg-[#ff00ff] shadow-[0_0_15px_#ff00ff]" />
                        )}
                      </button>
                    ))}
                </nav>
            </div>

            {/* ACTION HUB (MOBILE & DESKTOP) */}
            <div className="flex items-center gap-3 md:gap-6 pointer-events-auto">
                
                {/* 🕴️ THE IDENTITY NODE (PROFESSIONAL CTA) */}
                {user ? (
                   <div 
                     onClick={() => router.push('/vault')}
                     className="flex items-center gap-2 md:gap-3 p-1 pr-3 md:pr-5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all cursor-pointer group"
                   >
                      <div className="w-6 h-6 md:w-8 md:h-8 rounded-full overflow-hidden border border-[#ff00ff]/40 group-hover:border-[#ff00ff] transition-all">
                         <div className="w-full h-full bg-[#ff00ff]/20 flex items-center justify-center text-[10px] font-black italic text-[#ff00ff]">
                            {profile?.nickname ? profile.nickname.substring(0, 1).toUpperCase() : <User size={14} />}
                         </div>
                      </div>
                      <span className="hidden md:block text-[9px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
                         {profile?.nickname || 'TITAN'}
                      </span>
                   </div>
                ) : (
                   <button 
                      onClick={() => router.push('/login')}
                      className="h-8 md:h-12 px-4 md:px-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center gap-2 hover:bg-white/10 active:scale-95 transition-all group"
                   >
                      <User size={12} className="text-white/40 group-hover:text-[#ff00ff] transition-colors" />
                      <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-white">Join</span>
                   </button>
                )}

                {/* 🏎️💨 REVENUE HUB */}
                <button 
                  onClick={() => onOpenTopUp()}
                  className="h-8 md:h-12 px-4 md:px-8 bg-[#00f0ff] text-black text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] hover:scale-105 active:scale-95 transition-all font-syncopate italic"
                >
                   <span className="hidden md:inline">GET </span>CREDITS
                </button>

                {/* COIN BALANCE DISPLAY */}
                <div onClick={() => onOpenTopUp()} className="cursor-pointer hover:opacity-80 transition-all scale-75 md:scale-100 origin-right">
                  <CoinBalance onOpenTopUp={() => onOpenTopUp()} />
                </div>

                {/* WALLET CONNECTION HUB */}
                <div className="flex">
                   <WalletConnect />
                </div>

                {/* ADMIN OVERRIDE STAR */}
                {isAdmin && (
                   <div 
                     onClick={() => {
                        const next = !showAdmin;
                        setShowAdmin(next);
                        window.dispatchEvent(new CustomEvent('gasp_admin_toggle', { detail: next }));
                     }}
                     className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${showAdmin ? 'bg-[#ffea00]/10 text-[#ffea00] shadow-[0_0_15px_#ffea0044]' : 'bg-white/5 text-white/20 hover:text-white'}`}
                   >
                      <Star size={16} fill={showAdmin ? 'currentColor' : 'none'} />
                   </div>
                )}
            </div>
        </header>

                {/* ATTACHED DISCOVERY HUB (SUBBAR): TRANSPARENT TO SHOW MORE CONTENT */}
                <div className="h-10 md:h-14 flex items-center justify-center bg-transparent pointer-events-auto">
                    <div className="w-full max-w-[280px] md:max-w-xl mx-auto px-4">
                        <PersonaSearch deadIds={deadIds} setDeadIds={setDeadIds} />
                    </div>
                </div>
    </div>
  );
}
