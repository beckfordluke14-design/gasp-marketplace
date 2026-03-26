'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import GlobalFeed from '@/components/GlobalFeed';
import StoriesRow from '@/components/StoriesRow';
import RightSidebar from '@/components/RightSidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import ChatDrawer from '@/components/ChatDrawer';
import Header from '@/components/Header';
import ChatDock from '@/components/ChatDock';
import GhostActivityTicker from '@/components/GhostActivityTicker';
import PersonaAvatar from '@/components/persona/PersonaAvatar';
import TopUpDrawer from '@/components/economy/TopUpDrawer';
import { initialPersonas, proxyImg } from '@/lib/profiles';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';

const GASP_PULSES = [
  "just arrived.", "at the penthouse.", "looking for something fun.",
  "dm for the vibe.", "in medallo.", "missed you.", "active 💎",
  "drip too hard.", "need a vacation.", "don't touch the hair.",
  "klk with the vibe.", "streets is watching.", "feeling elite today."
];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);

import { useUser } from '@/components/providers/UserProvider';

function MarketplaceMain() {
  const { profile } = useUser();
  const [mounted, setMounted] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState(initialPersonas[0]?.id ?? '');
  const [openChatIds, setOpenChatIds] = useState<string[]>([]);
  const [minimizedIds, setMinimizedIds] = useState<string[]>([]);
  const [guestId, setGuestId] = useState<string>('');
  const [dbPersonas, setDbPersonas] = useState<any[]>([]);
  const [isZenMode, setIsZenMode] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => { 
    setMounted(true); 
    const loadPersonas = async () => {
        const { data } = await supabase.from('personas').select('*').eq('is_active', true);
        if (data) setDbPersonas(data);
    };
    loadPersonas();
  }, []);

  const allPersonas = [
    ...(dbPersonas || []).map(p => {
        const fallback = (initialPersonas.find(i => i.id === p.id) || {}) as any;
        return {
            ...fallback,
            id: p.id,
            name: p.name,
            city: p.city,
            image: proxyImg(p.seed_image_url || p.image || fallback.image),
            is_active: p.is_active,
        };
    }),
    ...initialPersonas
  ].filter((p, index, self) => index === self.findIndex((t) => t.id === p.id))
   .filter(p => p.image && p.image.startsWith('http'));

  const refinedPersonas = allPersonas.map(p => ({
    ...p,
    vibe: GASP_PULSES[(Math.floor(Date.now() / 3600000) + (p.id || '').length) % GASP_PULSES.length]
  }));

  useEffect(() => {
    let id = localStorage.getItem('gasp_guest_id');
    if (!id) {
       id = `guest-${Math.random().toString(36).substring(2, 11)}`;
       localStorage.setItem('gasp_guest_id', id);
    }
    setGuestId(id);
  }, []);

  const handleSelectPersona = (id: string) => {
    setSelectedPersonaId(id);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    setOpenChatIds(prev => (isMobile ? [id] : prev.includes(id) ? prev : [...prev, id]));
    setMinimizedIds(prev => prev.filter(m => m !== id));
  };

  const handleCloseChat = (id: string) => {
    setOpenChatIds(prev => prev.filter(oid => oid !== id));
    setMinimizedIds(prev => prev.filter(mid => mid !== id));
  };

  const handleZenToggle = () => {
     // 🛡️ SOVEREIGN GATE: Only admins can trigger the Zen Cleanse
     const isAdmin = (profile as any)?.is_admin;
     if (isAdmin) {
        setIsZenMode(!isZenMode);
     }
  };

  const isChatOpenMobile = openChatIds.filter(id => !minimizedIds.includes(id)).length > 0;

  if (!mounted) return (<div className="min-h-screen bg-black flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#ffea00]/20 border-t-[#ffea00] rounded-full animate-spin" /></div>);

  return (
    <div className="flex h-[100dvh] bg-black overflow-hidden font-inter" 
         onDoubleClick={handleZenToggle}
    >
      <AnimatePresence>
         {!isZenMode && (
           <motion.div initial={{ y: -100 }} animate={{ y: 0 }} exit={{ y: -100 }} 
                className={`fixed inset-x-0 top-0 z-[1000] ${isChatOpenMobile ? 'hidden md:block' : 'block'}`}
           >
            <Header onOpenTopUp={() => setIsTopUpOpen(true)} />
           </motion.div>
         )}
      </AnimatePresence>
      
      {/* 🧬 LEFT SIDEBAR: PERSISTENT ON DESKTOP */}
      {!isZenMode && (
        <div className={`${isChatOpenMobile ? 'hidden lg:block' : 'block'}`}>
           <Sidebar selectedPersonaId={selectedPersonaId} onSelectPersona={handleSelectPersona} unreadCounts={{}} personas={refinedPersonas} />
        </div>
      )}
      
      <main className="flex-1 flex flex-col relative overflow-hidden bg-black">
          {!isZenMode && <div className="h-24 md:h-32 shrink-0" />}
          
          {/* 💎 STORIES ROW: THE IDENTITY BUBBLES */}
          {!isZenMode && (
            <div className="shrink-0 bg-black/20 border-b border-white/5 pb-2">
               <StoriesRow personas={refinedPersonas} onSelectPersona={handleSelectPersona} />
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            <GlobalFeed onSelectPersona={handleSelectPersona} />
          </div>
      </main>

      {/* 🔮 CHAT HUB: BOOSTED Z-INDEX */}
      <div className={`fixed inset-y-0 right-0 ${isChatOpenMobile ? 'z-[2000]' : 'z-[500]'} flex flex-row-reverse pointer-events-none items-end`}>
        <AnimatePresence mode="popLayout">
           {[...openChatIds].reverse().map((id, index) => {
              const isMinimized = minimizedIds.includes(id);
              const p = refinedPersonas.find(p => p.id === id);
              if (!p || isMinimized) return null;
              return (
                <motion.div key={id} initial={{ x: '100%', opacity: 0 }} animate={{ x: `-${index * 12}px`, opacity: 1 }} exit={{ x: '100%', opacity: 0 }} 
                   className="h-full pointer-events-auto bg-black shadow-[-20px_0_60px_rgba(0,0,0,0.8)]"
                >
                  <ChatDrawer personaId={id} persona={p} onClose={() => handleCloseChat(id)} onMinimize={() => setMinimizedIds([...minimizedIds, id])} />
                </motion.div>
              );
           })}
        </AnimatePresence>
      </div>

      {!isZenMode && !isChatOpenMobile && (
        <MobileBottomNav  unreadCounts={{}} onSelectChat={() => handleSelectPersona(selectedPersonaId)} onOpenTopUp={() => setIsTopUpOpen(true)} />
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
