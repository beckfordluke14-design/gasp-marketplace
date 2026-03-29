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
  Star
} from 'lucide-react';
import { useUser } from '@/components/providers/UserProvider';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import Link from 'next/link';
import GlitchText from './ui/GlitchText';

import NeuralPulseHub from './NeuralPulseHub';

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
    if (points >= 10000) return { label: 'Diamond Member 💎', color: '#00f0ff', priority: '10x', shadow: '0 0 20px #00f0ff44', icon: <Trophy size={12} /> };
    if (points >= 5000) return { label: 'Platinum Member ⚡️', color: '#ff00ff', priority: '5x', shadow: '0 0 20px #ff00ff44', icon: <Zap size={12} /> };
    if (points >= 2000) return { label: 'Gold Member 🟡', color: '#ffea00', priority: '2x', shadow: '0 0 20px #ffea0044', icon: <ShieldCheck size={12} /> };
    if (points >= 500) return { label: 'Silver Member 🔘', color: '#e5e7eb', priority: '1.5x', shadow: '0 0 20px #ffffff22', icon: <Zap size={12} /> };
    return { label: 'Bronze Member 🟠', color: '#cd7f32', priority: '1x', shadow: 'none', icon: <Zap size={12} /> };
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
            {/* 🛰️ MARKET PULSE: Real-time Intel Ticker */}
            <NeuralPulseHub />

            {/* NEW MESSAGES */}
            {Object.keys(unreadCounts).some(id => unreadCounts[id] > 0) && (
                <div className="mb-8 px-4">
                    <div className="px-2 mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MessageSquare size={10} className="text-[#00ff00]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00ff00] italic">Direct Messages</span>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        {profiles.filter(p => unreadCounts[p.id] > 0).map(p => (
                            <motion.div key={p.id} onClick={() => onSelectProfile(p.id)} whileHover={{ x: 4 }} className="flex items-center gap-3 p-3 rounded-2xl bg-[#00f0ff]/5 border border-[#00f0ff]/10 mb-2 cursor-pointer group">
                                <div className="w-10 h-10 rounded-full overflow-hidden border border-[#00ff00]/40 shrink-0">
                                    <ProfileAvatar src={p.image} alt={p.name} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black uppercase text-white truncate">{p.name}</p>
                                    <p className="text-[8px] font-bold text-[#00f0ff] uppercase tracking-widest">{unreadCounts[p.id]} new</p>
                                </div>
                                <ArrowRight size={12} className="text-[#00f0ff] opacity-40 group-hover:opacity-100" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* FAVORITES (FOLLOWED) CHATS - AT TOP */}
            {followedProfiles.length > 0 && (
                <div className="mb-8">
                    <div className="px-6 mb-4">
                        <div className="flex items-center gap-2">
                            <Star size={10} className="text-[#ff00ff] fill-[#ff00ff]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ff00ff] italic">Favorites</span>
                        </div>
                    </div>
                    <div className="flex flex-col px-4">
                        {followedProfiles.map(renderProfile)}
                    </div>
                </div>
            )}

            {/* RECENT CHATS - LAST FIVE */}
            {recentIds.length > 0 && (
                <div className="mb-8">
                    <div className="px-6 mb-4">
                        <div className="flex items-center gap-2">
                            <Zap size={10} className="text-white/40" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 italic">Recent</span>
                        </div>
                    </div>
                    <div className="flex flex-col px-4">
                        {profiles.filter(p => recentIds.includes(p.id) && !following.includes(p.id)).map(renderProfile)}
                    </div>
                </div>
            )}

            <div className="hidden lg:flex px-6 mb-4 items-center gap-2">
               <Sparkles size={10} className="text-white/40" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 italic">Discover</span>
            </div>
            
            <div className="hidden lg:flex flex-col px-4">
              {otherProfiles.map(renderProfile)}
            </div>
          </>
        )}

        {/* VIEW: VAULT */}
        {view === 'vault' && (
           <div className="px-6 space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="space-y-4">
                 <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Private Content</h2>
                 <Link href="/vault" className="block p-6 rounded-[2rem] bg-white/5 backdrop-blur-3xl border border-white/10 hover:border-[#ff00ff]/40 transition-all text-center group">
                    <ShieldCheck size={32} className="mx-auto text-[#ff00ff] mb-4 group-hover:scale-110 transition-transform" />
                    <p className="text-[12px] font-black text-white uppercase italic font-syncopate">Explore Unlocks</p>
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
                        <span className="text-[8px] font-black text-[#00ff00] uppercase tracking-widest italic">Credits</span>
                    </div>
                 </div>
              </div>
           </div>
        )}
      </div>

      <div className="p-4 border-t border-white/5 bg-transparent z-10 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
          <div className="hidden lg:flex flex-col gap-6">
              <div className="bg-white/5 border border-white/10 rounded-[1.5rem] p-3 space-y-3 relative overflow-hidden group transition-all">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#00ff00]/5 to-transparent pointer-events-none" />
                <div className="flex items-center justify-between relative z-10 border-b border-white/5 pb-2">
                   <div className="flex flex-col">
                      <span className="text-[6px] font-black uppercase tracking-[0.2em] text-white/30 italic">Wallet Balance</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                         <span className="text-[#00ff00] font-black text-[10px] italic">⚡️</span>
                         <span className="text-[10px] font-syncopate font-black italic text-white leading-none">
                            {profile?.credit_balance?.toLocaleString() || '0'} <span className="text-[7px] text-[#00ff00] not-italic">CREDITS</span>
                         </span>
                      </div>
                   </div>
                </div>
              </div>

              <div className="space-y-3 relative z-10">
                 <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                       <Zap size={14} className="text-[#00f0ff] animate-pulse" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-[#00f0ff] italic">Account Tier</span>
                    </div>
                 </div>
                 <h3 className="text-[14px] font-black uppercase italic tracking-tighter text-white" style={{ textShadow: rank.shadow }}>
                    {rank.label}
                 </h3>
                 <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-2">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((profile?.credit_balance || 0) / 10000 * 100, 100)}%` }}
                      className="h-full bg-gradient-to-r from-[#00f0ff] to-[#ffea00]" 
                    />
                 </div>
              </div>
          </div>

          <div className="space-y-2">
             <button 
                onClick={() => (window as any).openTopUp?.()}
                className="w-full h-11 bg-[#00f0ff] text-black rounded-2xl flex items-center justify-center gap-2 hover:bg-white transition-all group shadow-[0_8px_35px_rgba(0,240,255,0.15)] active:scale-95"
             >
                <div className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center">
                   <Zap size={10} className="text-black" />
                 </div>
                <span className="text-[8px] font-black uppercase tracking-widest italic font-syncopate">ADD CREDITS</span>
             </button>
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-white/5 opacity-50">
             <span className="text-[8px] text-white/20 uppercase font-black italic text-center">Version 1.8</span>
          </div>
      </div>
    </aside>
  );
}
