'use client';

import { motion } from 'framer-motion';
import { initialProfiles, proxyImg, getProfileName } from '@/lib/profiles';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  PlusCircle,
  MessageSquare,
  Home,
  User,
  Settings,
  Coins,
  Zap,
  Trophy,
  ShieldCheck,
  ArrowRight,
  LogOut,
  Heart,
  Sparkles,
  Star,
  Flame,
  Share,
  Copy,
  Shield
} from 'lucide-react';
import { useUser } from '@/components/providers/UserProvider';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import Link from 'next/link';
import GlitchText from './ui/GlitchText';

import NeuralPulseTerminal from './NeuralPulseTerminal';
import MarketPulseTerminal from './intel/MarketPulseTerminal';

// 🛡️ SYSTEM SYNC: Using DB Service for reliable updates.

interface SidebarProps {
  selectedProfileId: string;
  onSelectProfile: (id: string) => void;
  unreadCounts?: Record<string, number>;
  profiles: any[];
  view?: 'chats' | 'vault' | 'feed';
  onSetView?: (view: 'chats' | 'vault' | 'feed') => void;
  onOpenTopUp?: () => void;
}

export default function Sidebar({ selectedProfileId, onSelectProfile, unreadCounts = {}, profiles, view = 'chats', onSetView, onOpenTopUp }: SidebarProps) {
  const { profile } = useUser();
  const [following, setFollowing] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  
  // 🌍 GLOBAL LOCALE STATE
  const isSpanish = typeof window !== 'undefined' && localStorage.getItem('gasp_locale') === 'es';

  // 1. NAV HUB FOR SIDEBAR
  const NavButton = ({ label, icon: Icon, targetView }: { label: string, icon: any, targetView: 'chats' | 'vault' | 'feed' }) => (
    <button 
        onClick={() => onSetView?.(targetView)}
        className={`flex-1 py-3 flex flex-col items-center gap-1 transition-all border-b-2 ${view === targetView ? 'border-[#ff00ff] text-white shadow-[0_10px_10px_-10px_#ff00ff]' : 'border-transparent text-white/30'}`}
    >
        <Icon size={18} className={view === targetView ? 'drop-shadow-[0_0_8px_#ff00ff]' : ''} />
        <span className="text-[7px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );

  useEffect(() => {
    const storedRecent = localStorage.getItem('gasp_recent_chats');
    if (storedRecent) {
       try { setRecentIds(JSON.parse(storedRecent).slice(0, 5)); } catch {}
    }
  }, []);

  const syncFollows = async () => {
    const gid = profile?.id || localStorage.getItem('gasp_guest_id');
    if (!gid) return;

    try {
        const res = await fetch('/api/rpc/db', {
            method: 'POST',
            body: JSON.stringify({ action: 'sync-follows', payload: { userId: gid } })
        });
        const json = await res.json();
        if (json.success) setFollowing(json.following || []);
    } catch (e) {
        console.error('[Sidebar] Sync Failure:', e);
    }
  };

  useEffect(() => {
    syncFollows();
    
    // 🛰️ SIGNAL PULSE: Handle live updates from any Favorite button in the system
    const handleSyncPulse = (e: any) => {
      const detail = e.detail;
      if (detail && detail.personaId) {
        setFollowing(prev => {
          if (detail.isFollowing) {
            return prev.includes(detail.personaId) ? prev : [...prev, detail.personaId];
          } else {
            return prev.filter(id => id !== detail.personaId);
          }
        });
      } else {
        syncFollows(); // Full sync fallback
      }
    };

    window.addEventListener('gasp_sync_follows', handleSyncPulse as EventListener);
    window.addEventListener('storage', syncFollows);
    return () => {
       window.removeEventListener('gasp_sync_follows', handleSyncPulse as EventListener);
       window.removeEventListener('storage', syncFollows);
    };
  }, [profile]);

  const [shuffledOthers, setShuffledOthers] = useState<any[]>([]);
  const [pointsStats, setPointsStats] = useState({ balance: 0, totalSpent: 0 });

  // 🛰️ SYNDICATE POINTS SYNC: Fetch matching rewards in real-time
  const fetchPoints = async () => {
    const gid = profile?.id || localStorage.getItem('gasp_guest_id');
    if (!gid) return;
    try {
      const res = await fetch(`/api/user/points?userId=${gid}`);
      const data = await res.json();
      if (data.success) {
        setPointsStats(data.data);
      }
    } catch (e) {
      console.error('[Sidebar] Points Sync Error:', e);
    }
  };

  useEffect(() => {
    fetchPoints();
    const interval = setInterval(fetchPoints, 10000); // High-Velocity Sync (10s)
    window.addEventListener('gasp_points_update', fetchPoints);
    return () => {
      clearInterval(interval);
      window.removeEventListener('gasp_points_update', fetchPoints);
    };
  }, [profile?.id]);

  useEffect(() => {
    const followedIds = following;
    const others = profiles.filter((p: any) => !followedIds.includes(p.id));
    // Discovery Shuffle
    setShuffledOthers([...others].sort(() => 0.5 - Math.random()));
  }, [profiles, following]);

  const followedProfiles = profiles.filter((p: any) => following.includes(p.id)); 
  const otherProfiles = shuffledOthers;

  const renderProfile = (profileItem: any) => {
    const isSelected = selectedProfileId === profileItem.id;
    const unread = unreadCounts[profileItem.id] || 0;
    const isFollowing = following.includes(profileItem.id);

    return (
      <motion.div
        key={profileItem.id}
        onClick={() => onSelectProfile(profileItem.id)}
        whileHover={{ x: 4 }}
        className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all group relative mb-1 ${isSelected ? 'bg-white/5 border border-white/5 shadow-xl' : 'bg-transparent border border-transparent opacity-60 hover:opacity-100'}`}
      >
        {isFollowing && (
            <div className="absolute top-2 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
               <div className="w-1 h-1 rounded-full bg-[#00ff00] animate-pulse shadow-[0_0_8px_#00ff00]" />
               <span className="text-[6px] font-black text-[#00ff00] uppercase tracking-tighter italic">{isSpanish ? 'Siguiendo' : 'Following'}</span>
            </div>
        )}

        <div className="relative shrink-0">
          <div className={`w-12 h-12 rounded-full overflow-hidden border transition-all ${unread > 0 ? 'border-[#ff00ff] shadow-[0_0_15px_rgba(255,0,255,0.4)]' : 'border-white/10 group-hover:border-white/30'}`}>
            <ProfileAvatar src={profileItem.image} alt={profileItem.name} className={`object-cover transition-all ${unread > 0 || isSelected ? 'grayscale-0' : 'grayscale group-hover:grayscale-0'}`} />
          </div>
          
          {unread > 0 && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1.5 bg-[#ff00ff] text-black text-[9px] font-black rounded-full flex items-center justify-center border-2 border-black shadow-[0_0_15px_rgba(255,0,255,0.6)] z-10"
            >
              {unread > 99 ? '99+' : unread}
            </motion.div>
          )}

          <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-black transition-all ${profileItem.status === 'online' ? 'bg-[#00ff00] shadow-[0_0_10px_#00ff00] animate-pulse' : 'bg-white/10'}`} />
        </div>


        <div className="flex-1 min-w-0 pt-0.5">
           <div className="flex items-center justify-between gap-2 mb-1">
              <span className={`text-[12px] font-black uppercase italic tracking-tighter transition-colors ${unread > 0 ? 'text-[#ff00ff]' : 'text-white'}`}>
                <GlitchText text={getProfileName(profileItem)} />
              </span>
              
              {/* Follow Button */}
              <button 
                onClick={async (e) => {
                   e.stopPropagation();
                   const gid = profile?.id || localStorage.getItem('gasp_guest_id');
                   if (!gid) return;

                   const newState = !isFollowing;
                   // 🛰️ SIGNAL PULSE: Instant local update across all components
                   window.dispatchEvent(new CustomEvent('gasp_sync_follows', { 
                     detail: { personaId: profileItem.id, isFollowing: newState } 
                   }));

                   try {
                     await fetch('/api/rpc/db', {
                       method: 'POST',
                       body: JSON.stringify({ action: 'toggle-follow', payload: { userId: gid, personaId: profileItem.id, isFollowing: !newState } })
                     });
                   } catch (err) {
                     console.error('[Sidebar] Follow Failure:', err);
                   }
                }}
                className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                  isFollowing 
                  ? 'bg-[#ff00ff]/10 border-[#ff00ff]/40 text-[#ff00ff]' 
                  : 'bg-white/5 border-white/10 text-white/20 hover:text-white hover:border-white/40'
                }`}
              >
                  <PlusCircle size={12} className={isFollowing ? 'rotate-45 transition-transform' : 'transition-transform'} />
              </button>
           </div>
           <p className="text-[9px] text-white/30 truncate leading-relaxed">
              {(profileItem.vibe || profileItem.city || (isSpanish ? 'en línea' : 'online now')).toUpperCase()}
           </p>
        </div>
      </motion.div>
    );
  };

  return (
    <aside className="flex w-full lg:w-[260px] h-screen bg-transparent backdrop-blur-xl border-r border-white/5 flex-col shrink-0 overflow-hidden sticky top-0 font-outfit transition-all">
      {/* NAVIGATION BLADE (MOBILE ONLY) */}
      <div className="flex lg:hidden bg-white/5 backdrop-blur-3xl border-b border-white/5 pt-12 items-center px-4">
        <NavButton label={isSpanish ? 'Feed' : 'Feed'} icon={Home} targetView="feed" />
        <NavButton label={isSpanish ? 'Chats' : 'Chats'} icon={MessageSquare} targetView="chats" />
        <NavButton label={isSpanish ? 'Bóveda' : 'Vault'} icon={ShieldCheck} targetView="vault" />
        
        {/* 🌍 MOBILE LOCALE TOGGLE */}
        <div className="flex items-center gap-1 p-1 bg-black/40 rounded-xl border border-white/10 scale-75 origin-right">
            <button 
                onClick={() => {
                    localStorage.setItem('gasp_locale', 'en');
                    window.location.reload();
                }}
                className={`px-3 py-1 text-[8px] font-black rounded-lg transition-all ${localStorage.getItem('gasp_locale') === 'es' ? 'text-white/20' : 'bg-[#00f0ff] text-black'}`}
            >
                EN
            </button>
            <button 
                onClick={() => {
                    localStorage.setItem('gasp_locale', 'es');
                    window.location.reload();
                }}
                className={`px-3 py-1 text-[8px] font-black rounded-lg transition-all ${localStorage.getItem('gasp_locale') === 'es' ? 'bg-[#ff00ff] text-white' : 'text-white/20'}`}
            >
                ES
            </button>
        </div>
      </div>

      <div className="hidden lg:block h-20 shrink-0" />

      <div className="flex-1 overflow-y-auto no-scrollbar py-6">
        {/* VIEW: CHATS */}
        {view === 'chats' && (
          <>
            {/* 🌍 GLOBAL LOCALE TOGGLE */}
            <div className="px-6 mb-6">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 group hover:border-[#00f0ff]/30 transition-all">
                    <span className="text-[7px] font-black uppercase tracking-[0.4em] text-white/30 italic">{isSpanish ? 'Protocolo Local' : 'Locale Protocol'}</span>
                    <div className="flex items-center gap-1 p-1 bg-black rounded-xl border border-white/5">
                        <button 
                           onClick={() => {
                               localStorage.setItem('gasp_locale', 'en');
                               window.location.reload();
                           }}
                           className={`px-3 py-1 text-[8px] font-black rounded-lg transition-all ${localStorage.getItem('gasp_locale') === 'es' ? 'text-white/20 hover:text-white' : 'bg-[#00f0ff] text-black shadow-[0_0_10px_rgba(0,240,255,0.4)]'}`}
                        >
                            EN
                        </button>
                        <button 
                           onClick={() => {
                               localStorage.setItem('gasp_locale', 'es');
                               window.location.reload();
                           }}
                           className={`px-3 py-1 text-[8px] font-black rounded-lg transition-all ${localStorage.getItem('gasp_locale') === 'es' ? 'bg-[#ff00ff] text-white shadow-[0_0_10px_rgba(255,0,255,0.4)]' : 'text-white/20 hover:text-white'}`}
                        >
                            ES
                        </button>
                    </div>
                </div>
            </div>

            {/* 🛰️ MARKET PULSE: WeatherX & Polymarket Sentiment Indicator */}
            <MarketPulseTerminal />

            {/* 🛰️ INTELLIGENCE BRIEF: High-Heat Report Prompt */}
            <div className="px-6 mb-8 mt-4 animate-in fade-in slide-in-from-right-4 duration-1000">
                <h2 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#ffea00] mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#ffea00] animate-pulse shadow-[0_0_8px_#ffea00]" />
                  {isSpanish ? 'Resumen de Inteligencia' : 'Latest Intel Brief'}
                </h2>
                <div 
                   onClick={() => (window as any).onSetActiveTab?.('reports')}
                   className="p-4 rounded-2xl bg-[#ffea00]/5 border border-[#ffea00]/20 hover:bg-[#ffea00]/10 hover:border-[#ffea00]/40 transition-all cursor-pointer group"
                >
                   <div className="flex items-center justify-between mb-2">
                       <span className="text-[7px] font-black text-[#ffea00]/60 uppercase tracking-widest italic">{isSpanish ? 'Señal Verificada' : 'Signal Verified'}</span>
                       <span className="text-[7px] font-black text-white/20 uppercase tracking-widest italic">14:02 UTC</span>
                   </div>
                   <h3 className="text-[10px] font-black uppercase italic tracking-tighter text-white mb-2 leading-tight group-hover:text-[#ffea00] transition-colors">
                      {isSpanish ? 'Anomalía Crítica: Correlación Detectada en Miami' : 'Critical Sector Anomaly: Miami Heatwave Correlation Detected'}
                   </h3>
                   <div className="flex items-center gap-2 text-[6px] font-black uppercase text-white/30 tracking-widest">
                      <ArrowRight size={10} className="text-[#ffea00] -rotate-45" /> {isSpanish ? 'ABRIR REPORTE' : 'OPEN REPORT'}
                   </div>
                </div>
            </div>

            {/* 🛰️ MARKET PULSE: Real-time Intel Ticker */}
            <NeuralPulseTerminal />

            {/* NEW MESSAGES */}
            {Object.keys(unreadCounts).some(id => unreadCounts[id] > 0) && (
              <div className="px-6 mb-8 mt-4">
                <h2 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#ff00ff] mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#ff00ff] animate-ping" />
                  {isSpanish ? 'Uplinks Prioritarios' : 'Priority Uplinks'}
                </h2>
                <div className="space-y-1">
                  {profiles.filter(p => unreadCounts[p.id] > 0).map(renderProfile)}
                </div>
              </div>
            )}

            {/* FAVORITES */}
            {followedProfiles.length > 0 && (
              <div className="px-6 mb-8">
                <h2 className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 mb-4 italic">{isSpanish ? 'Sindicato Shadow' : 'Shadow Syndicate'}</h2>
                <div className="space-y-1">
                  {followedProfiles.map(renderProfile)}
                </div>
              </div>
            )}

            {/* DISCOVERY */}
            <div className="px-6 pb-20">
              <h2 className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 mb-4 italic">
                {isSpanish ? 'Descubrimiento Neural' : 'Neural Discovery'}
              </h2>
              <div className="space-y-1">
                {otherProfiles.map(renderProfile)}
              </div>
            </div>
          </>
        )}

        {/* VIEW: VAULT */}
        {view === 'vault' && (
           <div className="px-8 py-10 space-y-10 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="space-y-2">
                 <span className="text-[9px] font-black uppercase text-[#ff00ff] tracking-[0.4em]">{isSpanish ? 'Nodo de Acceso a Bóveda' : 'Vault Access Node'}</span>
                 <h2 className="text-3xl font-syncopate font-black italic uppercase text-white">{isSpanish ? 'Archivos' : 'Archives'}</h2>
              </div>
              
              <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 flex flex-col gap-6 group">
                 <div className="w-12 h-12 rounded-2xl bg-[#ff00ff]/10 border border-[#ff00ff]/30 flex items-center justify-center text-[#ff00ff]">
                    <ShieldCheck size={24} />
                 </div>
                 <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black leading-loose">
                    {isSpanish 
                      ? 'Su saldo de crédito institucional autoriza el acceso a activos de archivo restringidos. Use créditos para desbloquear personas de alto calor y despachos privados.' 
                      : 'Your institutional credit balance authorizes access to restricted archival assets. Use credits to unlock high-heat personas and private dispatches.'}
                 </p>
                 <Link href="/vault" className="w-full py-4 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-xl text-center hover:scale-[1.02] transition-all">
                    {isSpanish ? 'Abrir Centro Privado' : 'Open Private Hub'}
                 </Link>
              </div>

              {/* RE-RENDER WALLET BALANCE HERE FOR VAULT VIEW */}
              <div className="space-y-4">
                 <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">{isSpanish ? 'Su Saldo' : 'Your Balance'}</h2>
                 <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10">
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-[24px] font-black font-syncopate italic text-white leading-none">
                           {profile?.credit_balance?.toLocaleString() || '0'}
                        </span>
                        <span className="text-[8px] font-black text-[#00f0ff] uppercase tracking-widest italic">{isSpanish ? 'Créditos de Terminal' : 'Terminal Credits'}</span>
                    </div>
                 </div>
                  <button 
                    onClick={() => onOpenTopUp ? onOpenTopUp() : (window as any).openTopUp?.()}
                    className="flex-1 w-full py-3 bg-[#00f0ff] text-black text-[9px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-white transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)]"
                  >
                    {isSpanish ? 'AÑADIR CRÉDITOS' : 'ADD CREDITS'}
                  </button>
              </div>
           </div>
        )}
      </div>

      <div className="p-4 border-t border-white/5 bg-transparent z-10 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
          <div className="hidden lg:flex flex-col gap-6">
              <div className="bg-white/5 border border-white/10 rounded-[1.5rem] p-3 space-y-3 relative overflow-hidden group transition-all">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#00f0ff]/5 to-transparent pointer-events-none" />
                <div className="flex items-center justify-between relative z-10 border-b border-white/5 pb-2">
                   <div className="flex flex-col">
                      <span className="text-[6px] font-black uppercase tracking-[0.2em] text-white/30 italic">
                        {isSpanish ? 'Puntos del Sindicato' : 'Syndicate Points'}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                         <span className="text-[#00f0ff] font-black text-[10px] italic animate-pulse">⚡️</span>
                         <span className="text-[10px] font-syncopate font-black italic text-white leading-none">
                            {(pointsStats?.balance || 0).toLocaleString()} <span className="text-[7px] text-[#00f0ff] not-italic">{isSpanish ? 'PUNTOS' : 'POINTS'}</span>
                         </span>
                      </div>
                   </div>
                   <div className="px-2 py-0.5 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/20 text-[6px] font-black text-[#00f0ff] uppercase tracking-widest">{isSpanish ? 'Nivelado' : 'Matched'} 🛡️</div>
                </div>

                <div className="relative z-10">
                   <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[7px] font-black text-white/40 uppercase tracking-widest italic">{isSpanish ? 'Peso de Quema Shadow' : 'Shadow Burn Weight'}</span>
                      <span className="text-[7px] font-black text-[#ffea00] uppercase tracking-widest">{(pointsStats?.totalSpent || 0).toLocaleString()} CR</span>
                   </div>
                   <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((pointsStats?.totalSpent || 0) / 10000 * 100, 100)}%` }}
                        className="h-full bg-gradient-to-r from-[#00f0ff] to-[#ffea00]" 
                      />
                   </div>
                </div>
              </div>

                <div className="space-y-3 relative z-10 px-1 border-t border-white/5 pt-4">
                  <div className="flex items-center justify-between mb-1">
                     <div className="flex items-center gap-2">
                        <Shield size={12} className="text-[#ffea00]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#ffea00] italic">{isSpanish ? 'Racha Activa' : 'Active Streak'}</span>
                     </div>
                     <span className="text-[7px] font-black text-white/40 uppercase tracking-widest">{isSpanish ? 'Día' : 'Day'} 12 / 180</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
                     <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: '7%' }} 
                         className="h-full bg-[#ffea00] shadow-[0_0_10px_#ffea0044]" 
                     />
                  </div>
                  <div className="flex items-center gap-1.5 text-[6px] font-black uppercase text-[#ffea00]/60 tracking-widest italic animate-pulse">
                     <Zap size={8} /> {isSpanish ? 'PENALIZACIÓN POR SALIDA ANTICIPADA' : 'EARLY EXIT PENALTY ACTIVE'}
                  </div>
               </div>

               <div className="space-y-1 relative z-10 px-1">
                  <div className="flex items-center gap-2 mb-1">
                     <Flame size={12} className="text-[#ff6b00]" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-[#ff6b00] italic">{isSpanish ? 'Rango de Miembro' : 'Member Rank'}</span>
                  </div>
                  <h3 className="text-[12px] font-black uppercase italic tracking-tighter text-white">
                    {pointsStats.balance >= 10000 
                        ? (isSpanish ? 'Miembro Elite 💎' : 'Elite Member 💎')
                        : pointsStats.balance >= 1000 
                            ? (isSpanish ? 'Miembro Pro ⚡️' : 'Pro Member ⚡️')
                            : (isSpanish ? 'Nuevo Miembro 🟠' : 'New Member 🟠')}
                  </h3>
               </div>
          </div>

          <div className="flex flex-col gap-3 pt-4 border-t border-white/5 bg-white/5 p-4 rounded-2xl mb-4 group hover:bg-[#00f0ff]/5 transition-all duration-500">
               <div className="flex items-center justify-between mb-1">
                  <span className="text-[7px] font-black uppercase tracking-[0.4em] text-[#00f0ff] italic">{isSpanish ? 'ID DE MIEMBRO' : 'MEMBER ID'}</span>
                  <div className="flex items-center gap-1 scale-90">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse shadow-[0_0_8px_#00f0ff]" />
                     <span className="text-[6px] font-black text-[#00f0ff] uppercase tracking-widest">{isSpanish ? 'Sesión Activa' : 'Active Session'}</span>
                  </div>
               </div>
               <div 
                 className="flex items-center justify-between group-hover:bg-black/40 p-2 rounded-xl border border-transparent group-hover:border-white/5 transition-all cursor-pointer" 
                 onClick={() => {
                   navigator.clipboard.writeText(profile?.id || '');
                   alert(isSpanish ? 'ID de Miembro Copiado.' : 'MEMBER ID Copied to Clipboard.');
                 }}
               >
                  <code className="text-[10px] font-mono text-white/60 tracking-wider font-black">
                     {profile?.id?.slice(0, 10)}...{profile?.id?.slice(-6)}
                  </code>
                 <Copy 
                    size={12} 
                    className="text-[#00f0ff] opacity-40 group-hover:opacity-100 transition-opacity" 
                 />
              </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-white/5">
             <button 
                onClick={() => onOpenTopUp ? onOpenTopUp() : (window as any).openTopUp?.()}
                className="w-full h-12 bg-[#00f0ff] text-black rounded-2xl flex items-center justify-center gap-2 hover:bg-white transition-all group shadow-[0_8px_35px_rgba(0,240,255,0.2)] active:scale-95 border-none"
             >
                <div className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center">
                   <Zap size={10} className="text-black" />
                 </div>
                <span className="text-[8px] font-black uppercase tracking-widest italic font-syncopate">{isSpanish ? 'AÑADIR CRÉDITOS' : 'ADD CREDITS'}</span>
             </button>
          </div>

          <div className="flex flex-col gap-3 pt-2 border-t border-white/5">
             <button 
                onClick={() => {
                   navigator.clipboard.writeText('https://gasp.fun');
                   alert(isSpanish ? 'Enlace Soberano Copiado.' : 'Sovereign Link Copied to Clipboard.');
                }}
                className="w-full flex items-center justify-center gap-2 py-2 text-[8px] font-black uppercase text-white/40 hover:text-[#00f0ff] transition-colors tracking-widest italic"
             >
                <Share size={10} />
                <span>{isSpanish ? 'Copiar Enlace de Invitación' : 'Copy Invite Link'}</span>
             </button>
             
             <div className="flex items-center justify-center gap-4 text-[7px] font-black uppercase text-white/20 tracking-[0.2em]">
                <Link href="/how-to" className="hover:text-white transition-colors">{isSpanish ? 'Cómo' : 'How-To'}</Link>
                <Link href="/terms" className="hover:text-white transition-colors">{isSpanish ? 'Términos' : 'Terms'}</Link>
                <Link href="/privacy" className="hover:text-white transition-colors">{isSpanish ? 'Privacidad' : 'Privacy'}</Link>
             </div>
             
             <span className="text-[8px] text-white/10 uppercase font-black italic text-center">Version 1.8 // Sovereign Terminal</span>
          </div>
      </div>
    </aside>
  );
}
