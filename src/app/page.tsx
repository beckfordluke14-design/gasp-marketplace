'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, MessageSquare } from 'lucide-react';
import GlobalFeed from '@/components/GlobalFeed';
import RightSidebar from '@/components/RightSidebar';
import StoriesRow from '@/components/StoriesRow';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import ErrorBoundary from '@/components/ErrorBoundary';
import { initialPersonas, proxyImg } from '@/lib/profiles';
import { supabase } from '@/lib/supabaseClient';
import { trackEvent } from '@/lib/telemetry';
import TopUpDrawer from '@/components/economy/TopUpDrawer';
import ChatDrawer from '@/components/ChatDrawer';
import { useUser } from '@/components/providers/UserProvider';

function MarketplaceContent() {
  const [mounted, setMounted] = useState(false);
  const [dbPersonas, setDbPersonas] = useState<any[]>([]);
  const [openChatIds, setOpenChatIds] = useState<string[]>([]);
  const [minimizedIds, setMinimizedIds] = useState<string[]>([]);
  const [chatPersonaCache, setChatPersonaCache] = useState<Record<string, any>>({});
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(initialPersonas[0]?.id ?? '');
  const [deadIds, setDeadIds] = useState<Set<string>>(new Set());
  const [showStories, setShowStories] = useState(true);
  const [showPersonaList, setShowPersonaList] = useState(false);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  
  const searchParams = useSearchParams();

  useEffect(() => { 
    setMounted(true); 
    const loadPersonas = async () => {
        try {
          const [resFeed, resActive] = await Promise.all([
             fetch('/api/admin/feed?limit=200'),
             fetch('/api/personas')
          ]);
          
          const jsonFeed = await resFeed.json();
          const jsonActive = await resActive.json();
          
          const mergedSet = new Map();
          if (jsonActive.success) {
             jsonActive.personas.forEach((p: any) => mergedSet.set(String(p.id), p));
          }
          if (jsonFeed.success && jsonFeed.posts) {
             jsonFeed.posts.forEach((p: any) => {
                if (p.personas) {
                   const pid = String(p.persona_id);
                   const existing = mergedSet.get(pid) || {};
                   mergedSet.set(pid, {
                      ...existing,
                      ...p.personas,
                      id: pid,
                      image: proxyImg(p.content_url || p.personas.seed_image_url || existing.image)
                   });
                }
             });
          }
          setDbPersonas(Array.from(mergedSet.values()));
        } catch (e) {
          console.error('[Personas] Fetch failed:', e);
        }
    };
    loadPersonas();

    const syncUnreads = () => {
       const stored = JSON.parse(localStorage.getItem('gasp_unread_counts') || '{}');
       const unreadTotal = Object.values(stored).reduce((a: any, b: any) => a + Number(b), 0);
       window.dispatchEvent(new CustomEvent('gasp_unread_sync', { detail: unreadTotal }));
    };
    syncUnreads();
    window.addEventListener('gasp_unread_sync_trigger', syncUnreads);

    let gId = localStorage.getItem('gasp_guest_id');
    if (!gId) {
       gId = `guest-${Math.random().toString(36).substring(2, 11)}`;
       localStorage.setItem('gasp_guest_id', gId);
    }
    setGuestId(gId);
    
    const pId = searchParams.get('persona');
    if (pId) handleSelectPersona(String(pId));

    return () => window.removeEventListener('gasp_unread_sync_trigger', syncUnreads);
  }, [searchParams]);

  const refinedPersonas = useMemo(() => {
    const registry = new Map();
    [...dbPersonas, ...initialPersonas].forEach(p => {
       if (!registry.has(String(p.id))) registry.set(String(p.id), p);
    });
    return Array.from(registry.values());
  }, [dbPersonas]);

  const handleSelectPersona = async (id: string, initialMsg?: string, personaObj?: any) => {
    const sId = String(id);
    setSelectedPersonaId(sId);
    
    // 🧠 NEURAL HYDRATE: Ensure persona is cached even if not in the active filtered list
    if (personaObj) {
      setChatPersonaCache(prev => ({ ...prev, [sId]: personaObj }));
    } else {
      const p = initialPersonas.find(persona => String(persona.id) === sId) || 
                dbPersonas.find(persona => String(persona.id) === sId);
      if (p) {
        setChatPersonaCache(prev => ({ ...prev, [sId]: p }));
      } else {
         // Fallback: Final sync trigger
         console.warn('[Neural Sync]: Attempting deferred hydrate for:', sId);
      }
    }
    
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    setOpenChatIds(prev => (isMobile ? [sId] : prev.includes(sId) ? prev : [...prev, sId]));
    setMinimizedIds(prev => prev.filter(m => m !== sId));
    trackEvent('chat_open', sId, { from: 'grid', hasInitialMsg: !!initialMsg });
  };

  const handleCloseChat = (id: string) => {
    setOpenChatIds(prev => prev.filter(cid => cid !== id));
    setMinimizedIds(prev => prev.filter(mid => mid !== id));
  };

  const { profile } = useUser();
  const idToUse = profile?.id || guestId || '';

  const [randomSeed] = useState(() => Math.random());
  
  const randomizedPersonas = useMemo(() => {
    // 🎲 CYBER-SHUFFLE: Non-deterministic character placement for elite discovery
    return [...refinedPersonas].sort((a, b) => {
       const scoreA = (parseInt(String(a.id).substring(0, 8), 16) || 0) * randomSeed;
       const scoreB = (parseInt(String(b.id).substring(0, 8), 16) || 0) * randomSeed;
       return scoreB - scoreA; // Reverse sorted by random product
    });
  }, [refinedPersonas, randomSeed]);

  if (!mounted) return null;

   return (
    <main className="min-h-screen bg-black text-white relative flex flex-col pt-24 lg:flex-row xl:gap-0 overflow-hidden">
       <Sidebar 
          onSelectPersona={handleSelectPersona} 
          selectedPersonaId={selectedPersonaId} 
          personas={randomizedPersonas} 
       />
       
       <div className="flex-1 flex flex-col relative h-screen overflow-hidden">
           <Header onOpenTopUp={() => setIsTopUpOpen(true)} deadIds={deadIds} setDeadIds={setDeadIds} />
           
           <div className="flex-1 flex flex-col relative pt-8">
              <AnimatePresence mode="wait">
                 {showStories && (
                    <motion.div 
                      initial={{ y: -20, opacity: 0 }} 
                      animate={{ y: 0, opacity: 1 }} 
                      exit={{ y: -20, opacity: 0 }}
                      className="absolute top-1 inset-x-0 z-[80] px-4 pointer-events-none"
                    >
                       <div className="max-w-2xl mx-auto py-1 shadow-[0_15px_40px_rgba(0,0,0,0.4)]">
                          <StoriesRow personas={randomizedPersonas} onSelectPersona={handleSelectPersona} />
                       </div>
                    </motion.div>
                 )}
              </AnimatePresence>
             
              {/* STORY TOGGLE PORTAL */}
              <div className="absolute right-6 top-0 z-50 flex items-center gap-3">
                 <button 
                   onClick={() => setShowStories(!showStories)}
                   className={`w-10 h-10 rounded-xl bg-black/40 backdrop-blur-3xl border border-white/10 flex items-center justify-center text-white/20 hover:text-[#ffea00] transition-all ${!showStories ? 'bg-[#ffea00]/10 text-[#ffea00]' : ''}`}
                 >
                    <Zap size={16} className={!showStories ? 'animate-pulse' : ''} />
                 </button>
              </div>

              <div className="flex-1 overflow-hidden relative">
                 <GlobalFeed onSelectPersona={handleSelectPersona} />
              </div>
           </div>
        </div>

        {/* 3rd Column Discovery Blade */}
        <RightSidebar 
          onSelectPersona={handleSelectPersona} 
          personas={randomizedPersonas} 
          deadIds={deadIds} 
          setDeadIds={setDeadIds} 
        />

       <div className="fixed inset-0 pointer-events-none z-[1000] flex items-end justify-end p-6 gap-4">
          <AnimatePresence>
            {openChatIds.filter(id => !minimizedIds.includes(id)).map((sId, index) => {
              const p = initialPersonas.find((persona: any) => String(persona.id) === sId) || chatPersonaCache[sId];
              if (!p) return (
                <motion.div key={sId} initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }} className="h-full pointer-events-auto bg-black border-l border-white/5 shadow-2xl">
                    <div className="flex flex-col items-center justify-center h-full p-10 text-center gap-6">
                       <Zap className="text-[#ffea00] animate-pulse" size={40} />
                       <p className="text-[10px] text-white/40 uppercase tracking-[0.4em]">establishing link...</p>
                    </div>
                </motion.div>
              );
              return (
                <motion.div key={sId} initial={{ x: '100%', opacity: 0 }} animate={{ x: `-${index * 12}px`, opacity: 1 }} exit={{ x: '100%', opacity: 0 }} className="h-full pointer-events-auto bg-black shadow-[-20px_0_60px_rgba(0,0,0,0.8)]">
                   <ErrorBoundary key={sId}>
                       <ChatDrawer 
                         personaId={sId} 
                         persona={p} 
                         onClose={() => handleCloseChat(sId)} 
                         onMinimize={() => setMinimizedIds([...minimizedIds, sId])} 
                         onOpenTopUp={() => setIsTopUpOpen(true)}
                       />
                   </ErrorBoundary>
                </motion.div>
              );
            })}
          </AnimatePresence>
       </div>
       {minimizedIds.length > 0 && (
         <div className="fixed bottom-6 left-6 z-[2000] flex flex-col gap-3">
            {minimizedIds.map(id => (
               <motion.div key={id} initial={{ scale: 0, x: -20 }} animate={{ scale: 1, x: 0 }} onClick={() => setMinimizedIds(prev => prev.filter(m => m !== id))} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all group relative">
                  <MessageSquare size={18} className="text-[#00f0ff] group-hover:scale-110 transition-transform" />
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#ff00ff] shadow-[0_0_10px_#ff00ff]" />
               </motion.div>
            ))}
         </div>
       )}
       {isTopUpOpen && (
         <div className="fixed inset-0 z-[5000] pointer-events-auto bg-black/80 backdrop-blur-md">
            <TopUpDrawer onClose={() => setIsTopUpOpen(false)} userId={idToUse} />
         </div>
       )}
        {/* MOBILE PERSONA DRAWER */}
        <AnimatePresence>
           {showPersonaList && (
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                className="fixed inset-0 z-[200] bg-black lg:hidden overflow-y-auto"
              >
                 {/* 🚀 MAIN CONTENT HUB */}
                 <div className="pt-36 lg:pt-32 pb-32">
                    <button onClick={() => setShowPersonaList(false)} className="mb-4 text-[#00f0ff] uppercase text-[10px] font-black">← Close Deck</button>
                    <Sidebar 
                       onSelectPersona={(id) => { handleSelectPersona(id); setShowPersonaList(false); }} 
                       selectedPersonaId={selectedPersonaId} 
                       personas={randomizedPersonas} 
                    />
                 </div>
              </motion.div>
           )}
        </AnimatePresence>

        <BottomNav 
          onOpenChatList={() => setShowPersonaList(true)} 
          onOpenTopUp={() => setIsTopUpOpen(true)}
        />
    </main>
  );
}

export default function MarketplaceMain() {
  return (
    <Suspense fallback={<div className="h-screen bg-black flex items-center justify-center text-white font-syncopate text-xs tracking-widest animate-pulse uppercase">Syncing Neural Core...</div>}>
      <MarketplaceContent />
    </Suspense>
  );
}
