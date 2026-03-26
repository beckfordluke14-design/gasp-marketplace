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
import { trackEvent } from '@/lib/telemetry';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, X, Zap } from 'lucide-react';
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

function MarketplaceMain() {
  const [mounted, setMounted] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState(initialPersonas[0]?.id ?? '');
  const [openChatIds, setOpenChatIds] = useState<string[]>([]);
  const [minimizedIds, setMinimizedIds] = useState<string[]>([]);
  const [showFloatingAvatars, setShowFloatingAvatars] = useState(true);
  const [activeFloatingIds, setActiveFloatingIds] = useState<string[]>([]);
  const [guestId, setGuestId] = useState<string>('');
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [dbPersonas, setDbPersonas] = useState<any[]>([]);
  const [followNotify, setFollowNotify] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => { setMounted(true); }, []);

  const allPersonas = [
    ...(dbPersonas || []).map(p => {
        const fallback = (initialPersonas.find(i => i.id === p.id) || {}) as any;
        return {
            ...fallback,
            id: p.id,
            name: p.name,
            city: p.city,
            image: proxyImg((p.seed_image_url && p.seed_image_url !== '') ? p.seed_image_url : (p.image && p.image !== '') ? p.image : fallback.image),
            is_active: p.is_active,
        };
    }),
    ...initialPersonas
  ].filter((p, index, self) => index === self.findIndex((t) => t.id === p.id))
   .filter(p => p.is_active !== false)
   .filter(p => p.image && p.image.startsWith('http'));

  const refinedPersonas = allPersonas.map(p => ({
    ...p,
    vibe: GASP_PULSES[(Math.floor(Date.now() / 3600000) + (p.id || '').length) % GASP_PULSES.length]
  }));

  useEffect(() => {
    const storedGuest = localStorage.getItem('gasp_guest_id');
    if (storedGuest) setGuestId(storedGuest);
    else {
      const newGuest = `guest-${Math.random().toString(36).substring(2, 11)}`;
      setGuestId(newGuest);
      localStorage.setItem('gasp_guest_id', newGuest);
    }
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

  const isChatOpenMobile = openChatIds.filter(id => !minimizedIds.includes(id)).length > 0;
  const [isZenMode, setIsZenMode] = useState(false);

  if (!mounted) return (<div className="min-h-screen bg-black flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#ffea00]/20 border-t-[#ffea00] rounded-full animate-spin" /></div>);

  return (
    <div className="flex h-screen bg-black overflow-hidden font-inter" 
         onDoubleClick={() => setIsZenMode(!isZenMode)}
    >
      <AnimatePresence>
         {!isZenMode && (
           <motion.div initial={{ y: -100 }} animate={{ y: 0 }} exit={{ y: -100 }} 
                className={`absolute inset-x-0 top-0 z-[1000] ${isChatOpenMobile ? 'hidden md:block' : 'block'}`}
           >
            <Header onOpenTopUp={() => setIsTopUpOpen(true)} />
           </motion.div>
         )}
      </AnimatePresence>
      
      {!isZenMode && <Sidebar selectedPersonaId={selectedPersonaId} onSelectPersona={handleSelectPersona} unreadCounts={unreadCounts} personas={refinedPersonas} />}
      
      <main className="flex-1 flex flex-col relative overflow-hidden">
          {!isZenMode && <div className="h-28 md:h-36 shrink-0" />}
          <div className="flex-1 overflow-hidden">
            <GlobalFeed onSelectPersona={handleSelectPersona} />
          </div>
      </main>

      <div className={`fixed inset-y-0 right-0 ${isChatOpenMobile ? 'z-[1200]' : 'z-[500]'} flex flex-row-reverse pointer-events-none items-end`}>
        <AnimatePresence mode="popLayout">
           {[...openChatIds].reverse().map((id, index) => {
              const isMinimized = minimizedIds.includes(id);
              const p = refinedPersonas.find(p => p.id === id);
              if (!p || isMinimized) return null;
              return (
                <motion.div key={id} initial={{ x: '100%' }} animate={{ x: `-${index * 12}px`, opacity: 1 }} exit={{ x: '100%' }} 
                   className="h-full pointer-events-auto bg-black shadow-[-20px_0_60px_rgba(0,0,0,0.8)]"
                >
                  <ChatDrawer personaId={id} persona={p} onClose={() => handleCloseChat(id)} onMinimize={() => setMinimizedIds([...minimizedIds, id])} />
                </motion.div>
              );
           })}
        </AnimatePresence>
      </div>

      {!isZenMode && !isChatOpenMobile && (
        <MobileBottomNav 
          unreadCounts={unreadCounts} 
          onSelectChat={() => handleSelectPersona(selectedPersonaId)} 
          onOpenTopUp={() => setIsTopUpOpen(true)}
        />
      )}

      {isTopUpOpen && (
        <TopUpDrawer userId={guestId} onClose={() => setIsTopUpOpen(false)} />
      )}
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
