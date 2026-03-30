'use client';

import { motion } from 'framer-motion';
import { Home, Compass, MessageSquare, Zap, User, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MobileNavProps {
  onSelectChat: () => void;
  onOpenTopUp: () => void;
  unreadCounts?: Record<string, number>;
  followingIds?: string[];
  profiles?: any[];
}

/**
 * 📲 SOVEREIGN MOBILE DOCK v2.0
 * Objective: Thumb-Optimized Revenue Conversion.
 * Placement: Fixed Bottom Inset.
 */
export default function MobileBottomNav({ onSelectChat, onOpenTopUp, unreadCounts = {}, followingIds = [], profiles = [] }: MobileNavProps) {
  const router = useRouter();
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  const favProfiles = profiles.filter(p => followingIds.includes(p.id)).slice(0, 3);

  const items = [
    { icon: Home, label: 'Hub', active: true, action: () => router.push('/') },
    { icon: Compass, label: 'Intel', active: false, action: () => router.push('/') },
    // 🧬 THE CENTER STAKE PILLAR
    { icon: Zap, label: 'TOP UP', active: false, isSpecial: true, action: () => onOpenTopUp() },
    { icon: MessageSquare, label: 'Comms', active: false, action: () => onSelectChat(), badge: totalUnread, hasFavorites: favProfiles.length > 0 }, 
    { icon: User, label: 'Vault', active: false, action: () => router.push('/vault') },
  ];

  return (
    <div className="lg:hidden fixed bottom-6 inset-x-6 h-18 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] z-[1500] flex items-center justify-around px-4 pointer-events-auto shadow-[0_30px_100px_rgba(0,0,0,0.9)] ring-1 ring-white/5">
      {items.map((item) => {
        if (item.isSpecial) {
           return (
              <button
                key={item.label}
                onClick={item.action}
                className="relative -top-8 w-16 h-16 rounded-full bg-[#00f0ff] border-4 border-black flex flex-col items-center justify-center shadow-[0_15px_40px_rgba(0,240,255,0.4)] hover:scale-110 active:scale-95 transition-all group overflow-hidden"
              >
                 <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
                 <item.icon size={26} fill="black" className="text-black relative z-10" />
                 <span className="text-[7px] font-black uppercase tracking-tighter text-black mt-0.5 relative z-10">{item.label}</span>
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
            <div className="relative">
              <item.icon size={20} className={item.active ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] text-white' : ''} />
              
              {/* 🧬 FAVORITES HUB ATTACHMENT */}
              {item.hasFavorites && (
                 <div className="absolute -top-3 -right-3 flex -space-x-1.5">
                    {favProfiles.map((p, i) => (
                       <motion.div 
                         key={p.id}
                         initial={{ scale: 0, y: 10 }}
                         animate={{ scale: 1, y: 0 }}
                         transition={{ delay: i * 0.1 }}
                         className="w-3.5 h-3.5 rounded-full border border-black overflow-hidden bg-zinc-800 shadow-[0_0_5px_rgba(0,0,0,0.5)]"
                       >
                          <img src={p.image} className="w-full h-full object-cover" />
                       </motion.div>
                    ))}
                 </div>
              )}
            </div>

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
