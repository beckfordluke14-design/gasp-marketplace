'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { initialProfiles, proxyImg } from '@/lib/profiles';
import Image from 'next/image';
import ProfileAvatar from './profile/ProfileAvatar';
import { Zap, Heart } from 'lucide-react';

export default function RightSidebar({ onSelectProfile, profiles, deadIds, setDeadIds }: { onSelectProfile: (id: string) => void, profiles: any[], deadIds: Set<string>, setDeadIds: (ids: any) => void }) {
  const [following, setFollowing] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('gasp_following');
    if (stored) {
      try { setFollowing(JSON.parse(stored)); } catch (e) { setFollowing([]); }
    }
    const handleStorage = () => {
      const updated = localStorage.getItem('gasp_following');
      if (updated) setFollowing(JSON.parse(updated));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Randomize profiles for discovery
  const galleryItems = profiles
    .filter(p => p.image && p.image !== 'undefined' && p.image !== 'null' && p.image !== '' && !deadIds.has(p.id))
    .slice(0, 50); 

  return (
    <aside className="hidden lg:flex w-[240px] xl:w-[280px] 2xl:w-[320px] h-screen bg-black/40 backdrop-blur-3xl border-l border-white/5 flex-col shrink-0 overflow-hidden sticky top-0 transition-all">
      {/* Search Result / Discovery Gallery */}
      <div className="h-20 shrink-0" />

      {/* Gallery List */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-6">
        <div className="mb-8 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <div className="w-4 h-[1px] bg-[#ff00ff]" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 italic">Suggested</span>
           </div>
           <span className="text-[8px] font-black text-[#ffea00] uppercase italic tracking-widest animate-pulse">Live now</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {galleryItems.map((profileItem) => (
            <motion.div
              key={profileItem.id}
              onClick={() => onSelectProfile(profileItem.id)}
              whileHover={{ scale: 1.05, y: -2 }}
              className={`relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer border border-white/5 group shadow-2xl ${!profileItem.isOnline ? 'grayscale grayscale-opacity-80' : ''}`}
            >
              {/* Profile Image */}
              <ProfileAvatar
                src={profileItem.image}
                alt={profileItem.name}
                onImageError={() => {
                  console.warn(`[Gallery] Purging invalid link: ${profileItem.id} (${profileItem.name})`);
                  setDeadIds((prev: Set<string>) => new Set([...Array.from(prev), profileItem.id]));
                }}
              />
              
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

              {/* Profile Metadata Overlay (Small) */}
              <div className="absolute inset-x-0 bottom-0 p-2 flex flex-col gap-0.5">
                 <div className="flex items-center gap-1 leading-none">
                    <span className="text-[9px] font-bold uppercase text-white italic tracking-tighter truncate">
                       {profileItem.name}
                    </span>
                    <div className={`w-1 h-1 rounded-full ${profileItem.isOnline ? 'bg-[#00ff00] shadow-[0_0_8px_#00ff00] animate-pulse' : 'bg-white/10'}`} />
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-[6px] font-black text-white/30 uppercase tracking-widest leading-none">{profileItem.city}</span>
                    <Heart 
                      size={6} 
                      className={`transition-all ${following.includes(profileItem.id) ? 'text-[#ff00ff] fill-[#ff00ff] opacity-100 drop-shadow-[0_0_5px_#ff00ff]' : 'text-white/20 opacity-60'}`} 
                    />
                 </div>
              </div>

              {/* Status Badge */}
              <div className="absolute top-1.5 left-1.5 px-1 py-0.5 rounded-md bg-black/40 backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity scale-75 origin-top-left">
                 {profileItem.isOnline ? <Zap size={8} className="text-[#ffea00]" /> : <div className="text-[5px] text-white/40 font-black uppercase">Offline</div>}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Support Link */}
        <div className="mt-12 p-8 rounded-[2rem] border border-dashed border-white/10 flex flex-col items-center justify-center text-center gap-4 opacity-40 hover:opacity-100 transition-opacity cursor-pointer group">
           <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:border-[#ff00ff]/50">
              <Zap size={20} className="text-white/40 group-hover:text-[#ff00ff] transition-all" />
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Join Agency</p>
        </div>
      </div>
    </aside>
  );
}
