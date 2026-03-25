'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Zap, Wallet, Bell, SlidersVertical, Settings, Activity, User, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import CoinBalance from './economy/CoinBalance';
import TopUpDrawer from './economy/TopUpDrawer';
import PersonaSearch from './PersonaSearch';

export default function Header() {
  const router = useRouter();
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [guestId, setGuestId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);

  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    const isGranted = document.cookie.includes('admin_gasp_override=granted');
    setIsAdmin(isGranted);
    setShowAdmin(isGranted);
    const id = localStorage.getItem('gasp_guest_id') || 'guest_temp';
    setGuestId(id);
  }, []);
  
  const navItems = [
    { label: 'Feed', active: true, href: '/' },
    ...(isAdmin ? [{ label: 'Audit Hub', active: false, href: '/admin/audit' }] : []),
    { label: 'My Collection', active: false, href: '/vault' },
    { label: 'Elite Chat Hubs', active: false, href: '/' },
    { label: 'Live Streams', active: false, badge: '12', href: '/' },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col pointer-events-none">
        {/* MAIN NAVIGATION BAR */}
        <header className="h-14 md:h-20 bg-black/40 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between px-4 md:px-12 pointer-events-auto">
            
            {/* Logo Section */}
            <div className="flex items-center gap-12 pointer-events-auto">
                <h1 
                  onClick={() => router.push('/')}
                  className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-white font-outfit italic cursor-pointer group leading-none"
                >
                  gasp <span className="text-[#ff00ff] drop-shadow-[0_0_10px_rgba(255,0,255,1)]">.</span>
                </h1>

                {/* Top Nav (Center Reference) */}
                <nav className="hidden lg:flex items-center gap-10">
                    {navItems.map((item) => (
                      <button 
                        key={item.label}
                        onClick={() => router.push(item.href || '/')}
                        className={`text-[11px] font-black uppercase tracking-[0.4em] transition-all hover:text-white relative
                          ${item.active ? 'text-white' : 'text-white/40'}
                        `}
                      >
                        {item.label}
                        {item.badge && (
                           <span className="ml-2 px-1.5 py-0.5 bg-[#ff00ff] text-black text-[8px] rounded-full shadow-[0_0_10px_rgba(255,0,255,0.4)]">
                             {item.badge}
                           </span>
                        )}
                        {item.active && (
                           <motion.div layoutId="header-nav-active" className="absolute -bottom-4 left-0 right-0 h-0.5 bg-[#ff00ff] shadow-[0_0_10px_#ff00ff]" />
                        )}
                      </button>
                    ))}
                </nav>
            </div>

            {/* Right Header Actions */}
            <div className="flex items-center gap-6 md:gap-8 pointer-events-auto">
                {/* Login / Sign Up Call to Action */}
                <button 
                  onClick={() => router.push('/login')}
                  className="hidden lg:flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#ffea00] to-[#ffaa00] text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(255,170,0,0.2)] font-syncopate"
                >
                  <Zap size={14} fill="black" />
                  Sign In
                </button>
                {/* Club Activity Reference */}
                <div 
                   onClick={() => router.push('/')}
                   className="hidden xl:flex items-center gap-2 px-4 py-2 border border-red-500/20 rounded-full bg-red-500/5 cursor-pointer hover:bg-red-500/10 transition-all leading-none"
                >
                    <Activity size={14} className="text-red-500 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-red-500">Live Club Activity</span>
                </div>

                {/* COIN BALANCE WIDGET */}
                <CoinBalance onOpenTopUp={() => setIsTopUpOpen(true)} />

                <div className="flex items-center gap-6 text-white/40">
                    {isAdmin && (
                       <div 
                         onClick={() => {
                            const next = !showAdmin;
                            setShowAdmin(next);
                            // Pulse the news to other components
                            window.dispatchEvent(new CustomEvent('gasp_admin_toggle', { detail: next }));
                         }}
                         className={`p-2 rounded-xl transition-all cursor-pointer ${showAdmin ? 'bg-[#ffea00]/10 text-[#ffea00] shadow-[0_0_15px_#ffea0044]' : 'hover:text-white'}`}
                       >
                          <Star size={20} fill={showAdmin ? 'currentColor' : 'none'} />
                       </div>
                    )}
                    <Bell size={20} className="hover:text-[#ff00ff] cursor-pointer transition-colors" onClick={() => router.push('/')} />
                    <Settings size={20} className="hover:text-[#ff00ff] cursor-pointer transition-colors" onClick={() => router.push('/')} />
                </div>
                
                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer shadow-2xl group" onClick={() => setIsTopUpOpen(true)}>
                  <Wallet size={20} className="text-white/60 group-hover:text-[#00f0ff] transition-colors" />
                </div>
            </div>
        </header>

        {/* ATTACHED DISCOVERY HUB (SUBBAR) */}
        <div className="h-12 md:h-14 flex items-center justify-center bg-black/20 backdrop-blur-3xl border-b border-white/5 pointer-events-auto">
            <div className="w-full max-w-sm md:max-w-xl mx-auto px-4">
                <PersonaSearch />
            </div>
        </div>

        {/* TOP-UP DRAWER */}
        {isTopUpOpen && (
            <TopUpDrawer 
                userId={guestId}
                onClose={() => setIsTopUpOpen(false)} 
            />
        )}
    </div>
  );
}


