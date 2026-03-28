'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import ProfileAvatar from './profile/ProfileAvatar';
import { Eye, EyeOff, MessageSquare } from 'lucide-react';

interface ChatClusterProps {
  activeChatIds: string[];
  unreadCounts: Record<string, number>;
  onRestore: (id: string) => void;
  profiles: any[];
}

/**
 * 🛰️ NEURAL BUBBLY HUB v1.0
 * Objective: Manage high-volume profile connections via a floating, swarming cluster.
 */
export default function ChatCluster({ activeChatIds, unreadCounts, onRestore, profiles }: ChatClusterProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (activeChatIds.length === 0) return null;

  // 🧬 DYNAMIC SCALING: Icons shrink as the cluster grows
  const getIconSize = () => {
     const count = activeChatIds.length;
     if (count <= 1) return 'w-14 h-14';
     if (count <= 4) return 'w-11 h-11';
     if (count <= 8) return 'w-9 h-9';
     return 'w-7 h-7';
  };

  const iconClass = getIconSize();

  // Calculate total unread
  const totalUnread = activeChatIds.reduce((sum, id) => sum + (unreadCounts[id] || 0), 0);

  return (
    <div className="fixed bottom-10 right-10 z-[1000] flex flex-col items-end gap-4 pointer-events-none">
       {/* 👁️ THE CLUSTER DOCK */}
       <AnimatePresence>
          {isVisible && (
            <motion.div 
               initial={{ scale: 0.8, opacity: 0, y: 50 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.8, opacity: 0, y: 50 }}
               className="bg-black/20 backdrop-blur-3xl p-6 rounded-[3rem] border border-white/5 shadow-[0_30px_60px_rgba(0,0,0,1)] pointer-events-auto"
            >
               <div className="flex flex-wrap items-center justify-center gap-3 max-w-[280px]">
                  {activeChatIds.map((id, idx) => {
                     const profileItem = profiles.find(p => p.id === id);
                     if (!profileItem) return null;
                     const unread = unreadCounts[id] || 0;

                     return (
                        <motion.button
                          key={id}
                          layout
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          whileHover={{ scale: 1.2, zIndex: 50 }}
                          onClick={() => onRestore(id)}
                          className="relative group"
                        >
                           {/* THE BUBBLE NODE */}
                           <div className={`${iconClass} rounded-full overflow-hidden border-2 transition-all relative shadow-2xl ${
                             unread > 0 ? 'border-[#ff00ff]' : 'border-white/10 group-hover:border-white/40'
                           }`}>
                              <ProfileAvatar src={profileItem.image} alt={profileItem.name} />
                              
                              {/* 🟢 GREEN STATUS GLOW */}
                              <div className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-[#00ff00] border border-black shadow-[0_0_8px_#00ff00] animate-pulse z-20" />
                              
                              {/* UNREAD BADGE */}
                              {unread > 0 && (
                                 <div className="absolute inset-0 bg-[#ff00ff]/20 flex items-center justify-center">
                                    <span className="text-[10px] font-black text-white drop-shadow-md">{unread}</span>
                                 </div>
                              )}
                           </div>
                        </motion.button>
                     );
                  })}
               </div>
            </motion.div>
          )}
       </AnimatePresence>

       {/* HUB TOGGLE BUTTON */}
       <button 
         onClick={() => setIsVisible(!isVisible)}
         className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-3xl border border-white/10 flex items-center justify-center text-[#ff00ff] hover:text-white transition-all shadow-2xl pointer-events-auto active:scale-90"
       >
          {isVisible ? <EyeOff size={20} /> : <MessageSquare size={20} />}
          {totalUnread > 0 && (
             <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#ffea00] text-black text-[10px] font-black flex items-center justify-center animate-bounce border border-black shadow-lg">
                {totalUnread}
             </div>
          )}
       </button>
    </div>
  );
}
