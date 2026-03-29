'use client';

import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { MessageSquare, Star, X } from 'lucide-react';
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
  if (isOpen) return null;
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
        <div className={`fixed bottom-6 ${isOpen ? 'left-6' : 'right-6'} z-[2500] pointer-events-none md:bottom-12 ${isOpen ? 'md:left-12' : 'md:right-12'} transition-all duration-700`}>
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
    <div className={`fixed bottom-6 ${isOpen ? 'left-6' : 'right-6'} z-[2500] pointer-events-none md:bottom-12 ${isOpen ? 'md:left-12' : 'md:right-12'} transition-all duration-700`}>
       <div className="relative flex items-center justify-center">
          
          {/* 🎡 THE SOVEREIGN RADIAL DIAL (V4.25) */}
          <AnimatePresence>
             <motion.div 
               initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
               animate={{ opacity: 1, rotate: 0, scale: 1 }}
               exit={{ opacity: 0, scale: 0.5 }}
               className="absolute pointer-events-auto"
               style={{ width: 140, height: 140 }}
             >
                <motion.div
                  drag="x"
                  dragConstraints={{ left: -1000, right: 1000 }}
                  className="w-full h-full relative cursor-grab active:cursor-grabbing"
                  onDrag={(e, info) => {
                     // 🧬 JOG WHEEL LOGIC: High-inertia rotation
                     rotation.set(rotation.get() + info.delta.x * 1.2);
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
          </AnimatePresence>

          {/* 🧩 THE CORE ANCHOR NODE (TOGGLE) */}
          <motion.button
            onClick={handleAnchorClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.85 }}
            className={`relative z-50 pointer-events-auto w-16 h-16 rounded-full transition-all duration-700 flex items-center justify-center group shadow-[0_25px_100px_rgba(0,0,0,1)] border ${
              isOpen ? 'bg-[#ffea00] border-[#ffea00] text-black ring-4 ring-[#ffea00]/20' : 'bg-[#0a0a0a]/80 backdrop-blur-3xl border-white/10 text-white'
            }`}
          >
             {isOpen ? (
                <X size={26} className="font-black" />
             ) : (
                <>
                   <div className={`absolute inset-0 rounded-full blur-3xl opacity-40 group-hover:opacity-60 transition-opacity ${totalUnread > 0 ? 'bg-[#ff00ff]' : 'bg-[#00f0ff]'}`} />
                   <MessageSquare 
                     size={24} 
                     className={`transition-all duration-500 scale-110 ${totalUnread > 0 ? 'text-[#ff00ff] fill-[#ff00ff]/20' : 'text-white/60 group-hover:text-white'}`} 
                   />
                </>
             )}

             {totalUnread > 0 && !isOpen && (
                <div className="absolute -top-1 -right-1 px-2 py-0.5 min-w-[22px] bg-[#ff00ff] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-black shadow-[0_0_20px_#ff00ff] animate-pulse">
                   {totalUnread}
                </div>
             )}
          </motion.button>
       </div>
    </div>
  );
}

function Orbiter({ p, index, total, rotation, onSelect, unreadCount }: { p: any, index: number, total: number, rotation: any, onSelect: () => void, unreadCount: number }) {
    // 🧬 SOVEREIGN ORBIT ENGINE: R=85 (Syndicate Ring)
    const radius = 85;
    
    // Distribute personas on a wide 330-degree arc for global visibility
    const arcSpread = 330; 
    const baseAngle = -90 - (arcSpread / 2) + (index / Math.max(total - 1, 1)) * arcSpread;
    
    const x = useTransform(rotation, (r: number) => Math.cos(((baseAngle + r) * Math.PI) / 180) * radius);
    const y = useTransform(rotation, (r: number) => Math.sin(((baseAngle + r) * Math.PI) / 180) * radius);

    // 🎇 SYNDICATE STABILITY: Every profile is 100% opaque and always in view
    const opacity = 1;
    const scale = 1;

    const zIndex = useTransform(rotation, (r: number) => {
       const angle = (baseAngle + r + 90) % 360;
       return Math.round(100 - Math.abs(angle > 180 ? angle - 360 : angle < -180 ? angle + 360 : angle));
    });

    return (
        <motion.button
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            style={{ x, y, opacity, scale, zIndex }}
            className="absolute left-1/2 top-1/2 -ml-6 -mt-6 pointer-events-auto w-12 h-12 rounded-full border-2 border-white/20 overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] bg-black/80 backdrop-blur-3xl group"
        >
            <img src={p.image} className="w-full h-full object-cover group-hover:scale-125 transition-all duration-300" />
            {unreadCount > 0 && (
                <div className="absolute inset-0 rounded-full border-2 border-[#ff00ff] animate-ping opacity-50" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.button>
    );
}
