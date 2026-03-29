'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, MessageSquare, Star, Bell, Lock, Mic, X } from 'lucide-react';

/**
 * 🛰️ NEURAL PULSE HUB v1.0
 * Objective: High-fidelity re-engagement engine.
 * Placement: Top-center floating pill.
 * Behavior: Expands to show real-time events from favorite personas.
 */

interface PulseEvent {
  id: string;
  type: 'typing' | 'message' | 'post' | 'voice' | 'vault';
  personaId: string;
  personaName: string;
  personaImage: string;
  content: string;
  timestamp: number;
}

export default function NeuralPulseHub({ 
  followingIds = [], 
  profiles = [], 
  unreadCounts = {},
  onSelectProfile = () => {}
}: { 
  followingIds?: string[], 
  profiles?: any[], 
  unreadCounts?: Record<string, number>,
  onSelectProfile?: (id: string) => void
}) {
  const [activeEvent, setActiveEvent] = useState<PulseEvent | null>(null);
  const [queue, setQueue] = useState<PulseEvent[]>([]);

  // 1. MONITOR UNREADS FOR NOTIFICATIONS
  useEffect(() => {
    const unreadPersonaId = Object.keys(unreadCounts).find(id => unreadCounts[id] > 0);
    if (unreadPersonaId) {
      const p = profiles.find(profile => profile.id === unreadPersonaId);
      if (p) {
        addEvent({
          id: `msg-${unreadPersonaId}-${Date.now()}`,
          type: 'message',
          personaId: p.id,
          personaName: p.name,
          personaImage: p.image,
          content: `${unreadCounts[unreadPersonaId]} new message${unreadCounts[unreadPersonaId] > 1 ? 's' : ''}`,
          timestamp: Date.now()
        });
      }
    }
  }, [unreadCounts, profiles]);

  // 2. MOCK "TYPING" EVENTS FROM FAVORITES (For Atmospheric Pulse)
  useEffect(() => {
    if (followingIds.length === 0) return;

    const interval = setInterval(() => {
      // 20% chance to show a "Typing" pulse from a favorite
      if (Math.random() > 0.8) {
        const favId = followingIds[Math.floor(Math.random() * followingIds.length)];
        const p = profiles.find(profile => profile.id === favId);
        if (p) {
          addEvent({
            id: `typing-${favId}-${Date.now()}`,
            type: 'typing',
            personaId: p.id,
            personaName: p.name,
            personaImage: p.image,
            content: 'is typing a message...',
            timestamp: Date.now()
          });
        }
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [followingIds, profiles]);

  const addEvent = (ev: PulseEvent) => {
    // Don't show if already active or in queue for same persona/type combo
    if (activeEvent?.personaId === ev.personaId && activeEvent?.type === ev.type) return;
    
    setQueue(prev => {
      if (prev.some(e => e.personaId === ev.personaId && e.type === ev.type)) return prev;
      return [...prev, ev];
    });
  };

  useEffect(() => {
    if (!activeEvent && queue.length > 0) {
      const next = queue[0];
      setActiveEvent(next);
      setQueue(prev => prev.slice(1));

      // Auto-clear most events after 4s (typing) or 6s (messages)
      const duration = next.type === 'typing' ? 4000 : 6000;
      const timer = setTimeout(() => {
        setActiveEvent(null);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [activeEvent, queue]);

  return (
    <div className="fixed top-1 md:top-2 left-1/2 -translate-x-1/2 z-[2000] pointer-events-none w-full max-w-xs md:max-w-sm px-4">
       <AnimatePresence mode="wait">
          {activeEvent && (
            <motion.div
               key={activeEvent.id}
               initial={{ y: -60, scale: 0.9, opacity: 0, filter: 'blur(10px)' }}
               animate={{ y: 0, scale: 1, opacity: 1, filter: 'blur(0px)' }}
               exit={{ y: -60, scale: 0.9, opacity: 0, filter: 'blur(10px)' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               onClick={() => onSelectProfile(activeEvent.personaId)}
               className="pointer-events-auto cursor-pointer w-full flex justify-center"
            >
               <div className="relative group w-full max-w-[280px]">
                  {/* 🌌 NATIVE ATMOSPHERIC PULSE (Subtle) */}
                  <div className={`absolute -inset-1 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-all duration-1000 ${
                     activeEvent.type === 'message' || activeEvent.type === 'vault' 
                     ? 'bg-[#ff00ff]' 
                     : 'bg-[#00f0ff]'
                  }`} />
                  
                  {/* 🧬 THE DYNAMIC PILL (Native GASP Glassmorphism) */}
                  <div className={`relative flex items-center gap-3 bg-black/10 backdrop-blur-3xl border rounded-full px-3.5 py-1.5 shadow-[0_15px_40px_rgba(0,0,0,0.4)] transition-all duration-500 overflow-hidden ${
                     activeEvent.type === 'message' || activeEvent.type === 'vault' 
                     ? 'border-[#ff00ff]/20' 
                     : 'border-[#00f0ff]/20'
                  }`}>
                     
                     {/* ⚡ NATIVE SHIMMER */}
                     <motion.div 
                        initial={{ x: '-100%' }}
                        animate={{ x: '200%' }}
                        transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"
                     />
                     
                     <div className="relative shrink-0 flex items-center">
                        <div className={`w-8 h-8 rounded-full overflow-hidden border transition-all duration-700 ${
                           activeEvent.type === 'message' || activeEvent.type === 'vault' 
                           ? 'border-[#ff00ff]/30' 
                           : 'border-[#00f0ff]/30'
                        }`}>
                          <img 
                            src={activeEvent.personaImage} 
                            alt="" 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        </div>
                        {activeEvent.type === 'typing' && (
                           <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#00f0ff] rounded-full flex items-center justify-center border border-black shadow-[0_0_10px_#00f0ff]">
                              <div className="flex gap-0.5">
                                 <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 0.8, times: [0, 0.5, 1] }} className="w-0.5 h-0.5 bg-black rounded-full" />
                                 <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2, times: [0, 0.5, 1] }} className="w-0.5 h-0.5 bg-black rounded-full" />
                              </div>
                           </div>
                        )}
                        {activeEvent.type === 'message' && (
                           <motion.div 
                             animate={{ scale: [1, 1.1, 1] }}
                             transition={{ repeat: Infinity, duration: 1.5 }}
                             className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#ff00ff] rounded-full flex items-center justify-center border border-black shadow-[0_0_10px_#ff00ff]"
                           >
                              <MessageSquare size={8} className="text-white fill-current" />
                           </motion.div>
                        )}
                     </div>

                     <div className="flex flex-col relative z-10 overflow-hidden">
                        <div className="flex items-center gap-1.5">
                           <span className="text-[10px] font-black uppercase text-white tracking-widest leading-none drop-shadow-sm font-outfit italic">
                              {activeEvent.personaName}
                           </span>
                           <div className="w-0.5 h-0.5 rounded-full bg-white/20" />
                           <span className={`text-[6px] font-black uppercase italic tracking-[0.2em] whitespace-nowrap ${
                              activeEvent.type === 'message' ? 'text-[#ff00ff]' : 'text-[#00f0ff]'
                           }`}>
                              {activeEvent.type === 'message' ? 'Signal' : 'Neural'}
                           </span>
                        </div>
                        <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.05em] leading-tight mt-0.5 truncate max-w-[120px] font-outfit italic">
                           {activeEvent.content}
                        </p>
                     </div>

                     <div className="ml-auto pl-2 flex items-center gap-2 relative z-10">
                        <div className={`p-1 rounded-md transition-all ${
                            activeEvent.type === 'message' ? 'text-[#ff00ff] opacity-40' : 'text-[#00f0ff] opacity-40'
                        }`}>
                            <Zap size={10} className="animate-pulse" />
                        </div>
                        
                        {/* ❌ DISMISSAL BUTTON (High-Visibility yellow) */}
                        <button 
                          onClick={(e) => {
                             e.stopPropagation();
                             setActiveEvent(null);
                          }}
                          className="w-7 h-7 rounded-full bg-[#ffea00]/10 border border-[#ffea00]/40 flex items-center justify-center text-[#ffea00] hover:bg-[#ffea00]/20 transition-all active:scale-95 shadow-[0_0_10px_rgba(255,234,0,0.2)]"
                        >
                           <X size={12} strokeWidth={3} />
                        </button>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}
       </AnimatePresence>
    </div>
  );
}
