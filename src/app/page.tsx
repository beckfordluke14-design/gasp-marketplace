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
import ErrorBoundary from '@/components/ErrorBoundary';
import { initialProfiles, proxyImg } from '@/lib/profiles';
import { trackEvent } from '@/lib/telemetry';
import TopUpDrawer from '@/components/economy/TopUpDrawer';
import ChatDrawer from '@/components/ChatDrawer';
import { useUser } from '@/components/providers/UserProvider';

function MarketplaceContent() {
  const [mounted, setMounted] = useState(false);
  const [dbProfiles, setDbProfiles] = useState<any[]>([]);
  const [openChatIds, setOpenChatIds] = useState<string[]>([]);
  const [minimizedIds, setMinimizedIds] = useState<string[]>([]);
  const [chatProfileCache, setChatProfileCache] = useState<Record<string, any>>({});
  const [selectedProfileId, setSelectedProfileId] = useState<string>(initialProfiles[0]?.id ?? '');
  const [deadIds, setDeadIds] = useState<Set<string>>(new Set());
  const [showStories, setShowStories] = useState(true);
  const [showProfileList, setShowProfileList] = useState(false);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [sidebarView, setSidebarView] = useState<'chats' | 'vault' | 'feed'>('chats');
  
  const handleSetSidebarView = (view: 'chats' | 'vault' | 'feed') => {
     if (view === 'feed') {
        setShowProfileList(false);
     } else {
        setSidebarView(view);
     }
  };
  
  const searchParams = useSearchParams();

  useEffect(() => { 
    setMounted(true); 
    const loadProfiles = async () => {
        try {
          const [resFeed, resActive] = await Promise.all([
             fetch(`/api/admin/feed?limit=200&t=${Date.now()}`),
             fetch(`/api/personas?t=${Date.now()}`)
          ]);
          
          const jsonFeed = await resFeed.json();
          const jsonActive = await resActive.json();
          
          const mergedSet = new Map();
          if (jsonActive.success) {
             jsonActive.personas.forEach((p: any) => mergedSet.set(String(p.id), {
               ...p,
               image: proxyImg(p.seed_image_url || p.image),
             }));
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
          setDbProfiles(Array.from(mergedSet.values()));
        } catch (e) {
          console.error('[Personas] Fetch failed:', e);
        }
    };
    loadProfiles();

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
    
    const pId = searchParams.get('profile');
    if (pId) handleSelectProfile(String(pId));

    return () => window.removeEventListener('gasp_unread_sync_trigger', syncUnreads);
  }, [searchParams]);

  const refinedProfiles = useMemo(() => {
    const registry = new Map();
    [...dbProfiles, ...initialProfiles].forEach(p => {
       if (!registry.has(String(p.id))) registry.set(String(p.id), p);
    });
    return Array.from(registry.values());
  }, [dbProfiles]);

  const handleSelectProfile = async (id: string, initialMsg?: string, profileObj?: any) => {
    const sId = String(id);
    setSelectedProfileId(sId);
    
    // 🧠 PROFILE HYDRATE: Ensure profile is cached
    if (profileObj) {
      setChatProfileCache(prev => ({ ...prev, [sId]: profileObj }));
    } else {
      const p = initialProfiles.find(profileItem => String(profileItem.id) === sId) || 
                dbProfiles.find(profileItem => String(profileItem.id) === sId);
      if (p) {
        setChatProfileCache(prev => ({ ...prev, [sId]: p }));
      } else {
         // Fallback: Final sync trigger
         console.warn('[Profile Sync]: Attempting deferred hydrate for:', sId);
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
  
  const randomizedProfiles = useMemo(() => {
    // 🎲 RANDOM SHUFFLE
    return [...refinedProfiles].sort((a, b) => {
       const scoreA = (parseInt(String(a.id).substring(0, 8), 16) || 0) * randomSeed;
       const scoreB = (parseInt(String(b.id).substring(0, 8), 16) || 0) * randomSeed;
       return scoreB - scoreA; 
    });
  }, [refinedProfiles, randomSeed]);

  if (!mounted) return null;

   return (
    <main className="min-h-screen bg-black text-white relative flex flex-col pt-24 lg:flex-row xl:gap-0 overflow-hidden">
       <Sidebar 
          onSelectProfile={handleSelectProfile} 
          selectedProfileId={selectedProfileId} 
          profiles={randomizedProfiles} 
          view={sidebarView}
          onSetView={handleSetSidebarView}
       />
       
       <div className="flex-1 flex flex-col relative h-screen overflow-hidden">
           <Header onOpenTopUp={() => setIsTopUpOpen(true)} deadIds={deadIds} setDeadIds={setDeadIds} onOpenMenu={() => setShowProfileList(true)} />
           
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
                          <StoriesRow profiles={randomizedProfiles} onSelectProfile={handleSelectProfile} />
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
                 <GlobalFeed onSelectProfile={handleSelectProfile} />
              </div>
           </div>
        </div>

        {/* 3rd Column Discovery Blade */}
        <RightSidebar 
          onSelectProfile={handleSelectProfile} 
          profiles={randomizedProfiles} 
          deadIds={deadIds} 
          setDeadIds={setDeadIds} 
        />

       <div className="fixed inset-0 pointer-events-none z-[1000] flex items-end justify-end p-6 gap-4">
          <AnimatePresence>
            {openChatIds.filter(id => !minimizedIds.includes(id)).map((sId, index) => {
              const p = initialProfiles.find((profileItem: any) => String(profileItem.id) === sId) || chatProfileCache[sId];
              if (!p) return (
                <motion.div key={sId} initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }} className="h-full pointer-events-auto bg-black border-l border-white/5 shadow-2xl">
                    <div className="flex flex-col items-center justify-center h-full p-10 text-center gap-6">
                       <Zap className="text-[#ffea00] animate-pulse" size={40} />
                       <p className="text-[10px] text-white/40 uppercase tracking-[0.4em]">establishing link...</p>
                    </div>
                </motion.div>
              );
              return (
                <motion.div 
                   key={sId} 
                   initial={{ x: '100%', scale: 0.95, opacity: 0 }} 
                   animate={{ 
                     x: `-${index * 24}px`, 
                     scale: 1, 
                     opacity: 1 
                   }} 
                   exit={{ x: '100%', scale: 0.95, opacity: 0 }} 
                   transition={{ 
                     type: 'spring', 
                     damping: 25, 
                     stiffness: 150 
                   }}
                   style={{ zIndex: 1000 - index }}
                   className="h-full pointer-events-auto bg-black shadow-[-40px_0_80px_rgba(0,0,0,0.9)] origin-right"
                >
                   <ErrorBoundary key={sId}>
                       <ChatDrawer 
                         profileId={sId} 
                         profile={p} 
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
        {/* MOBILE PROFILE DRAWER */}
        <AnimatePresence>
           {showProfileList && (
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-3xl lg:hidden overflow-y-auto"
              >
                 {/* 🚀 MAIN CONTENT HUB */}
                 <div className="pt-36 lg:pt-32 pb-32">
                    <button onClick={() => setShowProfileList(false)} className="mb-4 text-[#00f0ff] uppercase text-[10px] font-black">← Close Deck</button>
                    <Sidebar 
                       onSelectProfile={(id) => { handleSelectProfile(id); setShowProfileList(false); }} 
                       selectedProfileId={selectedProfileId} 
                       profiles={randomizedProfiles} 
                       view={sidebarView}
                       onSetView={handleSetSidebarView}
                    />
                 </div>
              </motion.div>
           )}
        </AnimatePresence>

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
