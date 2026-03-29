'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { initialProfiles, proxyImg, getProfileName } from '@/lib/profiles';
import { X, Lock, Volume2, ChevronLeft, ChevronRight, Zap, Heart } from 'lucide-react';
import Image from 'next/image';
import ProfileAvatar from './profile/ProfileAvatar';

// 🛡️ SOVEREIGN SYNC: Using Stories API (Service Role) instead of 'anon' client.

interface StoryBubble {
  profileId: string;
  profileName: string;
  profileImage: string;
  stories: {
    id: string;
    asset_url: string;
    type: string;
    category: string;
    is_premium: boolean;
  }[];
  hasUnviewed: boolean;
}

interface StoriesRowProps {
  profiles: any[];
  onSelectProfile: (id: string) => void;
}

export default function StoriesRow({ profiles, onSelectProfile }: StoriesRowProps) {
  const [storyData, setStoryData] = useState<StoryBubble[]>([]);
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
  const [activeStory, setActiveStory] = useState<{ bubble: StoryBubble; storyIndex: number } | null>(null);
  const [progress, setProgress] = useState(0);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [isLiked, setIsLiked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('gasp_viewed_stories') || '[]');
    setViewedIds(new Set(stored));
    const liked = JSON.parse(localStorage.getItem('gasp_liked_stories') || '{}');
    setIsLiked(liked);
  }, []);

  useEffect(() => {
    async function fetchStories() {
      try {
          const res = await fetch('/api/stories');
          const json = await res.json();
          const dbStories = json.stories || [];

          // Build per-profile bubbles
          const bubbles: StoryBubble[] = profiles
            .filter(p => p.image)
            .map(p => {
              const pStories = (dbStories || []).filter((s: { persona_id: string }) => s.persona_id === p.id);
              const hasDatabaseStories = pStories.length > 0;
              const finalStories = hasDatabaseStories ? pStories : [{
                id: `fallback_${p.id}`,
                asset_url: p.image,
                type: 'image',
                category: 'CHILL',
                is_premium: false,
              }];
              return {
                profileId: p.id,
                profileName: getProfileName(p),
                profileImage: p.image,
                stories: finalStories,
                hasUnviewed: hasDatabaseStories && pStories.some((s: any) => !viewedIds.has(s.id)),
              };
            });

          setStoryData(bubbles);
      } catch (err) {
          console.error('[Stories] Pulse Failure:', err);
      }
    }
    if (profiles.length > 0) fetchStories();
  }, [profiles, viewedIds]);


  // Auto-progress through story
  useEffect(() => {
    if (!activeStory) return;
    setProgress(0);
    const duration = 5000;
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          const { bubble, storyIndex } = activeStory;
          if (storyIndex < bubble.stories.length - 1) {
            setActiveStory({ bubble, storyIndex: storyIndex + 1 });
          } else {
            setActiveStory(null);
          }
          return 0;
        }
        return prev + (100 / (duration / 100));
      });
    }, 100);
    return () => clearInterval(interval);
  }, [activeStory?.storyIndex, activeStory?.bubble.profileId]);

  const [isExpanded, setIsExpanded] = useState(false);

  const openStory = (bubble: StoryBubble) => {
    setActiveStory({ bubble, storyIndex: 0 });
    const newViewed = new Set(viewedIds);
    bubble.stories.forEach(s => newViewed.add(s.id));
    setViewedIds(newViewed);
    localStorage.setItem('gasp_viewed_stories', JSON.stringify([...newViewed]));
  };

  const currentStory = activeStory ? activeStory.bubble.stories[activeStory.storyIndex] : null;
  const unviewedCount = storyData.filter(s => s.hasUnviewed).length;

  const handleDoubleTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      if (currentStory) {
        const sid = currentStory.id;
        const newLiked = { ...isLiked, [sid]: true };
        setIsLiked(newLiked);
        localStorage.setItem('gasp_liked_stories', JSON.stringify(newLiked));
        
        setShowHeartAnim(true);
        setTimeout(() => setShowHeartAnim(false), 1000);
      }
    }
    setLastTap(now);
  };

  if (storyData.length === 0) return null;

  return (
    <>
      <div className="w-full relative group/stories py-1 md:py-4 flex justify-center pointer-events-none">
         <AnimatePresence mode="wait">
            {!isExpanded ? (
               <motion.button
                 key="bubble"
                 initial={{ opacity: 0, y: -10, scale: 0.95 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  onClick={() => setIsExpanded(true)}
                  className="px-5 py-2 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-2xl flex items-center gap-3 shadow-[0_10px_40px_rgba(0,0,0,0.4)] hover:bg-white/10 transition-all pointer-events-auto group"
                >
                   <div className="flex -space-x-3">
                      {storyData.slice(0, 3).map((s, i) => (
                         <div key={s.profileId} className="w-6 h-6 rounded-full p-[1.5px] bg-gradient-to-tr from-[#00f0ff] via-[#ff00ff] to-[#ffea00] relative" style={{ zIndex: 3 - i }}>
                            <div className="w-full h-full rounded-full border-2 border-black overflow-hidden bg-zinc-800">
                               <ProfileAvatar src={s.profileImage} alt="" />
                            </div>
                         </div>
                      ))}
                   </div>
                   <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/50 group-hover:text-white transition-colors italic">
                      {unviewedCount > 0 ? `${unviewedCount} ACTIVE NODES` : 'INTEL DECK'}
                   </span>
                </motion.button>
            ) : (
               <motion.div
                 key="expanded"
                 initial={{ opacity: 0, scale: 0.98, y: -10 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.98, y: -10 }}
                 className="w-full max-w-5xl mx-auto rounded-3xl bg-white/5 backdrop-blur-3xl border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.8)] p-6 pointer-events-auto flex flex-col gap-6"
               >
                  <div className="w-full flex items-center justify-between px-2">
                     <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#00f0ff]">Live Identity Feed</span>
                        <div className="h-1 w-12 bg-gradient-to-r from-[#00f0ff] to-transparent rounded-full" />
                     </div>
                     <button onClick={() => setIsExpanded(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
                        <X size={14} />
                     </button>
                  </div>
                  
                  <div className="w-full relative">
                     {/* Horizontal Scroll Area */}
                     <div className="w-full flex items-center gap-5 px-2 pb-2 overflow-x-auto no-scrollbar scroll-smooth relative touch-pan-x cursor-grab active:cursor-grabbing select-none">
                        {storyData.map((bubble, idx) => (
                           <motion.button
                             key={bubble.profileId}
                             initial={{ opacity: 0, scale: 0.5, x: 20 }}
                             animate={{ opacity: 1, scale: 1, x: 0 }}
                             transition={{ delay: idx * 0.03, type: 'spring', stiffness: 200 }}
                             onClick={() => openStory(bubble)}
                             whileHover={{ scale: 1.05 }}
                             whileTap={{ scale: 0.95 }}
                             className="flex flex-col items-center gap-3 shrink-0 group relative"
                           >
                              {/* Ring & Avatar */}
                              <div className={`p-[2.5px] rounded-full transition-all duration-500 relative ${
                                  bubble.hasUnviewed
                                     ? 'bg-gradient-to-br from-[#00f0ff] via-[#ff00ff] to-[#ffea00] scale-105'
                                     : 'bg-white/10 opacity-60 group-hover:opacity-100 group-hover:bg-white/20'
                              }`}>
                                  {bubble.hasUnviewed && (
                                     <div className="absolute inset-0 bg-[#ff00ff] animate-ping opacity-10 rounded-full" />
                                  )}
                                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-black relative">
                                     <ProfileAvatar
                                        src={bubble.profileImage}
                                        alt={bubble.profileName}
                                     />
                                     <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-[#00ff00] border-2 border-black shadow-[0_0_10px_#00ff00]" />
                                  </div>
                              </div>
                              <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-center transition-all ${
                                  bubble.hasUnviewed ? 'text-white' : 'text-white/40 group-hover:text-white'
                              }`}>
                                  {bubble.profileName.split(' ')[0]}
                              </span>
                           </motion.button>
                        ))}
                     </div>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>
      </div>

      {/* STORY VIEWER */}
      <AnimatePresence>
        {activeStory && currentStory && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-[2000] bg-black/95 backdrop-blur-3xl flex flex-col"
          >
            {/* Progress bars */}
            <div className="absolute top-0 left-0 right-0 z-[2100] flex gap-1 p-4 pt-safe">
              {activeStory.bubble.stories.map((_, i) => (
                <div key={i} className="flex-1 h-0.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-none"
                    style={{
                      width: i < activeStory.storyIndex ? '100%' : i === activeStory.storyIndex ? `${progress}%` : '0%'
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="absolute top-10 left-0 right-0 z-[2100] flex items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20">
                  <ProfileAvatar src={activeStory.bubble.profileImage} alt="" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-white tracking-widest">{activeStory.bubble.profileName} <Zap size={10} className="inline ml-1 text-[#ffea00]" /></p>
                  <p className="text-[8px] text-white/40 uppercase tracking-[0.2em]">{currentStory.category || 'verified'} • now</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onSelectProfile(activeStory.bubble.profileId);
                    setActiveStory(null);
                  }}
                  className="px-5 py-2 bg-white text-black rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-[#ffea00] transition-all"
                >
                  Open Chat
                </button>
                <button onClick={() => setActiveStory(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/5">
                  <X size={16} className="text-white" />
                </button>
              </div>
            </div>

            {/* Story Content / Navigation */}
            <div 
              className="flex-1 relative flex items-center justify-center overflow-hidden"
              onClick={() => {
                const { bubble, storyIndex } = activeStory;
                if (storyIndex < bubble.stories.length - 1) {
                  setActiveStory({ bubble, storyIndex: storyIndex + 1 });
                } else {
                  setActiveStory(null);
                }
              }}
            >
              <div className="relative h-full aspect-[9/16] bg-black shadow-2xl overflow-hidden group/container">
                
                {/* 💖 LIKE ANIMATION OVERLAY */}
                <AnimatePresence>
                   {showHeartAnim && (
                     <motion.div
                       initial={{ scale: 0, opacity: 0, rotate: -20 }}
                       animate={{ scale: [0, 1.5, 1.2], opacity: [0, 1, 1], rotate: 0 }}
                       exit={{ scale: 2, opacity: 0, filter: 'blur(10px)' }}
                       transition={{ duration: 0.6, ease: "backOut" }}
                       className="absolute inset-0 flex items-center justify-center pointer-events-none z-[2200]"
                     >
                        <div className="relative">
                           <Heart size={120} fill="#ff00ff" className="text-[#ff00ff] drop-shadow-[0_0_40px_#ff00ff]" />
                           <motion.div 
                             initial={{ scale: 0.8, opacity: 0.5 }}
                             animate={{ scale: 1.8, opacity: 0 }}
                             className="absolute inset-0 rounded-full border-4 border-[#ff00ff]"
                           />
                        </div>
                     </motion.div>
                   )}
                </AnimatePresence>

                <div className="absolute inset-0 z-50 flex">
                   {/* Capture clicks for next/prev but allow the main div to handle "default next" */}
                  <div className="flex-1 cursor-pointer" onClick={(e) => {
                    e.stopPropagation();
                    const { bubble, storyIndex } = activeStory;
                    if (storyIndex > 0) setActiveStory({ bubble, storyIndex: storyIndex - 1 });
                  }} />
                  <div className="flex-1 cursor-pointer" onClick={handleDoubleTap} />
                </div>

                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-[60] w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover/container:opacity-100 transition-opacity hover:bg-black/60 pointer-events-none">
                  <ChevronLeft size={24} />
                </div>

                <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[60] w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover/container:opacity-100 transition-opacity hover:bg-black/60 pointer-events-none">
                  <ChevronRight size={24} />
                </div>

                {currentStory.is_premium ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/80 backdrop-blur-3xl z-40">
                    <div className="w-20 h-20 rounded-[2rem] bg-[#ff00ff]/10 border border-[#ff00ff]/30 flex items-center justify-center">
                      <Lock size={32} className="text-[#ff00ff]" />
                    </div>
                    <div className="text-center px-8 space-y-2">
                       <h3 className="text-white font-bold uppercase text-lg tracking-tight">Locked Story</h3>
                       <p className="text-white/40 text-[10px] uppercase tracking-widest leading-relaxed">this node is locked</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectProfile(activeStory.bubble.profileId); setActiveStory(null); }}
                      className="px-10 py-5 bg-[#ff00ff] text-white rounded-3xl font-black uppercase tracking-wider text-[11px] shadow-[0_0_40px_rgba(255,0,255,0.3)] hover:scale-105 transition-all"
                    >
                      Unlock for 40 Credits
                    </button>
                  </div>
                ) : (
                  <div className="relative w-full h-full">
                    {currentStory.type === 'video' ? (
                       <video 
                         src={proxyImg(currentStory.asset_url)} 
                         autoPlay 
                         loop 
                         muted 
                         playsInline 
                         className="w-full h-full object-cover"
                       />
                    ) : (
                      <Image
                        src={proxyImg(currentStory.asset_url)}
                        alt=""
                        fill
                        unoptimized
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 pointer-events-none" />
                  </div>
                )}
              </div>
            </div>

            {/* Bottom CTA & Like Button */}
            <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col gap-4 items-center bg-gradient-to-t from-black/60 to-transparent">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentStory) {
                    const sid = currentStory.id;
                    const liked = !isLiked[sid];
                    const newLiked = { ...isLiked, [sid]: liked };
                    setIsLiked(newLiked);
                    localStorage.setItem('gasp_liked_stories', JSON.stringify(newLiked));
                    if (liked) {
                      setShowHeartAnim(true);
                      setTimeout(() => setShowHeartAnim(false), 1000);
                    }
                  }
                }}
                className={`w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all ${isLiked[currentStory.id] ? 'bg-[#ff00ff] border-[#ff00ff] shadow-[0_0_30px_#ff00ff]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
              >
                <Heart size={24} className={isLiked[currentStory.id] ? 'text-white fill-white' : 'text-white/40'} />
              </button>

              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onSelectProfile(activeStory.bubble.profileId); 
                  setActiveStory(null);
                }}
                className="w-full max-w-sm h-16 bg-white border border-white/10 rounded-2xl text-black font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#ffea00] hover:border-[#ffea00] transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                Open Chat
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
