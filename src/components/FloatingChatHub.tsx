'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Star } from 'lucide-react';
import { useUser } from './providers/UserProvider';
import { useState, useMemo } from 'react';

/**
 * 🛰️ SOVEREIGN FLOATING CHAT HUB v1.0
 * Objective: Persistent, non-intrusive re-entry point for favorite conversations.
 * Design: High-transparency glassmorphism, floating in bottom-right.
 * Dynamic: Populates with favorite persona avatars as the user "bookmarks" them.
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
  
  // Get top 4 favorite personas to display as orbiters
  const favorites = useMemo(() => {
    return profiles.filter(p => followingIds.includes(p.id)).slice(0, 4);
  }, [followingIds, profiles]);

  if (followingIds.length === 0 && totalUnread === 0) {
      // Show default chat icon if no favorites/unreads to keep the system accessible
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
       <div className="relative">
          
          {/* 🧬 THE ORBITER BUBBLES (Favorites Hub) */}
          <AnimatePresence>
             {favorites.map((p, i) => {
                // Calculate position in a fan-out arc above the main button
                const angle = 210 + (i * 40); // 210, 250, 290, 330 degrees
                const radius = 60; // distance from center
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;

                return (
                   <motion.button
                      key={p.id}
                      onClick={() => onSelectProfile(p.id)}
                      initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                      animate={{ scale: 1, x, y, opacity: 1 }}
                      exit={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                      whileHover={{ scale: 1.2, transition: { duration: 0.2 } }}
                      className="absolute left-1/2 top-1/2 -ml-5 -mt-5 pointer-events-auto w-10 h-10 rounded-full border border-white/20 overflow-hidden shadow-2xl bg-black/20 backdrop-blur-xl group"
                   >
                       <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                       
                       {/* Unread indicator for this specific favorite */}
                       {unreadCounts[p.id] > 0 && (
                          <div className="absolute top-0 right-0 w-3 h-3 bg-[#ff00ff] rounded-full border-2 border-black animate-pulse" />
                       )}
                   </motion.button>
                );
             })}
          </AnimatePresence>

          {/* 🧩 THE CORE CHAT ANCHOR */}
          <motion.button
            onClick={onSelectChat}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            className="relative pointer-events-auto w-16 h-16 rounded-full bg-black/10 backdrop-blur-3xl border border-white/10 flex items-center justify-center group shadow-[0_25px_80px_rgba(0,0,0,0.8)]"
          >
             {/* Dynamic Glow Aura */}
             <div className={`absolute inset-0 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity ${totalUnread > 0 ? 'bg-[#ff00ff]' : 'bg-[#00f0ff]'}`} />
             
             <MessageSquare 
               size={24} 
               className={`transition-all ${totalUnread > 0 ? 'text-[#ff00ff] fill-[#ff00ff]/20 drop-shadow-[0_0_10px_#ff00ff]' : 'text-white/40 group-hover:text-white'}`} 
             />

             {/* Total Global Unread Badge */}
             {totalUnread > 0 && (
                <div className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[20px] bg-[#ff00ff] text-black text-[9px] font-black rounded-full flex items-center justify-center border-2 border-black shadow-[0_0_15px_#ff00ff] animate-bounce">
                   {totalUnread}
                </div>
             )}

             {/* Small Star Hint if following but no unreads */}
             {totalUnread === 0 && followingIds.length > 0 && (
                <div className="absolute -bottom-1 -left-1 text-[#ffea00] drop-shadow-[0_0_5px_#ffea00]">
                   <Star size={12} fill="currentColor" />
                </div>
             )}
          </motion.button>

       </div>
    </div>
  );
}
