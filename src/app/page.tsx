'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense, useMemo } from 'react';
import GlobalFeed from '@/components/GlobalFeed';
import MobileBottomNav from '@/components/MobileBottomNav';
import ChatDrawer from '@/components/ChatDrawer';
import TopDiscovery from '@/components/TopDiscovery';
import ChatCluster from '@/components/ChatCluster';
import ConnectionsHub from '@/components/ConnectionsHub';
import GhostActivityTicker from '@/components/GhostActivityTicker';
import PersonaAvatar from '@/components/persona/PersonaAvatar';
import TopUpDrawer from '@/components/economy/TopUpDrawer';
import RightSidebar from '@/components/RightSidebar';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { initialPersonas, proxyImg } from '@/lib/profiles';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';

const GASP_PULSES = [
  "just arrived.", "at the penthouse.", "looking for something fun.",
  "dm for the vibe.", "in medallo.", "missed you.", "active 💎",
  "drip too hard.", "need a vacation.", "don't touch the hair.",
  "klk with the vibe.", "streets is watching.", "feeling elite today."
];


import { useUser } from '@/components/providers/UserProvider';
import NeuralDiscoveryBubbles from '@/components/NeuralDiscoveryBubbles';

function MarketplaceMain() {
  const { profile } = useUser();
  const [mounted, setMounted] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState(initialPersonas[0]?.id ?? '');
  const [openChatIds, setOpenChatIds] = useState<string[]>([]);
  const [minimizedIds, setMinimizedIds] = useState<string[]>([]);
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [guestId, setGuestId] = useState<string>('');
  const [dbPersonas, setDbPersonas] = useState<any[]>([]);
  // 🛡️ SOVEREIGN CHAT CACHE: Ensures any persona clicked from feed can open a chat
  // even if their image filter excluded them from refinedPersonas
  const [chatPersonaCache, setChatPersonaCache] = useState<Record<string, any>>({});
  const [isZenMode, setIsZenMode] = useState(false);
  const [deadIds, setDeadIds] = useState<Set<string>>(new Set());
  const searchParams = useSearchParams();

  useEffect(() => { 
    setMounted(true); 
    const loadPersonas = async () => {
        // 🚑 NEURAL SYNC: Fetch all active personas AND the feed to ensure total coverage
        try {
          const [resFeed, resActive] = await Promise.all([
             fetch('/api/admin/feed?limit=200'),
             fetch('/api/personas')
          ]);
          
          const jsonFeed = await resFeed.json();
          const jsonActive = await resActive.json();
          
          const mergedSet = new Map();
          
          // Seed from active personas table (Source of Truth)
          if (jsonActive.success) {
             jsonActive.personas.forEach((p: any) => mergedSet.set(String(p.id), p));
          }

          // Merge updates from the feed (Current Hero Images)
          if (jsonFeed.success && jsonFeed.posts) {
             jsonFeed.posts.forEach((p: any) => {
                if (p.personas) {
                   const pid = String(p.persona_id);
                   const existing = mergedSet.get(pid) || {};
                   mergedSet.set(pid, {
                      ...existing,
                      ...p.personas,
                      id: pid,
                      // Prioritize the feed's hero content for the bubble image
                      image: proxyImg(p.content_url || p.personas.seed_image_url || existing.image)
                   });
                }
             });
          }

          const finalPersonas = Array.from(mergedSet.values());
          console.log(`[Neural Sync] Synced ${finalPersonas.length} characters in cloud.`);
          setDbPersonas(finalPersonas);
        } catch (e) {
          console.error('[Personas] Fetch failed:', e);
        }
    };
    loadPersonas();

    // 🔔 UNREAD SYNC: Monitor global message pulses
    const syncUnreads = () => {
       const stored = JSON.parse(localStorage.getItem('gasp_unread_counts') || '{}');
       setUnreadCounts(stored);
    };
    syncUnreads();
    window.addEventListener('gasp_unread_pulse', syncUnreads);
    return () => window.removeEventListener('gasp_unread_pulse', syncUnreads);
  }, []);

  useEffect(() => {
    let id = localStorage.getItem('gasp_guest_id');
    if (!id) {
       id = `guest-${Math.random().toString(36).substring(2, 11)}`;
       localStorage.setItem('gasp_guest_id', id);
    }
    setGuestId(id);

    // 🤝 DATABASE CONNECTION SYNC
    const syncFollows = async () => {
       const idToUse = id;
       if (!idToUse) return;
       const { data } = await supabase.from('user_relationships').select('persona_id').eq('user_id', idToUse);
       if (data) setFollowedIds(data.map(r => r.persona_id));
    };

    syncFollows();
    
    // Listen for manual sync events from ChatDrawer (BroadcastChannel or window event)
    window.addEventListener('gasp_sync_follows', syncFollows);
    return () => window.removeEventListener('gasp_sync_follows', syncFollows);
  }, [guestId]);

  const allPersonas = useMemo(() => {
    const dbMapped = (dbPersonas || []).map(p => {
      const fallback = (initialPersonas.find(i => i.id === p.id) || {}) as any;
      return {
        ...fallback, // Status-quo defaults
        ...p,        // Database sovereignty updates
        image: proxyImg(p.image || p.seed_image_url || fallback.image),
        isOnline: p.status === 'online' || p.is_active === true,
        vibe: p.vibe || fallback.vibe || GASP_PULSES[(p.id || '').length % GASP_PULSES.length]
      };
    });

    // Merge DB + hardcoded, deduplicate by unique Identity slug
    return [
      ...dbMapped,
      ...initialPersonas
    ]
      .filter((p, index, self) => index === self.findIndex((t) => t.id === p.id))
      .filter(p => p.id && p.id !== '' && p.id !== 'undefined');
  }, [dbPersonas]);

  const refinedPersonas = useMemo(() => {
    // 🎲 HIGH-VALUE SHUFFLE: Randomize the stories and sidebar 
    const randomized = [...allPersonas].sort(() => 0.5 - Math.random());

    return randomized.map(p => ({
      ...p,
      isOnline: p.status === 'online' || p.is_active === true,
      vibe: p.vibe || GASP_PULSES[(p.id || '').length % GASP_PULSES.length]
    }));
  }, [allPersonas]);

  const handleSelectPersona = async (id: string, initialMsg?: string, personaObj?: any) => {
    const sId = String(id);
    setSelectedPersonaId(sId);
    
    // 🛡️ IDENTITY CACHE: If we have the persona object (from feed/search), cache it locally
    // to prevent 'Establishing Link' hangs while DB fetches the rest.
    if (personaObj) {
        setChatPersonaCache(prev => ({ ...prev, [sId]: personaObj }));
    } else {
        // Only fetch if we don't already have it in refinedPersonas or cache
        const alreadyKnown = refinedPersonas.find((p: any) => String(p.id) === sId) || chatPersonaCache[sId];
        if (!alreadyKnown) {
          try {
            const { data: fetchedPersona } = await supabase.from('personas').select('*').eq('id', sId).maybeSingle();
            if (fetchedPersona) {
              setChatPersonaCache(prev => ({
                ...prev,
                [sId]: {
                  ...fetchedPersona,
                  image: fetchedPersona.seed_image_url || fetchedPersona.image || '/v1.png',
                  vibe: 'online now',
                  status: 'online'
                }
              }));
            }
          } catch (e) {
            console.warn('[Chat] Persona fetch failed for', sId, e);
          }
        }
    }

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    setOpenChatIds(prev => (isMobile ? [sId] : prev.includes(sId) ? prev : [...prev, sId]));
    setMinimizedIds(prev => prev.filter(m => m !== sId));
    
    if (isMobile) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCloseChat = (id: string) => {
    setOpenChatIds(prev => prev.filter(oid => oid !== id));
    setMinimizedIds(prev => prev.filter(mid => mid !== id));
  };

  const handleZenToggle = () => {
     const isAdmin = (profile as any)?.is_admin;
     if (isAdmin) {
        setIsZenMode(!isZenMode);
     }
  };

  const isChatOpenMobile = openChatIds.filter(id => !minimizedIds.includes(id)).length > 0;

  if (!mounted) return (<div className="min-h-screen bg-black flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#ffea00]/20 border-t-[#ffea00] rounded-full animate-spin" /></div>);

  const activeHubIds = [...new Set([...minimizedIds, ...followedIds])];

  return (
    <div className="flex h-[100dvh] bg-black overflow-hidden font-inter" onDoubleClick={handleZenToggle}>
      <Header onOpenTopUp={() => setIsTopUpOpen(true)} deadIds={deadIds} setDeadIds={setDeadIds} />

      {!isZenMode && (
         <TopDiscovery 
           selectedPersonaId={selectedPersonaId} 
           onSelectPersona={handleSelectPersona} 
           unreadCounts={unreadCounts} 
           personas={refinedPersonas} 
           deadIds={deadIds}
           setDeadIds={setDeadIds}
         />
      )}

      {!isZenMode && (
         <Sidebar 
           selectedPersonaId={selectedPersonaId} 
           onSelectPersona={handleSelectPersona} 
           unreadCounts={unreadCounts} 
           personas={refinedPersonas} 
         />
      )}

      <main className="flex-1 flex flex-col relative overflow-hidden bg-black">
          <div className="flex-1 overflow-y-auto no-scrollbar pt-32 pb-64 flex justify-center">
             <div className="w-full max-w-[1200px] px-4">
                <GlobalFeed onSelectPersona={handleSelectPersona} />
             </div>
          </div>
          <div className="fixed bottom-6 left-6 z-[800]">
             <GhostActivityTicker />
          </div>
      </main>

      {!isZenMode && (
        <RightSidebar onSelectPersona={handleSelectPersona} personas={refinedPersonas} deadIds={deadIds} setDeadIds={setDeadIds} />
      )}

      <div className={`fixed inset-y-0 right-0 ${isChatOpenMobile ? 'z-[2000]' : 'z-[500]'} flex flex-row-reverse pointer-events-none items-end`}>
        <AnimatePresence mode="popLayout">
           {[...openChatIds].reverse().map((id, index) => {
              const sId = String(id);
              const isMinimized = minimizedIds.includes(sId);
              const p = refinedPersonas.find((persona: any) => String(persona.id) === sId) || chatPersonaCache[sId];
              
              if (isMinimized) return null;
              if (!p) {
                return (
                  <motion.div key={sId} initial={{ x: '100%', opacity: 0 }} animate={{ x: `-${index * 12}px`, opacity: 1 }} exit={{ x: '100%', opacity: 0 }}
                    className="h-full w-[480px] pointer-events-auto bg-black shadow-[-20px_0_60px_rgba(0,0,0,0.8)] flex items-center justify-center border-l border-white/5"
                  >
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <div className="w-10 h-10 border-2 border-[#ff00ff]/40 border-t-[#ff00ff] rounded-full animate-spin" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-white">establishing link...</span>
                    </div>
                  </motion.div>
                );
              }
              return (
                <motion.div key={sId} initial={{ x: '100%', opacity: 0 }} animate={{ x: `-${index * 12}px`, opacity: 1 }} exit={{ x: '100%', opacity: 0 }} 
                   className="h-full pointer-events-auto bg-black shadow-[-20px_0_60px_rgba(0,0,0,0.8)]"
                >
                  <ChatDrawer personaId={sId} persona={p} onClose={() => handleCloseChat(sId)} onMinimize={() => setMinimizedIds([...minimizedIds, sId])} />
                </motion.div>
              );
           })}
        </AnimatePresence>
      </div>

      {!isZenMode && minimizedIds.length > 0 && (
         <ChatCluster activeChatIds={minimizedIds} unreadCounts={unreadCounts} onRestore={(id) => handleSelectPersona(String(id))} personas={refinedPersonas} />
      )}

      {!isZenMode && followedIds.length > 0 && (
         <ConnectionsHub followedIds={followedIds} unreadCounts={unreadCounts} onSelectPersona={handleSelectPersona} personas={refinedPersonas} />
      )}

      {!isZenMode && !isChatOpenMobile && (
        <MobileBottomNav unreadCounts={unreadCounts} onSelectChat={() => handleSelectPersona(selectedPersonaId)} onOpenTopUp={() => setIsTopUpOpen(true)} />
      )}

      {isTopUpOpen && <TopUpDrawer userId={guestId} onClose={() => setIsTopUpOpen(false)} />}
    </div>
  );
}

export default function GaspMarketplace() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
       <MarketplaceMain />
    </Suspense>
  );
}
