'use client';

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
import { initialPersonas, proxyImg } from '@/lib/profiles';
import { trackEvent } from '@/lib/telemetry';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Smartphone, X, Zap } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

// SYSTEM: PERSISTENT VIBE PULSES
const GASP_PULSES = [
  "just arrived.",
  "at the penthouse.",
  "looking for something fun.",
  "dm for the vibe.",
  "in medallo.",
  "missed you.",
  "active 💎",
  "drip too hard.",
  "need a vacation.",
  "don't touch the hair.",
  "klk with the vibe.",
  "streets is watching.",
  "feeling elite today.",
  "who else u talkin to?",
  "shadowbanned probably."
];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);

function MarketplaceMain() {
  const [selectedPersonaId, setSelectedPersonaId] = useState(initialPersonas[0].id);
  const [lastActivePersonaId, setLastActivePersonaId] = useState<string>('');
  const [openChatIds, setOpenChatIds] = useState<string[]>([]);
  const [minimizedIds, setMinimizedIds] = useState<string[]>([]);
  const [showFloatingAvatars, setShowFloatingAvatars] = useState(true);
  const [activeFloatingIds, setActiveFloatingIds] = useState<string[]>([]);
  const [guestId, setGuestId] = useState<string>('');
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [dbPersonas, setDbPersonas] = useState<any[]>([]);
  const [showPwaPrompt, setShowPwaPrompt] = useState(false);
  const [followNotify, setFollowNotify] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const allPersonas = [
    ...dbPersonas.map(p => {
        const fallback = (initialPersonas.find(i => i.id === p.id) || {}) as any;
        return {
            ...fallback,
            id: p.id,
            name: p.name,
            city: p.city,
            image: proxyImg((p.seed_image_url && p.seed_image_url !== '') ? p.seed_image_url : (p.image && p.image !== '') ? p.image : fallback.image),
            personality: p.personality,
            systemPrompt: p.system_prompt,
            slang_profile: { base: p.accent_profile || fallback.slang_profile?.base || 'ny_dominican' },
            agency_name: fallback.agency_name || 'Independent',
            status: fallback.status || 'online',
            country: p.country || fallback.country,
            flag: p.flag || fallback.flag,
            vibe: p.vibe || fallback.vibe,
            age: p.age || fallback.age || 22,
            is_active: p.is_active,
            vault: p.vault || fallback.vault || []
        };
    }),
    ...initialPersonas
  ].filter((p, index, self) => 
    index === self.findIndex((t) => t.id === p.id)
  ).filter(p => p.is_active !== false); // ✅ UNIVERSAL RETIREMENT GATE
  
  const refinedPersonas = allPersonas.map(p => ({
    ...p,
    vibe: (p.vibe && typeof p.vibe === 'string' && !p.vibe.includes(',')) ? p.vibe : GASP_PULSES[(Math.floor(Date.now() / 3600000) + (p.id || '').length) % GASP_PULSES.length]
  }));

  const stories = allPersonas.map(p => ({
    id: p.id,
    name: p.name,
    image: p.image || '/v1.png',
    hasStory: true // Force-Active Bypassing Missing Table
  }));

  useEffect(() => {
    const storedGuest = localStorage.getItem('gasp_guest_id');
    if (storedGuest) {
      setGuestId(storedGuest);
    } else {
      const newGuest = `guest-${Math.random().toString(36).substring(2, 11)}`;
      setGuestId(newGuest);
      localStorage.setItem('gasp_guest_id', newGuest);
    }
    
    // 💎 TELEMETRY: The Billion-Dollar Handshake
    trackEvent('app_load');

    // PWA Prompt: Show after 20s if not installed
    const timer = setTimeout(() => {
      const isStandalone = typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches;
      if (!isStandalone) setShowPwaPrompt(true);
    }, 20000);

    // 🧬 NEURAL PULSE: Organic Presence Simulation (Sign-In/Sign-Off Vibe)
    const activeRosterIds = allPersonas.filter(p => p.is_active !== false).map(p => p.id);
    if (activeFloatingIds.length === 0 && activeRosterIds.length > 0) {
       setActiveFloatingIds(activeRosterIds.sort(() => 0.5 - Math.random()).slice(0, 3));
    }

    const interval = setInterval(() => {
       const freshRosterIds = allPersonas.filter(p => p.is_active !== false).map(p => p.id);
       if (freshRosterIds.length === 0) return;

       setActiveFloatingIds(prev => {
          let next = [...prev];
          
          // 🤖 Organically decide the next state: Sign-In, Sign-Off, or Swap
          const action = Math.random();
          
          if (action > 0.7 && next.length < 5) {
             // 🟢 SIGNING IN: A new persona enters the chat
             const avail = freshRosterIds.filter(id => !next.includes(id));
             if (avail.length > 0) next.push(avail[Math.floor(Math.random() * avail.length)]);
          } else if (action < 0.3 && next.length > 2) {
             // 🔴 SIGNING OFFLINE: A persona leaves the session
             next.splice(Math.floor(Math.random() * next.length), 1);
          } else {
             // 🔄 SWAPPING: One model signs off, another signs on instantly
             next.shift();
             const avail = freshRosterIds.filter(id => !next.includes(id));
             if (avail.length > 0) next.push(avail[Math.floor(Math.random() * avail.length)]);
          }
          return next;
       });
    }, 6000 + Math.random() * 8000); // Organic Pulse: Fluctuates every 6-14s

    return () => { clearTimeout(timer); clearInterval(interval); };
  }, [allPersonas.length]); // Re-bind when roster manifests

  // Deep Link: ?persona=valeria&msg=hi
  useEffect(() => {
    const pId = searchParams.get('persona');
    const msg = searchParams.get('msg');
    
    if (pId) {
        const p = refinedPersonas.find(p => p.id.toLowerCase() === pId.toLowerCase());
        if (p && !openChatIds.includes(p.id)) {
            handleSelectPersona(p.id, msg || undefined);
            
            // Organic Reciprocal Follow Delay: 3-5 minutes later
            const organicDelay = Math.floor(Math.random() * 120000) + 180000;
            setTimeout(() => {
               setFollowNotify(p.name);
               setTimeout(() => setFollowNotify(null), 10000); 
            }, organicDelay);
        }
    }
  }, [searchParams, refinedPersonas.length]);

  useEffect(() => {
    if (!guestId) return;
    const fetchUnread = async () => {
        const { data } = await supabase.from('chat_messages').select('persona_id, id, role, created_at, is_read').eq('user_id', guestId);
        if (data) {
            const counts: Record<string, number> = {};
            data.filter(m => m.role === 'assistant' && !m.is_read).forEach(msg => {
                counts[msg.persona_id] = (counts[msg.persona_id] || 0) + 1;
            });
            setUnreadCounts(counts);
        }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [guestId, openChatIds]);

  useEffect(() => {
    async function fetchDb() {
        const { data } = await supabase.from('personas').select('*'); // Fetch ALL to handle retirement overrides
        if (data) setDbPersonas(data);
    }
    fetchDb();
    const refreshInterval = setInterval(fetchDb, 15000); // 15-second Pulse
    return () => clearInterval(refreshInterval);
  }, []);

  const handleSelectPersona = async (id: string, initialMsg?: string) => {
    setSelectedPersonaId(id);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // 💎 NEURAL TELEMETRY: The Conversational Conversion
    trackEvent('chat_open', id, { initialMsg: !!initialMsg });

    if (guestId) {
        await supabase.from('chat_messages').update({ is_read: true }).match({ user_id: guestId, persona_id: id, role: 'assistant', is_read: false });
    }
    
    // Add to favorites automatically if deep-linked or followed
    const favs = JSON.parse(localStorage.getItem('gasp_favorites') || '[]');
    if (!favs.includes(id)) {
        favs.push(id);
        localStorage.setItem('gasp_favorites', JSON.stringify(favs));
        window.dispatchEvent(new Event('storage'));
    }

    if (lastActivePersonaId && lastActivePersonaId !== id && guestId) {
        setLastActivePersonaId(id); // Simple rotation
    }
    setLastActivePersonaId(id);

    setOpenChatIds(prev => {
      if (isMobile) return [id];
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
    setMinimizedIds(prev => prev.filter(m => m !== id));

    if (initialMsg && guestId) {
      setTimeout(async () => {
        await supabase.from('chat_messages').insert([{ user_id: guestId, persona_id: id, role: 'assistant', content: initialMsg }]);
      }, 500);
    }
  };

  const handleCloseChat = (id: string) => {
    setOpenChatIds(prev => prev.filter(oid => oid !== id));
    setMinimizedIds(prev => prev.filter(mid => mid !== id));
  };

  const handleMinimizeChat = (id: string) => setMinimizedIds(prev => [...prev, id]);
  const handleRestoreChat = (id: string) => setMinimizedIds(prev => prev.filter(mid => mid !== id));
  
  const isChatOpenMobile = openChatIds.filter(id => !minimizedIds.includes(id)).length > 0;

  const [showRightSidebar, setShowRightSidebar] = useState(false); // Hidden by default on mobile

  const [isZenMode, setIsZenMode] = useState(false);

  return (
    <div className="flex h-screen bg-black overflow-hidden font-inter selection:bg-[#ff00ff] selection:text-black" 
         onDoubleClick={() => setIsZenMode(!isZenMode)}
    >
      <AnimatePresence>
         {!isZenMode && (
           <motion.div 
            initial={{ y: -100 }} 
            animate={{ y: 0 }} 
            exit={{ y: -100 }} 
            className={`absolute inset-x-0 top-0 z-[1000] ${isChatOpenMobile ? 'hidden md:block' : 'block'}`}
           >
            <Header />
           </motion.div>
         )}
      </AnimatePresence>
      
      {!isZenMode && <Sidebar selectedPersonaId={selectedPersonaId} onSelectPersona={handleSelectPersona} unreadCounts={unreadCounts} personas={refinedPersonas} />}
      
      <main className="flex-1 flex flex-col relative overflow-hidden">
          <AnimatePresence>
             {(!isZenMode && !isChatOpenMobile) && (
                <motion.div 
                  initial={{ opacity: 0, y: -50 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -50 }} 
                  className="absolute top-28 md:top-36 left-0 right-0 z-[200] bg-gradient-to-b from-black via-black/95 to-transparent pb-2 border-b border-white/5 flex items-center pr-4"
                >
                  <StoriesRow personas={refinedPersonas} onSelectPersona={handleSelectPersona} />
                  <button onClick={() => setShowRightSidebar(!showRightSidebar)} className="flex lg:hidden w-10 h-10 rounded-xl bg-white/5 border border-white/10 items-center justify-center text-white/40 hover:text-[#00f0ff] transition-all shrink-0">
                     {showRightSidebar ? <X size={20} /> : <Zap size={20} />}
                  </button>
                </motion.div>
             )}
          </AnimatePresence>
          <div className={`${isZenMode ? 'pt-0' : 'pt-44'} flex-1 h-screen overflow-hidden transition-all duration-500`}>
            <GlobalFeed onSelectPersona={handleSelectPersona} />
          </div>
      </main>

      <div className={`${showRightSidebar ? 'fixed inset-0 z-[500] bg-black/80 backdrop-blur-xl md:static md:bg-transparent' : 'hidden lg:flex'}`}>
         {showRightSidebar && (
            <button onClick={() => setShowRightSidebar(false)} className="absolute top-6 right-6 lg:hidden z-[600] text-white/40"><X size={24} /></button>
         )}
         <RightSidebar onSelectPersona={handleSelectPersona} personas={refinedPersonas} />
      </div>

      {/* RECIPROCAL FOLLOW TOAST (Elite Hook) */}
      <AnimatePresence>
        {followNotify && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
             className="fixed top-20 left-1/2 -translate-x-1/2 z-[2000] w-[90vw] max-w-sm bg-gradient-to-r from-black via-[#00f0ff]/20 to-black border border-[#00f0ff]/40 p-1 px-4 rounded-full flex items-center justify-between shadow-[0_0_50px_rgba(0,240,255,0.2)]"
          >
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse" />
                <p className="text-[9px] font-black uppercase text-white tracking-[0.2em]">
                   Reciprocal Connect: <span className="text-[#00f0ff]">{followNotify}</span> confirmed follow back
                </p>
             </div>
             <Zap size={10} className="text-[#00f0ff] animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
         {showPwaPrompt && (
           <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
             className="fixed bottom-24 md:bottom-12 right-4 left-4 md:left-auto md:w-80 bg-[#00f0ff] p-5 rounded-[2rem] z-[1000] shadow-[0_20px_60px_rgba(0,240,255,0.4)] flex flex-col gap-4 cursor-pointer"
             onClick={() => setShowPwaPrompt(false)}
           >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shrink-0">
                   <Smartphone size={24} className="text-[#00f0ff]" />
                </div>
                <div>
                   <h4 className="text-black font-syncopate font-black uppercase text-[10px]">Install Gasp.fun</h4>
                   <p className="text-black/60 text-[9px] font-black uppercase tracking-wider leading-tight">Add to Home Screen for priority access</p>
                </div>
                <button className="ml-auto text-black/20 hover:text-black" onClick={(e) => { e.stopPropagation(); setShowPwaPrompt(false); }}><X size={16}/></button>
              </div>
           </motion.div>
         )}
      </AnimatePresence>

      <div className={`fixed top-1/2 -translate-y-1/2 z-[600] flex flex-col gap-3 transition-all duration-500 ${isChatOpenMobile ? 'right-2' : 'left-2'}`}>
         {showFloatingAvatars && refinedPersonas.filter(p => activeFloatingIds.includes(p.id)).map(p => (
              <motion.div key={p.id} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: isChatOpenMobile ? 0.85 : 1 }} onClick={() => handleSelectPersona(p.id)} 
                className="w-10 h-10 rounded-2xl border border-white/20 overflow-hidden relative shadow-2xl bg-black/50 backdrop-blur-md cursor-pointer"
              >
                 <PersonaAvatar src={p.image} alt="" />
                 <div className="absolute top-0.5 right-0.5 w-2 h-2 bg-[#00ff41] rounded-full animate-ping" />
              </motion.div>
         ))}
         <button onClick={() => setShowFloatingAvatars(!showFloatingAvatars)} className="w-8 h-8 mx-auto rounded-full bg-black/80 border border-white/10 flex items-center justify-center text-white/50">{showFloatingAvatars ? <EyeOff size={14} /> : <Eye size={14} />}</button>
      </div>

      <div className={`fixed inset-y-0 right-0 ${isChatOpenMobile ? 'z-[1200]' : 'z-[500]'} flex flex-row-reverse pointer-events-none items-end pr-2 md:pr-0`}>
        <AnimatePresence mode="popLayout">
           {[...openChatIds].reverse().map((id, index) => {
              const isMinimized = minimizedIds.includes(id);
              const p = refinedPersonas.find(p => p.id === id) || initialPersonas.find(p => p.id === id);
              if (!p) return null;
              return (
                <motion.div key={id} initial={{ x: '100%' }} animate={{ x: isMinimized ? '100%' : `-${index * 12}px`, opacity: isMinimized ? 0 : 1 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30 }}
                  className="h-full pointer-events-auto bg-black shadow-[-20px_0_60px_rgba(0,0,0,0.8)]"
                >
                  <ChatDrawer personaId={id} persona={p} onClose={() => handleCloseChat(id)} onMinimize={() => handleMinimizeChat(id)} />
                </motion.div>
              );
           })}
        </AnimatePresence>
      </div>

      {!isZenMode && <GhostActivityTicker />}
      {!isZenMode && <ChatDock minimizedIds={minimizedIds} onRestore={handleRestoreChat} unreadCounts={unreadCounts} personas={refinedPersonas} />}
      {(!isZenMode && !(openChatIds.length > 0 && minimizedIds.length < openChatIds.length)) && (
        <MobileBottomNav unreadCounts={unreadCounts} onSelectChat={() => handleSelectPersona(selectedPersonaId)} />
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



