'use client';

import { motion } from 'framer-motion';
import { Home, MessageSquare, Shield, User, Zap } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BottomNavProps {
  onOpenChatList?: () => void;
  onOpenTopUp?: () => void;
  unreadCount?: number;
}

export default function BottomNav({ onOpenChatList, onOpenTopUp, unreadCount = 0 }: BottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', icon: Home, href: '/', active: pathname === '/' },
    { label: 'Chat', icon: MessageSquare, onClick: onOpenChatList, active: false, badge: unreadCount },
    { label: 'Vault', icon: Shield, href: '/vault', active: pathname === '/vault' },
    { label: 'TopUp', icon: Zap, onClick: onOpenTopUp, active: false, highlight: true },
    { label: 'Profile', icon: User, href: '/vault', active: false },
  ];

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-[101] w-auto lg:hidden">
      <div className="relative group">
        {/* Neon Glow Aura */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#ff00ff]/20 via-[#00f0ff]/20 to-[#ffea00]/20 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
        
        {/* The Float Container - Vertical Blade */}
        <div className="relative bg-black/80 backdrop-blur-3xl border border-white/20 rounded-[3rem] p-3 flex flex-col items-center justify-center gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] py-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            
            if (item.highlight) {
              return (
                <button 
                  key={item.label} 
                  onClick={item.onClick}
                  className="w-14 h-14 rounded-full bg-white text-black flex flex-col items-center justify-center gap-0.5 shadow-[0_15px_30px_rgba(255,255,255,0.2)] hover:scale-110 active:scale-95 transition-all border-[4px] border-black group z-10"
                >
                  <Icon size={20} className="group-hover:rotate-12 transition-transform" />
                  <span className="text-[6px] font-black uppercase tracking-widest leading-none">TopUp</span>
                </button>
              );
            }

            const content = (
              <div className={`flex flex-col items-center gap-1.5 transition-all relative ${item.active ? 'text-white' : 'text-white/40 hover:text-white'}`}>
                <div className="relative">
                  <Icon size={20} className={item.active ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''} />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 w-4 h-4 bg-[#ff00ff] text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-black">
                      {item.badge}
                    </span>
                  )}
                </div>
                {item.active && (
                   <motion.div layoutId="nav-glow" className="absolute -right-3 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white rounded-full shadow-[0_0_10px_white]" />
                )}
              </div>
            );

            if (item.onClick) {
              return (
                <button key={item.label} onClick={item.onClick} className="focus:outline-none active:scale-95 transition-transform">
                  {content}
                </button>
              );
            }

            return (
              <Link key={item.label} href={item.href || '#'} className="focus:outline-none active:scale-95 transition-transform">
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
