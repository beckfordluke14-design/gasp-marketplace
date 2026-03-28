'use client';

import { motion } from 'framer-motion';
import { initialProfiles, proxyImg, getProfileName } from '@/lib/profiles';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  PlusCircle,
  MessageSquare,
  User,
  Settings,
  Coins,
  Zap,
  Trophy,
  ShieldCheck,
  ArrowRight,
  LogOut,
  Heart,
  Sparkles
} from 'lucide-react';
import { useUser } from '@/components/providers/UserProvider';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import Link from 'next/link';

// 🛡️ SYSTEM SYNC: Using DB Service for reliable updates.

interface SidebarProps {
  selectedProfileId: string;
  onSelectProfile: (id: string) => void;
  unreadCounts?: Record<string, number>;
  profiles: any[];
}

export default function Sidebar({ selectedProfileId, onSelectProfile, unreadCounts = {}, profiles }: SidebarProps) {
  const { profile } = useUser();
  const [following, setFollowing] = useState<string[]>([]);

  // ACCOUNT RANK LOGIC
  const getAccountRank = (points: number = 0) => {
    if (points >= 10000) return { label: 'Diamond Member 💎', color: '#00f0ff', priority: '10x', shadow: '0 0 20px #00f0ff44', icon: <Trophy size={12} /> };
    if (points >= 5000) return { label: 'Platinum Member ⚡️', color: '#ff00ff', priority: '5x', shadow: '0 0 20px #ff00ff44', icon: <Zap size={12} /> };
    if (points >= 2000) return { label: 'Gold Member 🟡', color: '#ffea00', priority: '2x', shadow: '0 0 20px #ffea0044', icon: <ShieldCheck size={12} /> };
    if (points >= 500) return { label: 'Silver Member 🔘', color: '#e5e7eb', priority: '1.5x', shadow: '0 0 20px #ffffff22', icon: <Zap size={12} /> };
    return { label: 'Bronze Member 🟠', color: '#cd7f32', priority: '1x', shadow: 'none', icon: <Zap size={12} /> };
  };

  const rank = getAccountRank(profile?.credit_balance || 0);

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
                {getProfileName(profileItem)}
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
    <aside className="hidden lg:flex w-[260px] h-screen bg-black/40 backdrop-blur-3xl border-r border-white/5 flex-col shrink-0 overflow-hidden sticky top-0 font-outfit transition-all">
      <div className="h-20 shrink-0" />

      <div className="flex-1 overflow-y-auto no-scrollbar py-6">
        {/* NEW MESSAGES */}
        {Object.keys(unreadCounts).some(id => unreadCounts[id] > 0) && (
            <div className="mb-8 px-4">
                <div className="px-2 mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageSquare size={10} className="text-[#00ff00]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00ff00] italic">Unread Messages</span>
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
                                <p className="text-[8px] font-bold text-[#00f0ff] uppercase tracking-widest">{unreadCounts[p.id]} new messages</p>
                             </div>
                             <ArrowRight size={12} className="text-[#00f0ff] opacity-40 group-hover:opacity-100" />
                        </motion.div>
                    ))}
                </div>
                <div className="h-px w-full bg-white/5 mt-4" />
            </div>
        )}

        {followedProfiles.length > 0 && (
            <div className="mb-8">
                <div className="px-6 mb-4">
                    <div className="flex items-center gap-2">
                        <Heart size={10} className="text-[#ff00ff] fill-current" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ff00ff] italic">Following</span>
                    </div>
                </div>
                <div className="flex flex-col px-4">
                    {followedProfiles.map(renderProfile)}
                </div>
                <div className="h-px w-full bg-white/5 mt-6" />
            </div>
        )}

        <div className="px-6 mb-4 flex items-center gap-2">
           <Sparkles size={10} className="text-white/40" />
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 italic">Discover</span>
        </div>
        
        <div className="flex flex-col px-4">
          {otherProfiles.map(renderProfile)}
        </div>
      </div>

      <div className="p-4 border-t border-white/5 bg-black/20 z-10 flex flex-col gap-4 transition-all">
           {/* MY WALLET */}
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
               <div className="px-1.5 py-0.5 rounded-full bg-[#00ff00]/10 border border-[#00ff00]/20">
                  <span className="text-[6px] font-black text-[#00ff00] uppercase tracking-widest italic">Member</span>
               </div>
            </div>

            <div className="flex items-center justify-between relative z-10 px-1">
               <div className="flex flex-col gap-0.5">
                  <span className="text-[6px] font-black uppercase tracking-[0.1em] text-white/30">Next Reward</span>
                  <span className="text-[8px] font-black text-[#ff00ff] italic font-syncopate">48:24:12</span>
               </div>
               <div className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-green-500" />
                  <span className="text-[5px] font-black text-white/40 uppercase tracking-widest">Connected</span>
               </div>
            </div>

            <Link href="/docs/about" className="block p-2 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] transition-all group/btn">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center group-hover/btn:bg-[#ffea00]/10 transition-colors">
                        <ArrowRight size={12} className="text-white/20 group-hover/btn:text-[#ffea00]" />
                     </div>
                     <span className="text-[7px] font-black uppercase tracking-widest text-white/40 group-hover/btn:text-white transition-colors">About Gasp</span>
                  </div>
                  <div className="h-1 w-1 rounded-full bg-white/10 group-hover/btn:bg-[#ffea00] animate-pulse" />
               </div>
            </Link>
          </div>

          <div className="space-y-3 relative z-10">
             <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                   <Zap size={14} className="text-[#00f0ff] animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-[#00f0ff] italic">Member Rank</span>
                </div>
             </div>
             <p className="text-[8px] font-black uppercase text-white/40 tracking-[0.2em] italic">Current Level</p>
             <h3 className="text-[14px] font-black uppercase italic tracking-tighter text-white" style={{ textShadow: rank.shadow }}>
                {rank.label}
             </h3>
             <div className="flex items-center gap-2 mt-2">
                <div className="px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                   <span className="text-[8px] font-black text-white/60 uppercase">{rank.priority} Earnings Boost</span>
                </div>
             </div>
             
             <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-2">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((profile?.credit_balance || 0) / 10000 * 100, 100)}%` }}
                  className="h-full bg-gradient-to-r from-[#00f0ff] to-[#ffea00]" 
                />
             </div>
          </div>

          <div className="pt-4 border-t border-white/5 space-y-3 relative z-10">
               <div className="flex items-center justify-between">
                  <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/30 italic">Top Supporters</span>
                  <span className="text-[7px] font-black uppercase tracking-widest text-[#00f0ff] hover:underline cursor-pointer">Leaderboard →</span>
               </div>
               <div className="space-y-2">
                  <div className="flex items-center justify-between text-[9px]">
                     <div className="flex items-center gap-2">
                        <span className="text-[#ffea00] font-black">#1</span>
                        <span className="text-white/60 font-bold">Top_Supporter</span>
                     </div>
                     <span className="text-white font-black italic">15,400 Credits</span>
                  </div>
               </div>
            </div>

             <div className="flex items-center justify-between pt-1 relative z-10 border-t border-white/5 mt-3 pt-3">
                <p className="text-[7px] font-black uppercase text-white/20 tracking-widest italic leading-relaxed">
                   Gasp Platform v1.8 • Secure API • Account Protections Active 🛡️
                </p>
                <div className="flex flex-col items-end gap-1">
                   <div className="flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[6px] font-black text-green-500 uppercase tracking-widest">Protected</span>
                   </div>
                </div>
             </div>

          {/* BUY CTA */}
          <div className="space-y-2">
             <button className="w-full h-11 bg-[#ffea00] text-black rounded-2xl flex items-center justify-center gap-2 hover:bg-white transition-all group shadow-[0_8px_35px_rgba(255,234,0,0.15)] active:scale-95">
                <div className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center">
                   <Zap size={10} className="text-black" />
                 </div>
                <span className="text-[8px] font-black uppercase tracking-widest italic font-syncopate">BUY CREDITS</span>
             </button>
               <div className="flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse" />
                <span className="text-[7px] font-black uppercase tracking-[0.2em] text-[#00f0ff] italic">Bonus Credits Active 🛡️</span>
             </div>
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-white/5 opacity-50">
               <span className="text-[8px] text-white/20 uppercase font-black italic text-center">Version 1.8</span>
          </div>
        </div>
    </aside>
  );
}
