'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { initialProfiles, proxyImg, getProfileName } from '@/lib/profiles';
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
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';


interface TopDiscoveryProps {
  selectedProfileId: string;
  onSelectProfile: (id: string, initialMsg?: string) => void;
  unreadCounts: Record<string, number>;
  profiles: any[];
  deadIds: Set<string>;
  setDeadIds: (ids: any) => void;
}

export default function TopDiscovery({ selectedProfileId, onSelectProfile, unreadCounts = {}, profiles, deadIds, setDeadIds }: TopDiscoveryProps) {
  const { user, profile } = useUser();
  const [following, setFollowing] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  

  useEffect(() => {
    const syncSeen = () => {
       const stored = JSON.parse(localStorage.getItem('gasp_seen_stories') || '[]');
       setSeenIds(stored);
    };
    syncSeen();
    
    const syncFollows = async () => {
        const idToUse = profile?.id || localStorage.getItem('gasp_guest_id');
        if (!idToUse) return;
        
        try {
          const res = await fetch('/api/rpc/db', {
            method: 'POST',
            body: JSON.stringify({ action: 'sync-follows', payload: { userId: idToUse } })
          });
          const json = await res.json();
          if (json.success) setFollowing(json.following || []);
        } catch (e) {
          console.error('[Discovery Sync Failure]:', e);
        }
    };

    const handleWalletToggle = (e: any) => {
       setWalletModalOpen(!!e.detail);
    };

    syncFollows();
    window.addEventListener('gasp_sync_follows', syncFollows);
    window.addEventListener('storage', syncFollows);
    window.addEventListener('gasp_wallet_modal_toggle', handleWalletToggle);
    return () => {
       window.removeEventListener('gasp_sync_follows', syncFollows);
       window.removeEventListener('storage', syncFollows);
       window.removeEventListener('gasp_wallet_modal_toggle', handleWalletToggle);
    };
  }, [profile]);

  const handleSelect = (id: string) => {
     onSelectProfile(id);
     if (!seenIds.includes(id)) {
        const next = [...seenIds, id];
        setSeenIds(next);
        localStorage.setItem('gasp_seen_stories', JSON.stringify(next));
     }
  };

  return (
    <div className="fixed top-24 left-0 right-0 lg:left-[320px] lg:right-[320px] xl:left-[320px] xl:right-[380px] z-[400] flex flex-col items-center pointer-events-none px-0 lg:px-4">
      {/* 👁️ ALPHA TOGGLE */}
      <button 
        onClick={() => setIsVisible(!isVisible)}
        className="mb-4 w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/40 hover:text-[#ff00ff] transition-all shadow-2xl pointer-events-auto"
      >
         {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>

      <AnimatePresence>
        {isVisible && !walletModalOpen && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
            className="w-full flex justify-center"
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
          >
             <div className="w-full max-w-[95vw] lg:max-w-none bg-black/40 backdrop-blur-3xl border-y border-white/5 h-20 md:h-24 flex items-center overflow-hidden pointer-events-auto [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
                <div className="flex items-center gap-4 px-10 overflow-x-auto no-scrollbar scroll-smooth w-full">
                   {profiles.filter(p => !deadIds.has(p.id)).map((p) => {
                      const isSelected = selectedProfileId === p.id;
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
                                    <ProfileAvatar 
                                      src={p.image} 
                                      alt={p.name} 
                                      onImageError={() => {
                                        console.warn(`[Gasp Stories] Purging dead story node: ${p.id} (${p.name})`);
                                        setDeadIds((prev: any) => new Set([...Array.from(prev as any), p.id]));
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
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
