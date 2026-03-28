'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import ProfileAvatar from './profile/ProfileAvatar';
import { X, Search, Diamond, Bell, MessageSquare } from 'lucide-react';

interface ConnectionsHubProps {
  followedIds: string[];
  unreadCounts: Record<string, number>;
  onSelectProfile: (id: string) => void;
  profiles: any[];
}

/**
 * 🛰️ CONNECTIONS HUB (INBOX) v1.0
 * Objective: Manage followed profile connections via an iPhone-style list.
 */
export default function ConnectionsHub({ followedIds, unreadCounts, onSelectProfile, profiles }: ConnectionsHubProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Filter and sort profiles based on followed IDs
  const followedProfiles = profiles.filter(p => followedIds.includes(p.id));

  // Calculate total unread
  const totalUnread = followedIds.reduce((sum, id) => sum + (unreadCounts[id] || 0), 0);

  return (
    <>
       {/* 💎 INBOX TRIGGER */}
       <button 
         onClick={() => setIsOpen(true)}
         className="fixed bottom-28 right-10 z-[900] w-14 h-14 rounded-full bg-black/40 backdrop-blur-3xl border border-[#ff00ff]/30 flex items-center justify-center text-[#ff00ff] shadow-[0_0_20px_rgba(255,0,255,0.2)] hover:scale-105 transition-all group pointer-events-auto"
       >
          <Diamond size={22} className="group-hover:rotate-12 transition-transform" />
          {totalUnread > 0 && (
             <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#ffea00] text-black text-[10px] font-black flex items-center justify-center shadow-lg border border-black animate-bounce">
                {totalUnread}
             </div>
          )}
       </button>

       {/* 📱 THE CONNECTIONS LIST */}
       <AnimatePresence>
          {isOpen && (
            <motion.div 
               initial={{ x: '100%', opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               exit={{ x: '100%', opacity: 0 }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-black/95 backdrop-blur-3xl border-l border-white/5 shadow-[-30px_0_60px_rgba(0,0,0,1)] z-[3000] flex flex-col pointer-events-auto"
            >
               {/* Header */}
               <div className="p-8 border-b border-white/5 space-y-6">
                  <div className="flex items-center justify-between">
                     <h1 className="text-3xl font-syncopate font-black italic text-white tracking-tighter uppercase leading-none">Profiles</h1>
                     <button onClick={() => setIsOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white"><X size={20} /></button>
                  </div>
                  
                  <div className="relative group">
                     <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-white/40 transition-all" />
                     <input 
                       type="text" 
                       placeholder="Search profiles..." 
                       className="w-full h-11 bg-white/5 border border-white/5 rounded-2xl pl-11 pr-4 text-[10px] font-black uppercase text-white tracking-widest outline-none focus:border-[#ff00ff]/30 transition-all"
                     />
                  </div>
               </div>

               {/* Connections List */}
               <div className="flex-1 overflow-y-auto no-scrollbar py-2">
                  {followedProfiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-12 text-center opacity-20">
                       <Diamond size={48} className="mb-4" />
                       <p className="text-[10px] font-black uppercase tracking-[0.3em]">No profiles yet</p>
                    </div>
                  ) : (
                    followedProfiles.map((p) => {
                       const unread = unreadCounts[p.id] || 0;
                       return (
                          <motion.div 
                             key={p.id}
                             whileHover={{ x: -10 }}
                             onClick={() => { onSelectProfile(p.id); setIsOpen(false); }}
                             className="p-6 flex items-center gap-4 cursor-pointer hover:bg-white/[0.03] transition-all border-b border-white/[0.02] relative"
                          >
                             {/* iPhone Row Avatar */}
                             <div className="relative shrink-0">
                                <div className="w-14 h-14 rounded-full overflow-hidden border border-white/10 shadow-2xl">
                                   <ProfileAvatar src={p.image} alt={p.name} />
                                </div>
                                <div className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-[#00ff00] border-2 border-black shadow-[0_0_10px_#00ff00] animate-pulse" />
                             </div>

                             {/* Row Content */}
                             <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                   <span className="text-[12px] font-black uppercase text-white italic tracking-tighter truncate">{p.name}</span>
                                   <span className="text-[8px] text-white/20 uppercase font-bold tabular-nums">14:02</span>
                                </div>
                                <p className="text-[10px] text-white/40 truncate italic leading-none pr-8">
                                   {p.vibe || 'Connected.'}
                                </p>
                             </div>

                             {/* iPhone Swipe/Arrow Indicator */}
                             {unread > 0 ? (
                                <div className="w-5 h-5 rounded-full bg-[#ff00ff] text-black text-[9px] font-black flex items-center justify-center shadow-lg">
                                   {unread}
                                </div>
                             ) : (
                                <div className="w-1 h-1 rounded-full bg-white/20" />
                             )}
                          </motion.div>
                       );
                    })
                  )}
               </div>

               {/* Footer Status */}
               <div className="p-8 border-t border-white/5 bg-black/40">
                  <div className="flex items-center justify-between px-2">
                     <span className="text-[8px] font-black uppercase text-[#ffea00] tracking-widest italic">Secure Messenger</span>
                     <span className="text-[10px] text-white leading-none font-black italic">{followedProfiles.length} PROFILES</span>
                  </div>
               </div>
            </motion.div>
          )}
       </AnimatePresence>
    </>
  );
}
