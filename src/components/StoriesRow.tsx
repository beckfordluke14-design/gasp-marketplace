'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { initialPersonas, proxyImg, getPersonaName } from '@/lib/profiles';
import { createClient } from '@supabase/supabase-js';
import { X, Lock, Volume2, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import PersonaAvatar from './persona/PersonaAvatar';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);

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
      const { data: dbStories } = await supabase
        .from('persona_stories')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      // Build per-persona bubbles
      const bubbles: StoryBubble[] = personas
        .filter(p => p.image)
        .map(p => {
          const pStories = (dbStories || []).filter((s: any) => s.persona_id === p.id);
          // Only include personas that have actual DB stories OR show them neutrally as fallback
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
            // 🛡️ FIX 2: Only glow pink if there are REAL unviewed DB stories — not fallback placeholders
            hasUnviewed: hasDatabaseStories && pStories.some(s => !viewedIds.has(s.id)),
          };
        });

      setStoryData(bubbles);
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
          // Advance to next story or close
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
    // Mark all as viewed
    const newViewed = new Set(viewedIds);
    bubble.stories.forEach(s => newViewed.add(s.id));
    setViewedIds(newViewed);
    localStorage.setItem('gasp_viewed_stories', JSON.stringify([...newViewed]));
  };

  const currentStory = activeStory ? activeStory.bubble.stories[activeStory.storyIndex] : null;

  if (storyData.length === 0) return null;

  return (
    <>
      {/* STORIES ROW */}
      <div className="w-full flex items-center gap-4 px-4 py-3 overflow-x-auto no-scrollbar">
        {storyData.map((bubble, idx) => (
          <motion.button
            key={bubble.personaId}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => openStory(bubble)}
            className="flex flex-col items-center gap-1.5 shrink-0 group"
          >
            {/* The ring */}
            <div className={`p-[2px] rounded-full transition-all ${
              bubble.hasUnviewed
                ? 'bg-gradient-to-br from-[#ff00ff] via-[#ff6b6b] to-[#ffea00] shadow-[0_0_20px_rgba(255,0,255,0.5)]'
                : 'bg-white/10'
            }`}>
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-black relative">
                <PersonaAvatar
                  src={bubble.personaImage}
                  alt={bubble.personaName}
                />
                
                {/* 🧬 GREEN STATUS PULSE */}
                <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#00ff00] border border-black shadow-[0_0_8px_#00ff00] animate-pulse" />
              </div>
            </div>
            {/* Name */}
            <span className={`text-[9px] font-black uppercase tracking-wider truncate max-w-[60px] leading-none ${
              bubble.hasUnviewed ? 'text-white' : 'text-white/30'
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-black flex flex-col"
          >
            {/* Progress bars */}
            <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-3 pt-safe">
              {activeStory.bubble.stories.map((_, i) => (
                <div key={i} className="flex-1 h-0.5 bg-white/20 rounded-full overflow-hidden">
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
            <div className="absolute top-8 left-0 right-0 z-10 flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
                  <PersonaAvatar src={activeStory.bubble.personaImage} alt="" width={32} height={32} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-white tracking-wider">{activeStory.bubble.personaName}</p>
                  <p className="text-[9px] text-white/40 uppercase tracking-widest">{currentStory.category?.toLowerCase()} • now</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onSelectPersona(activeStory.bubble.personaId);
                    setActiveStory(null);
                  }}
                  className="px-3 py-1.5 bg-[#ff00ff]/20 border border-[#ff00ff]/40 rounded-full text-[9px] font-black text-[#ff00ff] uppercase tracking-wider"
                >
                  Message
                </button>
                <button onClick={() => setActiveStory(null)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <X size={14} className="text-white" />
                </button>
              </div>
            </div>

            {/* Story Content / Navigation */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
              {/* Desktop Container Control */}
              <div className="relative h-full aspect-[9/16] max-h-screen bg-[#050505] shadow-2xl overflow-hidden group/container">
                
                {/* Navigation Overlay Areas (Invisible on Desktop, Useful for Mobile Tap) */}
                <div className="absolute inset-0 z-50 flex">
                  <div className="flex-1 cursor-pointer" onClick={() => {
                    const { bubble, storyIndex } = activeStory;
                    if (storyIndex > 0) {
                      setActiveStory({ bubble, storyIndex: storyIndex - 1 });
                    }
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

                {/* Desktop Buttons */}
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
                      <h3 className="text-white font-black uppercase text-lg tracking-tight">Premium Story</h3>
                      <p className="text-white/40 text-[10px] uppercase tracking-widest">unlock for 40 credits</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectPersona(activeStory.bubble.personaId); setActiveStory(null); }}
                      className="px-8 py-4 bg-[#ff00ff] text-black rounded-2xl font-black uppercase tracking-wider text-sm relative z-50"
                    >
                      Unlock Story — 40 Credits
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
                          className="w-full h-full object-cover object-top lg:object-contain" // Cover for mobile-style, contain fallback for weird aspect ratios on desktop if needed
                       />
                    ) : (
                      <Image
                        src={proxyImg(currentStory.asset_url)}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover object-top lg:object-contain"
                      />

                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onSelectPersona(activeStory.bubble.personaId); 
                  setActiveStory(null);
                }}
                className="w-full py-4 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl text-white font-black uppercase tracking-widest text-xs"
              >
                💬 Chat with {activeStory.bubble.personaName}
              </button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


