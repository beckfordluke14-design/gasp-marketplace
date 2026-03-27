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
                hasUnviewed: hasDatabaseStories && pStories.some(s => !viewedIds.has(s.id)),
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

  const openStory = (bubble: StoryBubble) => {
    setActiveStory({ bubble, storyIndex: 0 });
    const newViewed = new Set(viewedIds);
    bubble.stories.forEach(s => newViewed.add(s.id));
    setViewedIds(newViewed);
    localStorage.setItem('gasp_viewed_stories', JSON.stringify([...newViewed]));
  };

  const currentStory = activeStory ? activeStory.bubble.stories[activeStory.storyIndex] : null;

  if (storyData.length === 0) return null;

  return (
    <>
      <div className="w-full flex items-center gap-4 px-4 py-4 overflow-x-auto no-scrollbar scroll-smooth">
        {storyData.map((bubble, idx) => (
          <motion.button
            key={bubble.personaId}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: idx * 0.05, type: 'spring', stiffness: 200 }}
            onClick={() => openStory(bubble)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-2 shrink-0 group relative"
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
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-black relative">
                <PersonaAvatar
                  src={bubble.personaImage}
                  alt={bubble.personaName}
                />
                
                {/* 🧬 GREEN STATUS PULSE (ONLY IF ACTIVE BUBBLE) */}
                <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#00ff00] border border-black shadow-[0_0_8px_#00ff00] animate-pulse" />
              </div>
            </div>
            {/* Name */}
            <span className={`text-[9px] font-black uppercase tracking-widest truncate max-w-[64px] leading-none transition-all ${
              bubble.hasUnviewed ? 'text-white' : 'text-white/20'
            }`}>
              {bubble.personaName}
            </span>
          </motion.button>
        ))}
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
                  Bridge Direct
                </button>
                <button onClick={() => setActiveStory(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/5">
                  <X size={16} className="text-white" />
                </button>
              </div>
            </div>

            {/* Story Content / Navigation */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
              <div className="relative h-full aspect-[9/16] bg-black shadow-2xl overflow-hidden group/container">
                <div className="absolute inset-0 z-50 flex">
                  <div className="flex-1 cursor-pointer" onClick={() => {
                    const { bubble, storyIndex } = activeStory;
                    if (storyIndex > 0) setActiveStory({ bubble, storyIndex: storyIndex - 1 });
                  }} />
                  <div className="flex-1 cursor-pointer" onClick={() => {
                    const { bubble, storyIndex } = activeStory;
                    if (storyIndex < bubble.stories.length - 1) {
                      setActiveStory({ bubble, storyIndex: storyIndex + 1 });
                    } else {
                      setActiveStory(null);
                    }
                  }} />
                </div>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const { bubble, storyIndex } = activeStory;
                    if (storyIndex > 0) setActiveStory({ bubble, storyIndex: storyIndex - 1 });
                  }}
                  className={`absolute left-4 top-1/2 -translate-y-1/2 z-[60] w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover/container:opacity-100 transition-opacity hover:bg-black/60 ${activeStory.storyIndex === 0 ? 'hidden' : ''}`}
                >
                  <ChevronLeft size={24} />
                </button>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const { bubble, storyIndex } = activeStory;
                    if (storyIndex < bubble.stories.length - 1) {
                      setActiveStory({ bubble, storyIndex: storyIndex + 1 });
                    } else {
                      setActiveStory(null);
                    }
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-[60] w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover/container:opacity-100 transition-opacity hover:bg-black/60"
                >
                  <ChevronRight size={24} />
                </button>

                {currentStory.is_premium ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/80 backdrop-blur-3xl z-40">
                    <div className="w-20 h-20 rounded-[2rem] bg-[#ff00ff]/10 border border-[#ff00ff]/30 flex items-center justify-center">
                      <Lock size={32} className="text-[#ff00ff]" />
                    </div>
                    <div className="text-center px-8 space-y-2">
                       <h3 className="text-white font-black uppercase text-lg tracking-tight">Encrypted Story</h3>
                       <p className="text-white/40 text-[10px] uppercase tracking-widest leading-relaxed">this high-status node is locked</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectPersona(activeStory.bubble.personaId); setActiveStory(null); }}
                      className="px-10 py-5 bg-[#ff00ff] text-white rounded-3xl font-black uppercase tracking-wider text-[11px] shadow-[0_0_40px_rgba(255,0,255,0.3)] hover:scale-105 transition-all"
                    >
                      Unlock for 40 Credits 💎
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
                className="w-full max-w-sm h-16 bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl text-white font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white/20 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse" />
                Open Neural Link
              </button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
