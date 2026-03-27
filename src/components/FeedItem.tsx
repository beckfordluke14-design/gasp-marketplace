'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { type Persona, type Broadcast, proxyImg } from '@/lib/profiles';
import Image from 'next/image';
import { Lock, Circle, MessageSquare, Image as ImageIcon } from 'lucide-react';

interface FeedItemProps {
  persona: Persona;
  broadcast: Broadcast;
}

const getCityStatus = (persona: Persona) => {
    const weatherPool: Record<string, string> = {
        'Santiago': '82°F',
        'Medellín': '74°F',
        'Rio': '88°F',
        'Madrid': '64°F'
    };
    return {
        weather: weatherPool[persona.city] || '72°F'
    };
};

export default function FeedItem({ persona, broadcast }: FeedItemProps) {
  const cityStatus = getCityStatus(persona);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
     const hasSeen = localStorage.getItem('gasp_zoom_hint');
     if (!hasSeen) {
        setShowHint(true);
        localStorage.setItem('gasp_zoom_hint', 'true');
     }
  }, []);

  return (
    <div className="border-b border-white/5 pb-12 mb-12 last:border-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-4">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black uppercase italic tracking-tighter text-white">
            {persona.name}
          </span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold uppercase tracking-wider text-white/40">
            {persona.city} • {cityStatus.weather}
          </div>
        </div>
      </div>

      {/* Content Switcher */}
      <div className="px-4">
        {broadcast.type === 'text' && (
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-white lowercase leading-tight">
            {broadcast.content}
          </h2>
        )}

        {broadcast.type === 'image' && (
          <div className={`relative aspect-[4/5] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl transition-all ${isZoomed ? 'z-[1000] cursor-move' : 'cursor-zoom-in'}`}>
            
             {/* 🔍 MACRO ZOOM CONTAINER */}
             <motion.div 
               className="w-full h-full relative"
               drag={isZoomed}
               dragConstraints={{ left: -300, right: 300, top: -300, bottom: 300 }}
               animate={{ scale: isZoomed ? 2 : 1 }}
               onTap={() => setIsZoomed(!isZoomed)}
             >
                <Image
                  src={proxyImg(broadcast.image_url || persona.image)}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                />
             </motion.div>

             {/* ✨ ZOOM HINT PULSE: NOW YOU CAN ZOOM */}
             <AnimatePresence>
                {showHint && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 pointer-events-none"
                  >
                     <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-full border border-[#ff00ff] shadow-[0_0_50px_#ff00ff] flex items-center justify-center animate-pulse">
                           <ImageIcon className="text-[#ff00ff]" size={32} />
                        </div>
                        <div className="bg-black/80 px-4 py-2 rounded-xl border border-white/10">
                           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white italic">NEURAL ZOOM ACTIVE</span>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowHint(false); }}
                          className="pointer-events-auto mt-4 px-6 py-2 bg-white text-black text-[9px] font-black uppercase rounded-full"
                        >
                           Got it
                        </button>
                     </div>
                  </motion.div>
                )}
             </AnimatePresence>

             {/* 📢 PERSISTENT ZOOM HUD */}
             {isZoomed && (
                <div className="absolute top-6 left-6 z-[1001] bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 pointer-events-none">
                    <span className="text-[8px] font-black uppercase tracking-widest text-[#00ff00] italic">
                        MACRO MODE • DRAG TO DISCOVER
                    </span>
                </div>
             )}
          </div>
        )}

        {broadcast.type === 'video' && (
          <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden border border-white/10 bg-white/5">
            {broadcast.is_locked ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 p-8 text-center backdrop-blur-3xl bg-black/40">
                <div className="w-16 h-16 rounded-full bg-[#FF007F]/20 flex items-center justify-center border border-[#FF007F]/30 shadow-[0_0_20px_rgba(255,0,127,0.3)]">
                  <Lock size={24} className="text-[#FF007F]" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black uppercase italic tracking-tight text-white">lifestyle vault</h3>
                  <p className="text-xs text-white/40 lowercase">unlock this private moment</p>
                </div>
                <button className="px-8 py-4 bg-[#FF007F] text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,0,127,0.4)] hover:scale-105 active:scale-95 transition-all">
                  unlock for {broadcast.lock_price} credits
                </button>
              </div>
            ) : (
              <video src={broadcast.video_url} autoPlay loop muted className="w-full h-full object-cover" />
            )}
            <Image
              src={proxyImg(persona.image)}
              alt=""
              fill
              unoptimized
              className={`object-cover ${broadcast.is_locked ? 'blur-2xl opacity-50' : ''}`}
            />
          </div>
        )}
      </div>

      {/* Action Icons (OII) */}
      <div className="flex items-center gap-8 mt-8 px-6">
        {/* O: Quick Tip */}
        <button className="group flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[#FF007F]/50 transition-all shadow-xl group-hover:shadow-[#FF007F]/10">
            <Circle size={18} className="text-white/40 group-hover:text-[#FF007F] transition-colors" />
          </div>
          <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/20 group-hover:text-white/40">infuse</span>
        </button>

        {/* I: Private Message */}
        <button className="group flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[#FF007F]/50 transition-all shadow-xl">
            <MessageSquare size={18} className="text-white/40 group-hover:text-[#FF007F] transition-colors" />
          </div>
          <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/20">uplink</span>
        </button>

        {/* I: Vault / Media */}
        <button className="group flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[#FF007F]/50 transition-all shadow-xl">
            <ImageIcon size={18} className="text-white/40 group-hover:text-[#FF007F] transition-colors" />
          </div>
          <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/20">vault</span>
        </button>
      </div>
    </div>
  );
}


