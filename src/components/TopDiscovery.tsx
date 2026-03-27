'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { initialPersonas, proxyImg, getPersonaName } from '@/lib/profiles';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  PlusCircle,
  MessageSquare,
  User,
  Settings,
  Coins,
  Zap,
  Eye,
  EyeOff,
  Diamond
} from 'lucide-react';
import { useUser } from '@/components/providers/UserProvider';
import PersonaAvatar from '@/components/persona/PersonaAvatar';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);

interface TopDiscoveryProps {
  selectedPersonaId: string;
  onSelectPersona: (id: string) => void;
  unreadCounts?: Record<string, number>;
  personas: any[];
}

export default function TopDiscovery({ selectedPersonaId, onSelectPersona, unreadCounts = {}, personas }: TopDiscoveryProps) {
  const { profile } = useUser();
  const [following, setFollowing] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [deadIds, setDeadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const syncSeen = () => {
       const stored = JSON.parse(localStorage.getItem('gasp_seen_stories') || '[]');
       setSeenIds(stored);
    };
    syncSeen();
    
    const syncFollows = async () => {
       const idToUse = profile?.id || localStorage.getItem('gasp_guest_id');
       if (!idToUse) return;
       const { data } = await supabase.from('user_relationships').select('persona_id').eq('user_id', idToUse);
       if (data) setFollowing(data.map(r => r.persona_id));
    };

    syncFollows();
    window.addEventListener('gasp_sync_follows', syncFollows);
    window.addEventListener('storage', syncFollows);
    return () => {
       window.removeEventListener('gasp_sync_follows', syncFollows);
       window.removeEventListener('storage', syncFollows);
    };
  }, [profile]);

  const handleSelect = (id: string) => {
     onSelectPersona(id);
     if (!seenIds.includes(id)) {
        const next = [...seenIds, id];
        setSeenIds(next);
        localStorage.setItem('gasp_seen_stories', JSON.stringify(next));
     }
  };

  return (
    <div className="fixed top-32 left-0 right-0 lg:left-[320px] lg:right-[320px] xl:left-[320px] xl:right-[380px] z-[400] flex flex-col items-center pointer-events-none px-2 lg:px-8">
      {/* 👁️ ALPHA TOGGLE */}
      <button 
        onClick={() => setIsVisible(!isVisible)}
        className="mb-4 w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/40 hover:text-[#ff00ff] transition-all shadow-2xl pointer-events-auto"
      >
         {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>

      <AnimatePresence>
        {isVisible && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="flex items-center gap-4 p-4 lg:p-6 bg-transparent pointer-events-auto max-w-[95vw] lg:max-w-none overflow-x-auto no-scrollbar scroll-smooth pr-[100px]"
          >
             {personas.filter(p => !deadIds.has(p.id)).map((p) => {
                const isSelected = selectedPersonaId === p.id;
                const unread = unreadCounts[p.id] || 0;
                const isFollowing = following.includes(p.id);
                const isSeen = seenIds.includes(p.id);

                return (
                  <motion.button
                    key={p.id}
                    onClick={() => handleSelect(p.id)}
                    whileHover={{ scale: 1.1, y: -2 }}
                    className={`relative shrink-0 flex flex-col items-center gap-1.5 p-1 rounded-full transition-all ${
                      isSelected ? 'bg-white/5 shadow-xl' : 'hover:bg-white/5'
                    }`}
                  >
                     {/* 🌈 STORY RING NODE */}
                     <div className={`w-14 h-14 rounded-full p-[3px] transition-all flex items-center justify-center overflow-hidden relative ${
                       !isSeen ? 'bg-gradient-to-tr from-[#ffea00] via-[#ff00ff] to-[#00f0ff]' : 'bg-white/10'
                     }`}>
                        <div className="w-full h-full rounded-full border-2 border-black overflow-hidden bg-black relative">
                           <div 
                             className="w-full h-full select-none pointer-events-none"
                             onContextMenu={(e) => e.preventDefault()}
                           >
                              <PersonaAvatar 
                                 src={p.image} 
                                 alt={p.name} 
                                 onImageError={() => {
                                   console.warn(`[Gasp Stories] Purging dead story node: ${p.id} (${p.name})`);
                                   setDeadIds(prev => new Set([...Array.from(prev), p.id]));
                                 }}
                               />
                           </div>

                           {/* 🛡️ ANTI-DOWNLOAD OVERLAY */}
                           <div className="absolute inset-0 z-10" onContextMenu={(e) => e.preventDefault()} />
                        </div>
                        
                        {/* 🟢 ONLINE INDICATOR */}
                        {p.isOnline && (
                           <div className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-[#00ff00] border-2 border-black shadow-[0_0_10px_#00ff00] z-20" />
                        )}
                     </div>

                     {/* 🏙️ NAME TAG */}
                     {isSelected && (
                        <motion.span 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-[7px] font-black uppercase tracking-widest text-[#00f0ff] italic bg-black/40 px-2 py-0.5 rounded-full"
                        >
                           {p.name}
                        </motion.span>
                     )}
                  </motion.button>
                );
             })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
