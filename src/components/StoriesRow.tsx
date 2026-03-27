'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { initialPersonas, proxyImg, getPersonaName } from '@/lib/profiles';
import { X, Lock, Volume2, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import Image from 'next/image';
import PersonaAvatar from './persona/PersonaAvatar';

// 🛡️ SOVEREIGN SYNC: Using Stories API (Service Role) instead of 'anon' client.
// This ensures that all story nodes are visible in the top bar regardless of RLS.

interface StoryBubble {
  personaId: string;
  personaName: string;
  personaImage: string;
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
  personas: any[];
  onSelectPersona: (id: string) => void;
}

export default function StoriesRow({ personas, onSelectPersona }: StoriesRowProps) {
  const [storyData, setStoryData] = useState<StoryBubble[]>([]);
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
  const [activeStory, setActiveStory] = useState<{ bubble: StoryBubble; storyIndex: number } | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('gasp_viewed_stories') || '[]');
    setViewedIds(new Set(stored));
  }, []);

  useEffect(() => {
    async function fetchStories() {
      try {
          const res = await fetch('/api/stories');
          const json = await res.json();
          const dbStories = json.stories || [];

          // Build per-persona bubbles
          const bubbles: StoryBubble[] = personas
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
                personaId: p.id,
                personaName: getPersonaName(p),
                personaImage: p.image,
                stories: finalStories,
                hasUnviewed: hasDatabaseStories && pStories.some((s: any) => !viewedIds.has(s.id)),
              };
            });

          setStoryData(bubbles);
      } catch (err) {
          console.error('[Stories] Pulse Failure:', err);
      }
    }
    if (personas.length > 0) fetchStories();
  }, [personas, viewedIds]);


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
  }, [activeStory?.storyIndex, activeStory?.bubble.personaId]);

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

  if (storyData.length === 0) return null;

  return (
    <>
      <div className="w-full relative group/stories py-4 flex justify-center">
         <AnimatePresence mode="wait">
            {!isExpanded ? (
               <motion.button
                 key="bubble"
                 initial={{ opacity: 0, y: -20, scale: 0.9 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  onClick={() => setIsExpanded(true)}
                  className="px-3.5 py-1.5 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-2 shadow-[0_5px_20px_rgba(0,0,0,0.5)] hover:border-[#00f0ff]/40 transition-all pointer-events-auto group"
                >
                   <div className="flex -space-x-2.5">
                      {storyData.slice(0, 3).map((s, i) => (
                         <div key={s.personaId} className="w-6 h-6 rounded-full p-[1.5px] bg-gradient-to-tr from-[#00f0ff] via-[#ff00ff] to-[#ffea00] relative" style={{ zIndex: 3 - i }}>
                            <div className="w-full h-full rounded-full border border-black overflow-hidden bg-zinc-800">
                               <PersonaAvatar src={s.personaImage} alt="" />
                            </div>
                         </div>
                      ))}
                   </div>
                   <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 group-hover:text-white transition-colors">
                      {unviewedCount > 0 ? `${unviewedCount} NEW` : 'DISCOVER STORIES'}
                   </span>
                  {unviewedCount > 0 && (
                     <div className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse shadow-[0_0_10px_#00f0ff]" />
                  )}
               </motion.button>
            ) : (
               <motion.div
                 key="expanded"
                 initial={{ opacity: 0, height: 0 }}
                 animate={{ opacity: 1, height: 'auto' }}
                 exit={{ opacity: 0, height: 0 }}
                 className="w-full relative flex flex-col gap-2 items-center"
               >
                  <div className="w-full flex items-center justify-between px-6 md:px-12 mb-2">
                     <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Discovery Pulse</span>
                     <button onClick={() => setIsExpanded(false)} className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-white transition-colors flex items-center gap-2">
                        HIDE <X size={10} />
                     </button>
                  </div>
                  
                  <div className="w-full relative">
                     <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none opacity-0 group-hover/stories:opacity-100 transition-opacity md:w-32" />
                     <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none opacity-0 group-hover/stories:opacity-100 transition-opacity md:w-32" />

                     <div className="w-full flex items-center gap-4 px-4 pb-4 md:px-12 overflow-x-auto no-scrollbar scroll-smooth relative touch-pan-x">
                        {storyData.map((bubble, idx) => (
                           <motion.button
                           key={bubble.personaId}
                           initial={{ opacity: 0, scale: 0.8, y: 10 }}
                           animate={{ opacity: 1, scale: 1, y: 0 }}
                           transition={{ delay: idx * 0.05, type: 'spring', stiffness: 200 }}
                           onClick={() => openStory(bubble)}
                           whileHover={{ scale: 1.05 }}
                           whileTap={{ scale: 0.95 }}
                           className="flex flex-col items-center gap-2 shrink-0 group relative min-w-[70px] md:min-w-[90px]"
                           >
                           {/* The ring */}
                           <div className={`p-[2px] rounded-full transition-all duration-500 relative ${
                              bubble.hasUnviewed
                                 ? 'bg-gradient-to-br from-[#00f0ff] via-[#ff00ff] to-[#ffea00] shadow-[0_0_20px_rgba(255,0,255,0.4)]'
                                 : 'bg-white/5 opacity-40 group-hover:opacity-100 group-hover:bg-white/10'
                           }`}>
                              {bubble.hasUnviewed && (
                                 <div className="absolute inset-0 bg-[#00f0ff] animate-ping opacity-20 rounded-full pointer-events-none" />
                              )}
                              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-black relative">
                                 <PersonaAvatar
                                    src={bubble.personaImage}
                                    alt={bubble.personaName}
                                 />
                                 <div className="absolute top-1 right-1 w-3 h-3 md:w-4 md:h-4 rounded-full bg-[#00ff00] border-2 border-black shadow-[0_0_10px_#00ff00] animate-pulse" />
                              </div>
                           </div>
                           <span className={`text-[10px] md:text-[11px] font-black uppercase tracking-widest truncate max-w-[80px] leading-none transition-all ${
                              bubble.hasUnviewed ? 'text-white' : 'text-white/20'
                           }`}>
                              {bubble.personaName}
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
                  <PersonaAvatar src={activeStory.bubble.personaImage} alt="" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-white tracking-widest">{activeStory.bubble.personaName} <Zap size={10} className="inline ml-1 text-[#ffea00]" /></p>
                  <p className="text-[8px] text-white/40 uppercase tracking-[0.2em]">{currentStory.category || 'elite'} • now</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onSelectPersona(activeStory.bubble.personaId);
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
                <div className="absolute inset-0 z-50 flex">
                   {/* Capture clicks for next/prev but allow the main div to handle "default next" */}
                  <div className="flex-1 cursor-pointer" onClick={(e) => {
                    e.stopPropagation();
                    const { bubble, storyIndex } = activeStory;
                    if (storyIndex > 0) setActiveStory({ bubble, storyIndex: storyIndex - 1 });
                  }} />
                  <div className="flex-1 cursor-pointer" onClick={(e) => {
                    e.stopPropagation();
                    const { bubble, storyIndex } = activeStory;
                    if (storyIndex < bubble.stories.length - 1) {
                      setActiveStory({ bubble, storyIndex: storyIndex + 1 });
                    } else {
                      setActiveStory(null);
                    }
                  }} />
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
                      onClick={(e) => { e.stopPropagation(); onSelectPersona(activeStory.bubble.personaId); setActiveStory(null); }}
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

            {/* Bottom CTA */}
            <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center bg-gradient-to-t from-black/60 to-transparent">
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onSelectPersona(activeStory.bubble.personaId); 
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
