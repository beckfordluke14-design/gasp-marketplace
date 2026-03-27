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

  useEffect(() => {
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

  return (
    <div className="fixed top-24 inset-x-0 z-[400] flex flex-col items-center pointer-events-none px-4">
      {/* 👁️ ALPHA TOGGLE */}
      <button 
        onClick={() => setIsVisible(!isVisible)}
        className="mb-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-3xl border border-white/10 flex items-center justify-center text-white/40 hover:text-[#ff00ff] transition-all shadow-2xl pointer-events-auto"
      >
         {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>

      <AnimatePresence>
        {isVisible && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="flex items-center gap-3 p-3 bg-black/20 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.8)] pointer-events-auto max-w-full overflow-x-auto no-scrollbar"
          >
             {personas.map((p) => {
                const isSelected = selectedPersonaId === p.id;
                const unread = unreadCounts[p.id] || 0;
                const isFollowing = following.includes(p.id);

                return (
                  <motion.button
                    key={p.id}
                    onClick={() => onSelectPersona(p.id)}
                    whileHover={{ scale: 1.1, y: -2 }}
                    className={`relative shrink-0 flex flex-col items-center gap-1.5 p-1 rounded-full transition-all ${
                      isSelected ? 'bg-white/5 shadow-xl' : 'hover:bg-white/5'
                    }`}
                  >
                     {/* 🫧 BUBBLE NODE */}
                     <div className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all relative ${
                       unread > 0 ? 'border-[#ff00ff] shadow-[0_0_15px_#ff00ff44]' : (isSelected ? 'border-white/40' : 'border-white/5 hover:border-white/20')
                     }`}>
                        <PersonaAvatar src={p.image} alt={p.name} />
                        
                        {/* 🤝 FOLLOW INDICATOR */}
                        {isFollowing && (
                           <div className="absolute top-0 right-0 w-3 h-3 rounded-full bg-[#00ff00] border border-black shadow-[0_0_10px_#00ff00] z-20 flex items-center justify-center">
                              <PlusCircle size={6} className="text-black rotate-45" />
                           </div>
                        )}
                        
                        {/* 🔔 UNREAD BADGE */}
                        {unread > 0 && (
                           <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#ffea00] text-black text-[8px] font-black flex items-center justify-center z-30 shadow-lg border border-black">
                              {unread}
                           </div>
                        )}
                     </div>

                     {/* 🏙️ NAME TAG (OPTIONAL) */}
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
