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
  Flame
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
}

export default function Sidebar({ selectedProfileId, onSelectProfile, unreadCounts = {}, profiles, view = 'chats', onSetView }: SidebarProps) {
  const { profile } = useUser();
  const [following, setFollowing] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);

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

  // ACCOUNT RANK LOGIC
  const getAccountRank = (points: number = 0) => {
    if (points >= 10000) return { label: 'Sovereign Node [Level 5] 💎', color: '#00f0ff', priority: '10x', shadow: '0 0 20px #00f0ff44', icon: <Trophy size={12} /> };
    if (points >= 5000) return { label: 'Elite Operative [Level 4] ⚡️', color: '#ff00ff', priority: '5x', shadow: '0 0 20px #ff00ff44', icon: <Zap size={12} /> };
    if (points >= 2000) return { label: 'Field Analyst [Level 3] 🟡', color: '#ffea00', priority: '2x', shadow: '0 0 20px #ffea0044', icon: <ShieldCheck size={12} /> };
    if (points >= 500) return { label: 'Verified Scout [Level 2] 🔘', color: '#e5e7eb', priority: '1.5x', shadow: '0 0 20px #ffffff22', icon: <Zap size={12} /> };
    return { label: 'Entry Node [Level 1] 🟠', color: '#cd7f32', priority: '1x', shadow: 'none', icon: <Zap size={12} /> };
  };

  const rank = getAccountRank(profile?.credit_balance || 0);

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
    
    window.addEventListener('gasp_sync_follows', syncFollows);
    window.addEventListener('storage', syncFollows);
    return () => {
       window.removeEventListener('gasp_sync_follows', syncFollows);
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
               <span className="text-[6px] font-black text-[#00ff00] uppercase tracking-tighter italic">Following</span>
            </div>
        )}

        <div className="relative shrink-0">
          <div className={`w-12 h-12 rounded-full overflow-hidden border transition-all ${unread > 0 ? 'border-[#ff00ff] shadow-[0_0_15px_rgba(255,0,255,0.4)]' : 'border-white/10 group-hover:border-white/30'}`}>
            <ProfileAvatar src={profileItem.image} alt={profileItem.name} className={`object-cover transition-all ${unread > 0 || isSelected ? 'grayscale-0' : 'grayscale group-hover:grayscale-0'}`} />
          </div>
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

                   try {
                     await fetch('/api/rpc/db', {
                       method: 'POST',
                       body: JSON.stringify({ action: 'toggle-follow', payload: { userId: gid, personaId: profileItem.id, isFollowing } })
                     });
                     
                     window.dispatchEvent(new Event('gasp_sync_follows'));
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
                  <PlusCircle size={12} className={isFollowing ? 'rotate-45 transition-transform' : ''} />
              </button>
           </div>
           <p className="text-[9px] text-white/30 truncate leading-relaxed">
              {(profileItem.vibe || profileItem.city || 'online now').toUpperCase()}
           </p>
        </div>
      </motion.div>
    );
  };

  return (
    <aside className="flex w-full lg:w-[260px] h-screen bg-transparent backdrop-blur-xl border-r border-white/5 flex-col shrink-0 overflow-hidden sticky top-0 font-outfit transition-all">
      {/* NAVIGATION BLADE (MOBILE ONLY) */}
      <div className="flex lg:hidden bg-white/5 backdrop-blur-3xl border-b border-white/5 pt-12">
        <NavButton label="Feed" icon={Home} targetView="feed" />
        <NavButton label="Chats" icon={MessageSquare} targetView="chats" />
        <NavButton label="Vault" icon={ShieldCheck} targetView="vault" />
      </div>

      <div className="hidden lg:block h-20 shrink-0" />

      <div className="flex-1 overflow-y-auto no-scrollbar py-6">
        {/* VIEW: CHATS */}
        {view === 'chats' && (
          <>
            {/* 🛰️ MARKET PULSE: WeatherX & Polymarket Sentiment Indicator */}
            <MarketPulseTerminal />

            {/* 🛰️ MARKET PULSE: Real-time Intel Ticker */}
            <NeuralPulseTerminal />

            {/* NEW MESSAGES */}
            {Object.keys(unreadCounts).some(id => unreadCounts[id] > 0) && (
              <div className="px-6 mb-8 mt-4">
                <h2 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#ff00ff] mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#ff00ff] animate-ping" />
                  Priority Uplinks
                </h2>
                <div className="space-y-1">
                  {profiles.filter(p => unreadCounts[p.id] > 0).map(renderProfile)}
                </div>
              </div>
            )}

            {/* FAVORITES */}
            {followedProfiles.length > 0 && (
              <div className="px-6 mb-8">
                <h2 className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 mb-4 italic">Shadow Syndicate</h2>
                <div className="space-y-1">
                  {followedProfiles.map(renderProfile)}
                </div>
              </div>
            )}

            {/* DISCOVERY */}
            <div className="px-6 pb-20">
              <h2 className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 mb-4 italic">Neural Discovery</h2>
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
                 <span className="text-[9px] font-black uppercase text-[#ff00ff] tracking-[0.4em]">Vault Access Node</span>
                 <h2 className="text-3xl font-syncopate font-black italic uppercase text-white">Archives</h2>
              </div>
              
              <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 flex flex-col gap-6 group">
                 <div className="w-12 h-12 rounded-2xl bg-[#ff00ff]/10 border border-[#ff00ff]/30 flex items-center justify-center text-[#ff00ff]">
                    <ShieldCheck size={24} />
                 </div>
                 <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black leading-loose">
                    Your institutional credit balance authorizes access to restricted archival assets. Use credits to unlock high-heat personas and private dispatches.
                 </p>
                 <Link href="/vault" className="w-full py-4 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-xl text-center hover:scale-[1.02] transition-all">
                    Open Private Hub
                 </Link>
              </div>

              {/* RE-RENDER WALLET BALANCE HERE FOR VAULT VIEW */}
              <div className="space-y-4">
                 <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Your Balance</h2>
                 <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10">
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-[24px] font-black font-syncopate italic text-white leading-none">
                           {profile?.credit_balance?.toLocaleString() || '0'}
                        </span>
                        <span className="text-[8px] font-black text-[#00f0ff] uppercase tracking-widest italic">Terminal Credits</span>
                    </div>
                 </div>
                  <button 
                    onClick={() => (window as any).openTopUp?.()}
                    className="flex-1 w-full py-3 bg-[#00f0ff] text-black text-[9px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-white transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)]"
                  >
                    TOP UP
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
                      <span className="text-[6px] font-black uppercase tracking-[0.2em] text-white/30 italic">Syndicate Points</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                         <span className="text-[#00f0ff] font-black text-[10px] italic animate-pulse">⚡️</span>
                         <span className="text-[10px] font-syncopate font-black italic text-white leading-none">
                            {(pointsStats?.balance || 0).toLocaleString()} <span className="text-[7px] text-[#00f0ff] not-italic">POINTS</span>
                         </span>
                      </div>
                   </div>
                   <div className="px-2 py-0.5 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/20 text-[6px] font-black text-[#00f0ff] uppercase tracking-widest">Matched 🛡️</div>
                </div>

                <div className="relative z-10">
                   <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[7px] font-black text-white/40 uppercase tracking-widest italic">Shadow Burn Weight</span>
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

              <div className="space-y-1 relative z-10 px-1">
                 <div className="flex items-center gap-2 mb-1">
                    <Flame size={12} className="text-[#ffea00]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#ffea00] italic">Network Power</span>
                 </div>
                 <h3 className="text-[12px] font-black uppercase italic tracking-tighter text-white">
                    {pointsStats.balance >= 10000 ? 'Sovereign Node 💎' : pointsStats.balance >= 1000 ? 'Syndicate Overseer ⚡️' : 'Recruit Analyst 🟠'}
                 </h3>
              </div>
          </div>

          <div className="space-y-2">
             <button 
                onClick={() => (window as any).openTopUp?.()}
                className="w-full h-11 bg-[#00f0ff] text-black rounded-2xl flex items-center justify-center gap-2 hover:bg-white transition-all group shadow-[0_8px_35px_rgba(0,240,255,0.15)] active:scale-95 border-none"
             >
                <div className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center">
                   <Zap size={10} className="text-black" />
                 </div>
                <span className="text-[8px] font-black uppercase tracking-widest italic font-syncopate">TOP UP</span>
             </button>
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-white/5 opacity-50">
             <span className="text-[8px] text-white/20 uppercase font-black italic text-center">Version 1.8 // Sovereign Terminal</span>
          </div>
      </div>
    </aside>
  );
}
