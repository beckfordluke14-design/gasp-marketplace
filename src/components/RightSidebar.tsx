'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { initialPersonas, proxyImg } from '@/lib/profiles';
import Image from 'next/image';
import PersonaAvatar from './persona/PersonaAvatar';
import { Zap, Heart } from 'lucide-react';

export default function RightSidebar({ onSelectPersona, personas }: { onSelectPersona: (id: string) => void, personas: any[] }) {
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

  // Simulated status variation for the gallery
  const galleryItems = personas.map((p, idx) => ({
    ...p,
    isOnline: idx % 2 === 0, // Even id's are "Online", Odd id's are "Offline"
  })).reverse();

  return (
    <aside className="hidden lg:flex w-[280px] xl:w-[320px] 2xl:w-[380px] h-screen bg-black border-l border-white/5 flex-col shrink-0 overflow-hidden sticky top-0">
      {/* 3. RIGHT SIDEBAR: DISCOVERY GALLERY */}
      <div className="h-20 shrink-0" />

      {/* Gallery List */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-6">
        <div className="mb-8 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <div className="w-4 h-[1px] bg-[#ff00ff]" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 italic">Elite Gallery</span>
           </div>
           <span className="text-[8px] font-black text-[#ffea00] uppercase italic tracking-widest animate-pulse">Live now</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {galleryItems.map((persona) => (
            <motion.div
              key={persona.id}
              onClick={() => onSelectPersona(persona.id)}
              whileHover={{ scale: 1.05, y: -4 }}
              className={`relative aspect-[3/4] rounded-3xl overflow-hidden cursor-pointer border border-white/5 group shadow-2xl ${!persona.isOnline ? 'grayscale grayscale-opacity-80' : ''}`}
            >
              {/* Profile Image */}
              <PersonaAvatar
                src={persona.image}
                alt={persona.name}
              />
              
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

              {/* Persona Metadata Overlay (Small) */}
              <div className="absolute inset-x-0 bottom-0 p-3 flex flex-col gap-1">
                 <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-[11px] font-bold uppercase text-white italic tracking-tighter truncate">
                       {persona.name} {persona.age}
                    </span>
                    <div className={`w-1.5 h-1.5 rounded-full ${persona.isOnline ? 'bg-[#00ff00] shadow-[0_0_8px_#00ff00] animate-pulse' : 'bg-white/10'}`} />
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-[7px] font-black text-white/40 uppercase tracking-widest leading-none">{persona.city}</span>
                    <Heart 
                      size={8} 
                      className={`transition-all ${following.includes(persona.id) ? 'text-[#ff00ff] fill-[#ff00ff] opacity-100 drop-shadow-[0_0_5px_#ff00ff]' : 'text-white/20 opacity-60'}`} 
                    />
                 </div>
              </div>

              {/* Status Badge */}
              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/40 backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                 {persona.isOnline ? <Zap size={8} className="text-[#ffea00]" /> : <div className="text-[6px] text-white/40 font-black uppercase">Offline</div>}
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


