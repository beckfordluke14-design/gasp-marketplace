'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, MessageSquare, Loader2 } from 'lucide-react';
import GlobalFeed from '@/components/GlobalFeed';
import WeatherFeed from '@/components/WeatherFeed';
import NewsFeed from '@/components/NewsFeed';
import RightSidebar from '@/components/RightSidebar';
import StoriesRow from '@/components/StoriesRow';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ProtocolOverview from '@/components/ProtocolOverview';
import ErrorBoundary from '@/components/ErrorBoundary';
import { initialProfiles, proxyImg } from '@/lib/profiles';
import { trackEvent } from '@/lib/telemetry';
import TopUpDrawer from '@/components/economy/TopUpDrawer';
import ChatDrawer from '@/components/ChatDrawer';
import { useUser } from '@/components/providers/UserProvider';
import NeuralPulseTerminal from '@/components/NeuralPulseTerminal';
import FloatingChatTerminal from '@/components/FloatingChatTerminal';
import VaultMainGrid from '@/components/VaultMainGrid';
import { Star } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'feed' | 'weather' | 'reports' | 'protocol' | 'vault'>('feed');
  const [following, setFollowing] = useState<string[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [showPaymentPending, setShowPaymentPending] = useState(false);
  
  const handleSetSidebarView = (view: 'chats' | 'vault' | 'feed') => {
     if (view === 'feed') {
        setShowProfileList(false);
     } else {
        setSidebarView(view);
     }
  };
  
  const searchParams = useSearchParams();



  useEffect(() => {
    // 🛡️ SMART-TRAFFIC GATEKEEPER: New users land in the funnel, Whales land in the app.
    if (typeof window !== 'undefined') {
       const hasVisited = localStorage.getItem('gasp_guest_id');
       const isReturning = localStorage.getItem('gasp_balance_refresh') || hasVisited;
       
       if (!isReturning) {
         console.log('🧬 [Gatekeeper] New User detected. Redirecting to High-Velocity Funnel...');
         window.location.href = '/funnel';
         return;
       }
    }
  }, []);

  useEffect(() => { 
    setMounted(true); 
    const loadProfiles = async () => {
        try {
          const [resFeed, resActive] = await Promise.all([
             fetch(`/api/admin/feed?limit=200&t=${Date.now()}`),
             fetch(`/api/personas?t=${Date.now()}`),
             // ── 🛰️ SHADOW pulse: Silently trigger intelligence sync
             fetch(`/api/news/curate?key=gasp_sovereign_intelligence`).catch(() => null)
          ]);
          
          const jsonFeed = await resFeed.json();
          const jsonActive = await resActive.json();
          
          const mergedSet = new Map();
          
          // 🛡️ STEP 1: Add all Active Personas from the Database
          if (jsonActive.success && jsonActive.personas) {
             jsonActive.personas.forEach((p: any) => {
                const sId = String(p.id);
                mergedSet.set(sId, {
                   ...p,
                   id: sId,
                   image: proxyImg(p.seed_image_url || p.image)
                });
             });
          }

          // 🛡️ STEP 2: Hydrate with data from the Feed (Catch any missing nodes)
          if (jsonFeed.success && jsonFeed.posts) {
             jsonFeed.posts.forEach((p: any) => {
                if (p.personas) {
                   const sId = String(p.persona_id);
                   if (!mergedSet.has(sId)) {
                      mergedSet.set(sId, {
                         ...p.personas,
                         id: sId,
                         image: proxyImg(p.personas.seed_image_url || p.personas.image)
                      });
                   }
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
       setUnreadCounts(stored);
       const unreadTotal = Object.values(stored).reduce((a: any, b: any) => a + Number(b), 0);
       window.dispatchEvent(new CustomEvent('gasp_unread_sync', { detail: unreadTotal }));
    };
    syncUnreads();

    const syncFollows = async () => {
        let gid = localStorage.getItem('gasp_guest_id');
        if (!gid) return;
        try {
            const res = await fetch('/api/rpc/db', {
                method: 'POST',
                body: JSON.stringify({ action: 'sync-follows', payload: { userId: gid } })
            });
            const json = await res.json();
            if (json.success) setFollowing(json.following || []);
        } catch (e) {}
    };
    syncFollows();

    const handleSyncPulse = (e: any) => {
      const detail = e.detail;
      console.log('📡 [Signal Pulse] Sync Follows:', detail);
      if (detail && detail.personaId) {
        setFollowing(prev => {
          const isF = detail.isFollowing;
          console.log(`🧬 [Sync] Updating persona ${detail.personaId} state to: ${isF}`);
          if (isF) {
            return prev.includes(detail.personaId) ? prev : [...prev, detail.personaId];
          } else {
            return prev.filter(id => id !== detail.personaId);
          }
        });
      } else {
        syncFollows(); 
      }
    };

    window.addEventListener('gasp_unread_sync_trigger', syncUnreads);
    window.addEventListener('gasp_sync_follows', handleSyncPulse as EventListener);

    let gId = localStorage.getItem('gasp_guest_id');
    if (!gId) {
       gId = `guest-${Math.random().toString(36).substring(2, 11)}`;
       localStorage.setItem('gasp_guest_id', gId);
    }
    setGuestId(gId);
    
    // 🏦 BANK TRANSFER PENDING DETECTION
    if (searchParams.get('payment_pending') === 'true') {
      setShowPaymentPending(true);
      // Clean the URL so it doesn't show on refresh
      window.history.replaceState({}, '', '/');
    }

    return () => {
       window.removeEventListener('gasp_unread_sync_trigger', syncUnreads);
       window.removeEventListener('gasp_sync_follows', handleSyncPulse as EventListener);
    };
  }, [searchParams, mounted]);

  const refinedProfiles = useMemo(() => {
    // 🛡️ SOVEREIGN REGISTRY: Only personas approved in Admin (is_active !== false) are permitted.
    if (!dbProfiles || dbProfiles.length === 0) return [];

    return dbProfiles
      .filter(p => p.is_active !== false)
      .map(dbP => {
        const staticP = initialProfiles.find(s => String(s.id) === String(dbP.id));
        return { 
          ...staticP, 
          ...dbP,
          id: String(dbP.id),
          image: proxyImg(dbP.seed_image_url || dbP.image || staticP?.image)
        };
      });
  }, [dbProfiles]);

  const handleSelectProfile = async (id: string, initialMsg?: string, profileObj?: any) => {
    const sId = String(id);
    setSelectedProfileId(sId);
    
    // 🧠 INTELLIGENT HYDRATION: Ensure profile data exists before opening
    let targetProfile = profileObj || 
                        initialProfiles.find(p => String(p.id) === sId) || 
                        dbProfiles.find(p => String(p.id) === sId) ||
                        chatProfileCache[sId];

    if (!targetProfile) {
       console.log(`🧬 [Sync] Proactive Hydration triggered for: ${sId}`);
       try {
          const res = await fetch(`/api/admin/persona/${sId}`);
          const data = await res.json();
          if (data && data.id) {
             targetProfile = {
                ...data,
                id: String(data.id),
                image: proxyImg(data.seed_image_url || data.image)
             };
             setChatProfileCache(prev => ({ ...prev, [sId]: targetProfile }));
          }
       } catch (err) {
          console.error('[Sync] Hydration failed:', err);
       }
    } else if (profileObj) {
      setChatProfileCache(prev => ({ ...prev, [sId]: profileObj }));
    }

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    setOpenChatIds(prev => (isMobile ? [sId] : prev.includes(sId) ? prev : [...prev, sId]));
    setMinimizedIds(prev => prev.filter(m => m !== sId));
    trackEvent('chat_open', sId, { from: 'grid', hasInitialMsg: !!initialMsg });
  };

  // 🛰️ MASTER DISPATCH: High-priority URL Hijack for Persona Engagement
  useEffect(() => {
    if (!mounted) return;
    const profileId = searchParams.get('profile');
    if (!profileId) return;

    const dispatchChat = async () => {
        console.log(`🧬 [Master Dispatch] Targeting: ${profileId}`);
        
        // 1. Proactive cleanup: Clear param to prevent loop before logic runs
        const url = new URL(window.location.href);
        url.searchParams.delete('profile');
        window.history.replaceState({}, '', url.pathname + url.search);

        // 2. Immediate Force Open: Call with ID (handles sync internally)
        handleSelectProfile(profileId);
        setSidebarView('chats');
    };

    dispatchChat();
  }, [searchParams, mounted, handleSelectProfile]);

  useEffect(() => {
     if (typeof window !== 'undefined') {
        (window as any).onSelectProfile = handleSelectProfile;
        (window as any).onSetActiveTab = setActiveTab;
        (window as any).openTopUp = () => setIsTopUpOpen(true);
     }
  }, [handleSelectProfile]);

  const handleCloseChat = (id: string) => {
    setOpenChatIds(prev => prev.filter(cid => cid !== id));
    setMinimizedIds(prev => prev.filter(mid => mid !== id));
  };

  const { profile } = useUser();
  const idToUse = profile?.id || guestId || '';

  const [randomSeed] = useState(() => Math.random());
  
  const sortedProfiles = useMemo(() => {
    // 🧬 LATEST-FIRST SYNC: Sorting by creation date for high-velocity drops
    return [...refinedProfiles].sort((a, b) => {
       const dateA = new Date(a.created_at || 0).getTime();
       const dateB = new Date(b.created_at || 0).getTime();
       return dateB - dateA;
    });
  }, [refinedProfiles]);

  const [isSpanish, setIsSpanish] = useState(false);

  useEffect(() => {
    setIsSpanish(localStorage.getItem('gasp_locale') === 'es');
  }, []);

   return (
    <main className="min-h-screen bg-transparent text-white relative flex flex-col lg:flex-row xl:gap-0">

      {/* 🏦 BANK TRANSFER PENDING BANNER */}
      <AnimatePresence>
        {showPaymentPending && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-0 inset-x-0 z-[99999] flex items-center justify-between gap-4 px-6 py-4 bg-[#0a0a0a] border-b border-[#00f0ff]/30 shadow-[0_4px_60px_rgba(0,240,255,0.15)]"
          >
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse shadow-[0_0_10px_#00f0ff]" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-black uppercase tracking-widest text-white font-syncopate italic">Bank Transfer Processing</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Your credits will arrive automatically in 3–5 business days. No action required.</span>
              </div>
            </div>
            <button onClick={() => setShowPaymentPending(false)} className="text-white/20 hover:text-white transition-colors text-xs font-black uppercase tracking-widest">Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>
       <div className="hidden lg:flex h-screen sticky top-0 shrink-0 z-[40]">
           <Sidebar isMobileUI={false} 
              onSelectProfile={handleSelectProfile} 
              selectedProfileId={selectedProfileId} 
              profiles={sortedProfiles} 
              view={sidebarView}
              onSetView={handleSetSidebarView}
              onOpenTopUp={() => setIsTopUpOpen(true)}
           />
       </div>
       
       <div className="flex-1 flex flex-col relative h-full">
            <Header 
               onOpenTopUp={() => setIsTopUpOpen(true)} 
               deadIds={deadIds} 
               setDeadIds={setDeadIds} 
               onOpenMenu={() => setShowProfileList(true)} 
               profiles={sortedProfiles} 
               onSelectProfile={handleSelectProfile} 
            />
           
           <div className="flex-1 flex flex-col relative bg-transparent pt-[110px] md:pt-24">
              {/* 🛰️ SOVEREIGN NAVIGATION: GHOST GLASS PILL */}
              <div className="sticky top-[86px] md:top-20 z-[100] flex justify-center w-full px-4 pointer-events-none mb-[-3.5rem]">
                  <div className="flex items-center gap-1 md:gap-3 p-1.5 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto transition-all duration-500 w-fit max-w-full overflow-x-auto no-scrollbar">
                      <button 
                         onClick={() => setActiveTab('feed')} 
                         className={`px-4 md:px-6 py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 relative whitespace-nowrap ${activeTab === 'feed' ? 'bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/10' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}
                      >
                         <span className="relative z-10">{isSpanish ? 'Feed Global' : 'Global Feed'}</span>
                         {activeTab === 'feed' && (
                            <motion.div 
                               layoutId="tab-glow" 
                               className="absolute inset-0 rounded-full bg-white/5 shadow-[inset_0_0_15px_rgba(255,255,255,0.1)]" 
                            />
                         )}
                      </button>
                      
                      <button 
                         onClick={() => setActiveTab('reports')} 
                         className={`px-4 md:px-6 py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 relative whitespace-nowrap ${activeTab === 'reports' ? 'bg-[#ff00ff]/10 text-[#ff00ff] shadow-[0_0_20px_rgba(255,0,255,0.1)] border border-[#ff00ff]/20' : 'text-white/30 hover:text-[#ff00ff]/60 hover:bg-[#ff00ff]/5'}`}
                      >
                         <span className="relative z-10">{isSpanish ? 'Noticias' : 'News'}</span>
                         {activeTab === 'reports' && (
                            <motion.div 
                               layoutId="tab-glow" 
                               className="absolute inset-0 rounded-full bg-[#ff00ff]/5 shadow-[inset_0_0_15px_rgba(255,0,255,0.1)]" 
                            />
                         )}
                      </button>

                      <button 
                         onClick={() => setActiveTab('weather')} 
                         className={`px-4 md:px-6 py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 relative whitespace-nowrap ${activeTab === 'weather' ? 'bg-[#00f0ff]/10 text-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.15)] border border-[#00f0ff]/20' : 'text-white/30 hover:text-[#00f0ff]/60 hover:bg-[#00f0ff]/5'}`}
                      >
                         <span className="relative z-10">{isSpanish ? 'Clima X' : 'Weather X'}</span>
                         {activeTab === 'weather' && (
                            <motion.div 
                               layoutId="tab-glow" 
                               className="absolute inset-0 rounded-full bg-[#00f0ff]/5 shadow-[inset_0_0_15px_rgba(0,240,255,0.1)]" 
                            />
                         )}
                      </button>

                      <button 
                         onClick={() => setActiveTab('protocol')} 
                         className={`px-4 md:px-6 py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 relative whitespace-nowrap ${activeTab === 'protocol' ? 'bg-[#ffea00]/10 text-[#ffea00] shadow-[0_0_20px_rgba(255,234,0,0.15)] border border-[#ffea00]/20' : 'text-white/30 hover:text-[#ffea00]/60 hover:bg-[#ffea00]/5'}`}
                      >
                         <span className="relative z-10">{isSpanish ? 'Protocolo' : 'Protocol'}</span>
                         {activeTab === 'protocol' && (
                            <motion.div 
                               layoutId="tab-glow" 
                               className="absolute inset-0 rounded-full bg-[#ffea00]/5 shadow-[inset_0_0_15px_rgba(255,234,0,0.1)]" 
                            />
                         )}
                      </button>

                      <button 
                         onClick={() => setActiveTab('vault')} 
                         className={`px-4 md:px-6 py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 relative whitespace-nowrap ${activeTab === 'vault' ? 'bg-[#ff00ff]/10 text-[#ff00ff] shadow-[0_0_20px_rgba(255,0,255,0.1)] border border-[#ff00ff]/20' : 'text-white/30 hover:text-[#ff00ff]/60 hover:bg-[#ff00ff]/5'}`}
                      >
                         <span className="relative z-10 flex items-center gap-1">
                            {isSpanish ? 'Bóveda' : 'Vault'}
                         </span>
                         {activeTab === 'vault' && (
                            <motion.div 
                               layoutId="tab-glow" 
                               className="absolute inset-0 rounded-full bg-[#ff00ff]/5 shadow-[inset_0_0_15px_rgba(255,0,255,0.1)]" 
                            />
                         )}
                      </button>
                  </div>
              </div>

              {/* STORY TOGGLE PORTAL */}
              <div className="absolute right-6 top-4 z-50 flex items-center gap-3">
                 <button 
                   onClick={() => setShowStories(!showStories)}
                   className={`w-10 h-10 rounded-xl bg-white/5 backdrop-blur-3xl border border-white/10 flex items-center justify-center text-white/20 hover:text-[#ffea00] transition-all ${!showStories ? 'bg-[#ffea00]/10 text-[#ffea00]' : ''}`}
                 >
                    <Zap size={16} className={!showStories ? 'animate-pulse' : ''} />
                 </button>
              </div>

              <div className="flex-1 relative">
                 <div className="">
                    {activeTab === 'feed' && (
                      <div className="w-full flex-1 flex flex-col animate-in fade-in zoom-in-95 duration-500">
                         <GlobalFeed 
                            onSelectProfile={handleSelectProfile} 
                            profiles={sortedProfiles}
                            deadIds={deadIds}
                            setDeadIds={setDeadIds}
                            followingIds={following}
                         />
                      </div>
                    )}
                    {activeTab === 'weather' && (
                     <div className="w-full max-w-4xl mx-auto px-4 md:px-6 animate-in fade-in zoom-in-95 duration-500">
                        <WeatherFeed onOpenTopUp={() => setIsTopUpOpen(true)} />
                     </div>
                    )}
                    {activeTab === 'reports' && (
                        <div className="animate-in fade-in zoom-in-95 duration-500">
                           <NewsFeed onSelectProfile={handleSelectProfile} />
                        </div>
                    )}
                    {activeTab === 'protocol' && (
                        <div className="animate-in fade-in zoom-in-95 duration-500">
                           <ProtocolOverview />
                        </div>
                    )}
                    {activeTab === 'vault' && (
                        <div className="animate-in fade-in zoom-in-95 duration-500 pb-20 px-6 py-10">
                           <div className="space-y-6">
                              <div className="space-y-2 border-b border-white/5 pb-6">
                                 <span className="text-[9px] font-black uppercase text-[#ff00ff] tracking-[0.4em]">{isSpanish ? 'Nodo de Acceso a Bóveda' : 'Vault Access Node'}</span>
                                 <div className="flex items-center justify-between">
                                    <h2 className="text-3xl font-syncopate font-black italic uppercase text-white">{isSpanish ? 'Archivos' : 'Archives'}</h2>
                                    <div className="text-right">
                                       <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">{isSpanish ? 'SALDO' : 'BALANCE'}</span>
                                       <p className="text-[#00f0ff] font-black text-xs font-syncopate">{profile?.credit_balance?.toLocaleString() || '0'} CR</p>
                                    </div>
                                 </div>
                              </div>
                              
                              <VaultMainGrid />
                           </div>
                        </div>
                    )}
                 </div>
              </div>
            </div>
          </div>

        {/* 3rd Column Discovery Center */}
        <RightSidebar 
          onSelectProfile={handleSelectProfile} 
          profiles={sortedProfiles} 
          deadIds={deadIds} 
          setDeadIds={setDeadIds} 
        />

       <div className="fixed inset-0 pointer-events-none z-[1000] flex items-end justify-end p-6 gap-4">
          <AnimatePresence>
            {openChatIds.filter(id => !minimizedIds.includes(id)).map((sId, index) => {
              const p = initialProfiles.find((profileItem: any) => String(profileItem.id) === sId) || dbProfiles.find((profileItem: any) => String(profileItem.id) === sId) || chatProfileCache[sId];
              
              if (!p) return (
                <motion.div 
                    key={sId} 
                    initial={{ x: '100%', opacity: 0 }} 
                    animate={{ x: 0, opacity: 1 }} 
                    exit={{ x: '100%', opacity: 0 }} 
                    className="h-full pointer-events-auto bg-black border-l border-white/5 shadow-2xl w-full max-w-md"
                >
                    <div className="flex flex-col items-center justify-center h-full p-10 text-center gap-8">
                       <div className="relative">
                          <Zap className="text-[#ffea00] animate-pulse relative z-10" size={48} />
                          <div className="absolute inset-0 bg-[#ffea00]/20 blur-2xl animate-pulse" />
                       </div>
                       <div className="space-y-2">
                          <p className="text-[12px] font-syncopate font-black uppercase tracking-[0.3em] text-white">Synchronizing...</p>
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/20 italic">Establishing Sovereign Uplink</p>
                       </div>
                       <Loader2 className="text-white/10 animate-spin" size={20} />
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
                         followingIds={following}
                         profiles={sortedProfiles}
                         unreadCounts={unreadCounts}
                         onSelectProfile={handleSelectProfile}
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
                 {/* 🚀 MAIN OPERATIONS CENTER */}
                 <div className="pt-36 lg:pt-32 pb-32">
                    <button onClick={() => setShowProfileList(false)} className="mb-4 text-[#00f0ff] uppercase text-[10px] font-black">
                       {isSpanish ? '← Cerrar Acceso' : '← Close Access'}
                    </button>
                    <Sidebar 
                       onSelectProfile={(id) => { handleSelectProfile(id); setShowProfileList(false); }} 
                       selectedProfileId={selectedProfileId} 
                       profiles={sortedProfiles} 
                       view={sidebarView}
                       onSetView={handleSetSidebarView}
                       isMobileUI={true}
                    />
                 </div>
              </motion.div>
           )}
        </AnimatePresence>

         {/* 🧬 INTELLIGENT CHAT TERMINAL: Standalone glassy orbiter for Favorites & Unreads */}
         <FloatingChatTerminal 
            onSelectChat={() => setShowProfileList(true)} 
            onSelectProfile={handleSelectProfile}
            followingIds={following}
            profiles={sortedProfiles}
            unreadCounts={unreadCounts}
            isOpen={openChatIds.length > 0}
            onClose={() => setOpenChatIds([])}
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
