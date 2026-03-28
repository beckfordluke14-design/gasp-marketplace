'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { initialProfiles, proxyImg } from '@/lib/profiles';
import Image from 'next/image';
import ProfileAvatar from './profile/ProfileAvatar';

interface ChatDockProps {
  minimizedIds: string[];
  unreadCounts: Record<string, number>;
  onRestore: (id: string) => void;
  profiles: any[];
}

/**
 * THE CHAT DOCK (Minimized Profiles)
 * Objective: High-end taskbar for characters with LIVE notifications.
 */
export default function ChatDock({ minimizedIds, unreadCounts, onRestore, profiles }: ChatDockProps) {
  if (minimizedIds.length === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[400] flex items-center gap-4 bg-black/40 backdrop-blur-3xl px-6 py-4 rounded-[2.5rem] border border-white/5 shadow-[0_0_50px_rgba(0,0,0,1)]">
      <AnimatePresence mode="popLayout">
        {minimizedIds.map((id) => {
          const profileItem = profiles.find((p) => p.id === id);
          if (!profileItem) return null;
          
          const unread = unreadCounts[id] || 0;

          return (
            <motion.button
              key={id}
              layout
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ y: -10 }}
              onClick={() => onRestore(id)}
              className="relative group"
            >
              <div className={`
                w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all relative
                ${unread > 0 ? 'border-[#ff00ff] shadow-[0_0_20px_rgba(255,0,255,0.4)]' : 'border-[#ff00ff]/20 group-hover:border-[#ff00ff]'}
              `}>
                <ProfileAvatar src={profileItem.image} alt={profileItem.name} />
                
                {/* Status Indicator (GREEN GLOW) */}
                <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-[#00ff00] border-2 border-black shadow-[0_0_8px_#00ff00] animate-pulse" />

                {/* Notification Badge (Spontaneous New Message Indicator) */}
                {unread > 0 && (
                   <div className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-[#ff00ff] text-black text-[8px] font-black rounded-full shadow-[0_0_10px_rgba(255,0,255,1)] animate-bounce">
                       {unread}
                   </div>
                )}
              </div>

              {/* Tooltip */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {profileItem.name.toLowerCase()}
              </div>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
