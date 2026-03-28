'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Zap, Wallet, Activity, User, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import CoinBalance from './economy/CoinBalance';
import ProfileSearch from './ProfileSearch';
import { useUser } from './providers/UserProvider';
import WalletConnect from './economy/WalletConnect';

export default function Header({ onOpenTopUp = () => {}, deadIds = new Set(), setDeadIds = () => {} }: { onOpenTopUp?: () => void, deadIds?: Set<string>, setDeadIds?: (ids: any) => void }) {
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
    ...(isAdmin ? [{ label: 'Admin Panel', active: false, href: '/admin/audit' }] : []),
    { label: 'Collection', active: false, href: '/vault' },
    { label: 'Explore', active: false, href: '/' },
  ];

  if (!mounted) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col pointer-events-none">
        {/* Navigation Bar */}
        <header className="h-12 md:h-14 bg-transparent backdrop-blur-3xl border-b border-white/5 flex items-center justify-between px-6 md:px-12 pointer-events-auto transition-all">
            
            {/* Logo */}
            <div className="flex items-center gap-8 md:gap-10 pointer-events-auto">
                <motion.h1 
                  onClick={() => router.push('/')}
                  initial={{ scale: 0.8, opacity: 0, filter: 'blur(10px)' }}
                  animate={{ 
                    scale: 0.9, 
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
                  className="text-xl md:text-3xl font-black uppercase tracking-tighter text-white font-outfit italic cursor-pointer group leading-none relative shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                >
                  gasp<span className="text-[#ff00ff]">.</span>
                   
                   <motion.span 
                     animate={{ opacity: [0, 0.4, 0], x: [-10, 10, -10] }}
                     transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                     className="absolute inset-0 text-[#00f0ff] mix-blend-screen pointer-events-none select-none opacity-0"
                   >
                     gasp.
                   </motion.span>
                </motion.h1>

                {/* Main Nav */}
                <nav className="hidden xl:flex items-center gap-6">
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
                
                {/* User Profile */}
                {user ? (
                   <div 
                     onClick={() => router.push('/vault')}
                     className="flex items-center gap-2 p-1 pr-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all cursor-pointer group"
                   >
                      <div className="w-5 h-5 md:w-6 md:h-6 rounded-full overflow-hidden border border-[#ff00ff]/40 group-hover:border-[#ff00ff] transition-all">
                         <div className="w-full h-full bg-[#ff00ff]/20 flex items-center justify-center text-[8px] font-black italic text-[#ff00ff]">
                            {profile?.nickname ? profile.nickname.substring(0, 1).toUpperCase() : <User size={12} />}
                         </div>
                      </div>
                      <span className="hidden md:block text-[8px] font-black uppercase tracking-[0.1em] text-white/40 group-hover:text-white transition-colors">
                         {profile?.nickname || 'ACCOUNT'}
                      </span>
                   </div>
                ) : (
                   <button 
                      onClick={() => router.push('/login')}
                      className="h-7 md:h-9 px-4 bg-white/5 border border-white/10 rounded-full flex items-center justify-center gap-2 hover:bg-white/10 active:scale-95 transition-all group"
                   >
                      <User size={10} className="text-white/40 group-hover:text-[#ff00ff] transition-colors" />
                      <span className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.1em] text-white/40 group-hover:text-white">Join</span>
                   </button>
                )}

                {/* Add Credits */}
                <button 
                  onClick={() => onOpenTopUp()}
                  className="h-7 md:h-9 px-4 md:px-6 bg-[#ff6b00] text-black text-[7px] md:text-[8px] font-black uppercase tracking-[0.1em] rounded-full hover:shadow-[0_0_20px_rgba(255,107,0,0.4)] hover:scale-105 active:scale-95 transition-all font-syncopate italic shadow-[0_0_10px_rgba(255,107,0,0.2)]"
                >
                   ADD CREDITS
                </button>

                <div onClick={() => onOpenTopUp()} className="cursor-pointer hover:opacity-80 transition-all scale-[0.6] md:scale-[0.8] origin-right">
                  <CoinBalance onOpenTopUp={() => onOpenTopUp()} />
                </div>

                <div className="flex scale-[0.8] origin-right">
                   <WalletConnect />
                </div>

                {/* Admin Toggle */}
                {isAdmin && (
                   <div 
                     onClick={() => {
                        const next = !showAdmin;
                        setShowAdmin(next);
                        window.dispatchEvent(new CustomEvent('gasp_admin_toggle', { detail: next }));
                     }}
                     className={`w-7 h-7 md:w-8 md:h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${showAdmin ? 'bg-[#ffea00]/10 text-[#ffea00] shadow-[0_0_15px_#ffea0044]' : 'bg-white/5 text-white/20 hover:text-white'}`}
                   >
                      <Star size={14} fill={showAdmin ? 'currentColor' : 'none'} />
                   </div>
                )}
            </div>
        </header>

         {/* Floating Search Bar - Fully Transparent / Floating Style */}
         <div className="absolute top-[105%] left-1/2 -translate-x-1/2 w-full max-w-[280px] md:max-w-xl px-4 flex items-center justify-center pointer-events-auto z-[90]">
             <div className="w-full bg-transparent border border-white/10 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.4)] p-0.5">
                 <ProfileSearch deadIds={deadIds} setDeadIds={setDeadIds} />
             </div>
         </div>
    </div>
  );
}
