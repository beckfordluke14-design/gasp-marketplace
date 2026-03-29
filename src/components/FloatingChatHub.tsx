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
}

export default function FloatingChatHub({ 
  onSelectChat, 
  onSelectProfile,
  followingIds = [], 
  profiles = [], 
  unreadCounts = {} 
}: FloatingChatHubProps) {
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + Number(b), 0);
  
  // 🧬 HUB STATE: Store the rotation of the favorite orbiters
  const rotation = useMotionValue(0);
  const springRotation = useSpring(rotation, { damping: 30, stiffness: 200 });

  // Get up to 10 favorite personas for the wheel
  const favorites = useMemo(() => {
    return profiles.filter(p => followingIds.includes(p.id)).slice(0, 10);
  }, [followingIds, profiles]);

  const hasFavorites = favorites.length > 0;

  if (!hasFavorites && totalUnread === 0) {
      return (
        <div className="fixed bottom-6 right-6 z-[1500] pointer-events-none md:bottom-12 md:right-12">
            <motion.button
                onClick={onSelectChat}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="pointer-events-auto w-16 h-16 rounded-full bg-black/10 backdrop-blur-3xl border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)] active:scale-90"
            >
                <MessageSquare size={24} />
            </motion.button>
        </div>
      );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[1500] pointer-events-none md:bottom-12 md:right-12">
       <div className="relative flex items-center justify-center">
          
          {/* 🧬 THE ROTATING CAROUSEL ARC */}
          <motion.div 
             drag="x"
             dragConstraints={{ left: -200, right: 200 }}
             onDrag={(e, info) => {
                rotation.set(rotation.get() + info.delta.x * 0.5);
             }}
             className="absolute pointer-events-auto cursor-grab active:cursor-grabbing"
             style={{ width: 200, height: 200 }}
          >
             <AnimatePresence>
                {favorites.map((p, i) => {
                   // Calculate positioning based on rotation + base angle
                   const baseAngle = (i / favorites.length) * 360;
                   // We limit it to a semi-circle arc above the button
                   const arcSize = favorites.length > 4 ? 180 : 90;
                   const spacing = arcSize / (favorites.length - 1 || 1);
                   const startAngle = 180 + (180 - arcSize) / 2;
                   
                   return (
                      <Orbiter 
                         key={p.id}
                         p={p}
                         index={i}
                         total={favorites.length}
                         rotation={springRotation}
                         onSelect={() => onSelectProfile(p.id)}
                         unreadCount={unreadCounts[p.id] || 0}
                      />
                   );
                })}
             </AnimatePresence>
          </motion.div>

          {/* 🧩 THE CORE CHAT ANCHOR */}
          <motion.button
            onClick={onSelectChat}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            className="relative z-10 pointer-events-auto w-16 h-16 rounded-full bg-black/10 backdrop-blur-3xl border border-white/10 flex items-center justify-center group shadow-[0_25px_80px_rgba(0,0,0,0.8)]"
          >
             <div className={`absolute inset-0 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity ${totalUnread > 0 ? 'bg-[#ff00ff]' : 'bg-[#00f0ff]'}`} />
             
             <MessageSquare 
               size={24} 
               className={`transition-all ${totalUnread > 0 ? 'text-[#ff00ff] fill-[#ff00ff]/20 drop-shadow-[0_0_10px_#ff00ff]' : hasFavorites ? 'text-[#ffea00] drop-shadow-[0_0_10px_#ffea00/40]' : 'text-white/40 group-hover:text-white'}`} 
             />

             {totalUnread > 0 && (
                <div className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[20px] bg-[#ff00ff] text-black text-[9px] font-black rounded-full flex items-center justify-center border-2 border-black shadow-[0_0_15px_#ff00ff] animate-bounce">
                   {totalUnread}
                </div>
             )}

             {totalUnread === 0 && favorites.length > 0 && (
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
    // Each orbiter calculates its own x/y based on the global rotation + its index
    const radius = 70;
    const baseAngle = -90 + (index - (total - 1) / 2) * (180 / Math.max(total - 1, 3));
    
    const x = useTransform(rotation, (r: number) => {
       const angle = baseAngle + r;
       return Math.cos((angle * Math.PI) / 180) * radius;
    });

    const y = useTransform(rotation, (r: number) => {
        const angle = baseAngle + r;
        return Math.sin((angle * Math.PI) / 180) * radius;
    });

    const opacity = useTransform(rotation, (r: number) => {
        const angle = baseAngle + r;
        // Fade out if out of the top arc view (roughly -180 to 0)
        if (angle < -220 || angle > 40) return 0;
        return 1;
    });

    const scale = useTransform(rotation, (r: number) => {
        const angle = baseAngle + r;
        // Scale up when in the center top (-90 degrees)
        const dist = Math.abs(angle + 90);
        return Math.max(0.6, 1.2 - dist / 100);
    });

    return (
        <motion.button
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            style={{ x, y, opacity, scale }}
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
