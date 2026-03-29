'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { type Profile, type Broadcast, proxyImg } from '@/lib/profiles';
import Image from 'next/image';
import { Lock, Circle, MessageSquare, Image as ImageIcon, Heart, Star } from 'lucide-react';
import GlitchText from './ui/GlitchText';

interface FeedItemProps {
  profile: Profile;
  broadcast: Broadcast;
}

const getCityStatus = (profile: Profile) => {
    const weatherPool: Record<string, string> = {
        'Santiago': '82°F',
        'Medellín': '74°F',
        'Rio': '88°F',
        'Madrid': '64°F'
    };
    return {
        weather: weatherPool[profile.city] || '72°F'
    };
};

export default function FeedItem({ profile, broadcast }: FeedItemProps) {
  const cityStatus = getCityStatus(profile);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
     const hasSeen = localStorage.getItem('gasp_zoom_hint');
     if (!hasSeen) {
        setShowHint(true);
        localStorage.setItem('gasp_zoom_hint', 'true');
     }

     // Sync following status
     const sync = async () => {
        const gid = localStorage.getItem('gasp_guest_id');
        if (!gid) return;
        try {
          const res = await fetch('/api/rpc/db', {
            method: 'POST',
            body: JSON.stringify({ action: 'check-follow', payload: { userId: gid, personaId: profile.id } })
          });
          const json = await res.json();
          setIsFollowing(json.isFollowing);
        } catch (e) {}
     };
     sync();

     window.addEventListener('gasp_sync_follows', sync);
     return () => window.removeEventListener('gasp_sync_follows', sync);
  }, [profile.id]);

  const handleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // 💖 DOUBLE TAP TRIGGERED
      if (!isLiked) {
        setIsLiked(true);
        setShowHeartAnim(true);
        setTimeout(() => setShowHeartAnim(false), 1000);
      } else {
        // Toggle off if already liked? Or just show anim again?
        // Standard IG: double tap always likes, doesn't unlike.
        setShowHeartAnim(true);
        setTimeout(() => setShowHeartAnim(false), 1000);
      }
    } else {
      // Single tap: Zoom
      setIsZoomed(!isZoomed);
    }
    setLastTap(now);
  };

  return (
    <div className="border-b border-white/5 pb-12 mb-12 last:border-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-4">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black uppercase italic tracking-tighter text-white">
            <GlitchText text={profile.name} />
          </span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold uppercase tracking-wider text-white/40">
            {profile.city} • {cityStatus.weather}
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
               onTap={handleTap}
             >
                <Image
                  src={proxyImg(broadcast.image_url || profile.image)}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                />
             </motion.div>

             {/* 💖 LIKE ANIMATION OVERLAY */}
             <AnimatePresence>
                {showHeartAnim && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0, rotate: -20 }}
                    animate={{ scale: [0, 1.5, 1.2], opacity: [0, 1, 1], rotate: 0 }}
                    exit={{ scale: 2, opacity: 0, filter: 'blur(10px)' }}
                    transition={{ duration: 0.6, ease: "backOut" }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1002]"
                  >
                     <div className="relative">
                        <Heart size={100} fill="#ff00ff" className="text-[#ff00ff] drop-shadow-[0_0_30px_#ff00ff]" />
                        {/* Secondary Sparkle rings */}
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 0.5 }}
                          animate={{ scale: 1.5, opacity: 0 }}
                          className="absolute inset-0 rounded-full border-4 border-[#ff00ff]"
                        />
                     </div>
                  </motion.div>
                )}
             </AnimatePresence>

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
                           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white italic">INTERACTION ENABLED</span>
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

             {/* UI: ZOOM HUD */}
             {isZoomed && (
                <div className="absolute top-6 left-6 z-[1001] bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 pointer-events-none">
                    <span className="text-[8px] font-black uppercase tracking-widest text-[#00ff00] italic">
                        ZOOM MODE • DRAG TO VIEW
                    </span>
                </div>
             )}

             {/* 🌟 FAVORITE / BOOKMARK BUTTON */}
             <button 
                onClick={async (e) => {
                   e.stopPropagation();
                   const gid = localStorage.getItem('gasp_guest_id');
                   if (!gid) return;

                   // Optimistic UI
                   const next = !isFollowing;
                   setIsFollowing(next);

                   try {
                     await fetch('/api/rpc/db', {
                       method: 'POST',
                       body: JSON.stringify({ action: 'toggle-follow', payload: { userId: gid, personaId: profile.id, isFollowing: !next } })
                     });
                     
                     window.dispatchEvent(new Event('gasp_sync_follows'));
                   } catch (err) {
                     console.error('[FeedItem] Follow Failure:', err);
                     setIsFollowing(!next); // Revert
                   }
                }}
                className={`absolute bottom-6 right-6 z-[1001] w-12 h-12 rounded-2xl backdrop-blur-3xl border transition-all flex items-center justify-center group shadow-2xl active:scale-90 ${
                   isFollowing 
                   ? 'bg-[#ffea00]/10 border-[#ffea00]/40 text-[#ffea00]' 
                   : 'bg-black/40 border-white/10 text-white/40 hover:text-white hover:border-white/30'
                }`}
             >
                <Star size={20} className={isFollowing ? 'fill-[#ffea00] scale-110 drop-shadow-[0_0_10px_#ffea00]' : 'group-hover:scale-110 transition-transform'} />
                
                {/* TOOLTIP */}
                <div className="absolute -top-10 right-0 px-3 py-1 bg-white text-black text-[8px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                   {isFollowing ? 'Favorited' : 'Add to Favorites'}
                </div>
             </button>
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
                  <h3 className="text-lg font-black uppercase italic tracking-tight text-white">private collection</h3>
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
              src={proxyImg(profile.image)}
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
        {/* Like Button */}
        <button 
          onClick={() => {
            if (!isLiked) {
              setIsLiked(true);
              setShowHeartAnim(true);
              setTimeout(() => setShowHeartAnim(false), 1000);
            } else {
              setIsLiked(false);
            }
          }}
          className="group flex flex-col items-center gap-2"
        >
          <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all shadow-xl ${isLiked ? 'border-[#ff00ff]/50 bg-[#ff00ff]/10 shadow-[#ff00ff]/20' : 'border-white/10 group-hover:border-[#ff00ff]/40'}`}>
            <Heart size={18} className={isLiked ? 'text-[#ff00ff] fill-[#ff00ff]' : 'text-white/40 group-hover:text-[#ff00ff] transition-colors'} />
          </div>
          <span className={`text-[7px] font-black uppercase tracking-[0.3em] ${isLiked ? 'text-white' : 'text-white/20'}`}>
            {broadcast.likes_count ? broadcast.likes_count + (isLiked ? 1 : 0) : (isLiked ? 1 : 'like')}
          </span>
        </button>

        {/* O: Tip */}
        <button className="group flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[#FF007F]/50 transition-all shadow-xl group-hover:shadow-[#FF007F]/10">
            <Circle size={18} className="text-white/40 group-hover:text-[#FF007F] transition-colors" />
          </div>
          <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/20 group-hover:text-white/40">tip</span>
        </button>

        {/* I: Chat */}
        <button className="group flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[#FF007F]/50 transition-all shadow-xl">
            <MessageSquare size={18} className="text-white/40 group-hover:text-[#FF007F] transition-colors" />
          </div>
          <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/20">chat</span>
        </button>

        {/* I: Private Media */}
        <button className="group flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[#FF007F]/50 transition-all shadow-xl">
            <ImageIcon size={18} className="text-white/40 group-hover:text-[#FF007F] transition-colors" />
          </div>
          <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/20">private</span>
        </button>
      </div>
    </div>
  );
}
