'use client';

import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { MessageSquare, Star } from 'lucide-react';
import { useUser } from './providers/UserProvider';
import { useState, useMemo, useEffect } from 'react';

/**
 * 🛰️ SOVEREIGN FLOATING CHAT HUB v2.0 (ROTATING JOG WHEEL)
 * Objective: Persistent, high-haptic re-entry point.
 * Design: Intelligent Jog Wheel for Favorite Personas.
 * Interaction: Swipe/Rotate to cycle through all favorited identities.
 */

interface FloatingChatHubProps {
  onSelectChat: () => void;
  onSelectProfile: (id: string) => void;
  followingIds: string[];
  profiles: any[];
  unreadCounts: Record<string, number>;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function FloatingChatHub({ 
  onSelectChat, 
  onSelectProfile,
  followingIds = [], 
  profiles = [], 
  unreadCounts = {},
  isOpen = false,
  onClose
}: FloatingChatHubProps) {
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + Number(b), 0);
  
  // 🧬 DIAL STATE: Global rotation of the satellite fleet
  const [activeRotation, setActiveRotation] = useState(0);
  const rotation = useMotionValue(0);
  const springRotation = useSpring(rotation, { damping: 40, stiffness: 300 });

  // Filter and sort favorites for the dial
  const favorites = useMemo(() => {
    return profiles.filter(p => followingIds.includes(p.id)).slice(0, 12);
  }, [followingIds, profiles]);

  const hasFavorites = favorites.length > 0;

  // 🛡️ DUAL-ACTION TOGGLE: Open Discovery or Close Active Chat
  const handleAnchorClick = () => {
    if (isOpen && onClose) {
       onClose();
    } else {
       onSelectChat();
    }
  };

  if (!hasFavorites && totalUnread === 0 && !isOpen) {
      return (
        <div className="fixed bottom-6 right-6 z-[2500] pointer-events-none md:bottom-12 md:right-12">
            <motion.button
                onClick={handleAnchorClick}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.05, opacity: 1 }}
                className="pointer-events-auto w-16 h-16 rounded-full bg-black/10 backdrop-blur-3xl border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)] active:scale-90"
            >
                <MessageSquare size={24} />
            </motion.button>
        </div>
      );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[2500] pointer-events-none md:bottom-12 md:right-12">
       <div className="relative flex items-center justify-center">
          
          {/* 🎡 THE SOVEREIGN RADIAL DIAL */}
          <AnimatePresence>
            {!isOpen && (
               <motion.div 
                 initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
                 animate={{ opacity: 1, rotate: 0, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.5 }}
                 className="absolute pointer-events-auto"
                 style={{ width: 180, height: 180 }}
               >
                  <motion.div
                    drag="x"
                    dragConstraints={{ left: -300, right: 300 }}
                    className="w-full h-full relative cursor-grab active:cursor-grabbing"
                    onDrag={(e, info) => {
                       // DIAL LOGIC: Map x-drag to polar rotation
                       rotation.set(rotation.get() + info.delta.x * 0.7);
                    }}
                  >
                     {favorites.map((p, i) => (
                        <Orbiter 
                           key={p.id}
                           p={p}
                           index={i}
                           total={favorites.length}
                           rotation={springRotation}
                           onSelect={() => onSelectProfile(p.id)}
                           unreadCount={unreadCounts[p.id] || 0}
                        />
                     ))}
                  </motion.div>
               </motion.div>
            )}
          </AnimatePresence>

          {/* 🧩 THE CORE ANCHOR NODE (TOGGLE) */}
          <motion.button
            onClick={handleAnchorClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            className={`relative z-30 pointer-events-auto w-16 h-16 rounded-full transition-all duration-500 flex items-center justify-center group shadow-[0_25px_80px_rgba(0,0,0,0.8)] border ${
              isOpen ? 'bg-[#ff00ff] border-[#ff00ff] text-black' : 'bg-black/10 backdrop-blur-3xl border-white/10 text-white'
            }`}
          >
             {isOpen ? (
                <MessageSquare size={24} className="fill-current" />
             ) : (
                <>
                   <div className={`absolute inset-0 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity ${totalUnread > 0 ? 'bg-[#ff00ff]' : 'bg-[#00f0ff]'}`} />
                   <MessageSquare 
                     size={24} 
                     className={`transition-all ${totalUnread > 0 ? 'text-[#ff00ff] fill-[#ff00ff]/20 drop-shadow-[0_0_10px_#ff00ff]' : hasFavorites ? 'text-[#ffea00] drop-shadow-[0_0_10px_#ffea00/40]' : 'text-white/40 group-hover:text-white'}`} 
                   />
                </>
             )}

             {totalUnread > 0 && !isOpen && (
                <div className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[20px] bg-[#ff00ff] text-black text-[9px] font-black rounded-full flex items-center justify-center border-2 border-black shadow-[0_0_15px_#ff00ff] animate-bounce">
                   {totalUnread}
                </div>
             )}

             {totalUnread === 0 && favorites.length > 0 && !isOpen && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#ffea00] text-black text-[9px] font-black rounded-full flex items-center justify-center border-2 border-black shadow-[0_0_15px_rgba(255,234,0,0.4)]">
                   {favorites.length}
                </div>
             )}
          </motion.button>

       </div>
    </div>
  );
}

function Orbiter({ p, index, total, rotation, onSelect, unreadCount }: { p: any, index: number, total: number, rotation: any, onSelect: () => void, unreadCount: number }) {
    // 🧬 POLAR COORDINATE ENGINE: Radius = 75px
    const radius = 75;
    
    // Spread favorites across a 270-degree arc (top-left to top-right)
    const arcSpread = total > 6 ? 220 : 160;
    const baseAngle = -90 - (arcSpread / 2) + (index / Math.max(total - 1, 1)) * arcSpread;
    
    // EDGE PROTECTION: Clamp x to prevent overflow on tight screens
    const x = useTransform(rotation, (r: number) => {
       const angle = baseAngle + r;
       const rawX = Math.cos((angle * Math.PI) / 180) * radius;
       // Safety Margin: Ensure it doesn't cross the right boundary too far
       return Math.min(60, Math.max(-100, rawX));
    });

    const y = useTransform(rotation, (r: number) => {
        const angle = baseAngle + r;
        return Math.sin((angle * Math.PI) / 180) * radius;
    });

    const opacity = useTransform(rotation, (r: number) => {
        const angle = baseAngle + r;
        // Fade if outside the active dial arc
        const distFromCenter = Math.abs(angle + 90);
        return distFromCenter > 110 ? 0 : 1;
    });

    const scale = useTransform(rotation, (r: number) => {
        const angle = baseAngle + r;
        // EXPAND CURRENT SELECT: Grow when approaching the top focus point (-90 deg)
        const distFromCenter = Math.abs(angle + 90);
        return Math.max(0.7, 1.4 - (distFromCenter / 90));
    });

    const zIndex = useTransform(rotation, (r: number) => {
       const angle = baseAngle + r;
       return Math.round(100 - Math.abs(angle + 90));
    });

    return (
        <motion.button
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            style={{ x, y, opacity, scale, zIndex }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute left-1/2 top-1/2 -ml-5 -mt-5 pointer-events-auto w-10 h-10 rounded-full border border-white/20 overflow-hidden shadow-2xl bg-black/20 backdrop-blur-xl group z-20"
        >
            <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
            {unreadCount > 0 && (
                <div className="absolute top-0 right-0 w-3 h-3 bg-[#ff00ff] rounded-full border-2 border-black animate-pulse" />
            )}
        </motion.button>
    );
}
