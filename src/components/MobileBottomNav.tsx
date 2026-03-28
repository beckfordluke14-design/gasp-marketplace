'use client';

import { motion } from 'framer-motion';
import { Home, Compass, MessageSquare, Zap, User, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MobileNavProps {
  onSelectChat: () => void;
  onOpenTopUp: () => void;
  unreadCounts?: Record<string, number>;
}

/**
 * 📲 SOVEREIGN MOBILE DOCK v2.0
 * Objective: Thumb-Optimized Revenue Conversion.
 * Placement: Fixed Bottom Inset.
 */
export default function MobileBottomNav({ onSelectChat, onOpenTopUp, unreadCounts = {} }: MobileNavProps) {
  const router = useRouter();
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  const items = [
    { icon: Home, label: 'Feed', active: true, action: () => router.push('/') },
    { icon: Compass, label: 'Discover', active: false, action: () => router.push('/') },
    // 🧬 THE CENTER STAKE PILLAR
    { icon: Zap, label: 'STAKE', active: false, isSpecial: true, action: () => onOpenTopUp() },
    { icon: MessageSquare, label: 'Chats', active: false, action: () => onSelectChat(), badge: totalUnread }, 
    { icon: User, label: 'Vault', active: false, action: () => router.push('/vault') },
  ];

  return (
    <div className="lg:hidden fixed bottom-6 inset-x-6 h-18 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] z-[1500] flex items-center justify-around px-4 pointer-events-auto shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
      {items.map((item) => {
        if (item.isSpecial) {
           return (
              <button
                key={item.label}
                onClick={item.action}
                className="relative -top-8 w-16 h-16 rounded-full bg-[#ff6b00] border-4 border-black flex flex-col items-center justify-center shadow-[0_10px_30px_rgba(255,107,0,0.6)] hover:scale-110 active:scale-90 transition-all group"
              >
                 <item.icon size={26} fill="black" className="text-black animate-pulse" />
                 <span className="text-[7px] font-black uppercase tracking-tighter text-black mt-0.5">{item.label}</span>
              </button>
           );
        }

        return (
          <button
            key={item.label}
            onClick={item.action}
            className={`relative flex flex-col items-center gap-1.5 transition-all w-12
              ${item.active ? 'text-white' : 'text-white/30'}
            `}
          >
            <item.icon size={20} className={item.active ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] text-white' : ''} />
            <span className="text-[8px] font-black uppercase tracking-[0.1em] leading-none">{item.label}</span>
            
            {item.active && (
               <motion.div layoutId="mobile-nav-line" className="absolute -bottom-2 w-4 h-0.5 bg-white shadow-[0_0_10px_white]" />
            )}

            {item.badge && item.badge > 0 && (
               <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#ff00ff] text-black text-[8px] font-black flex items-center justify-center shadow-[0_0_10px_#ff00ff]">
                  {item.badge}
               </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
