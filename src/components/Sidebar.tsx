'use client';

import { motion } from 'framer-motion';
import { initialPersonas, proxyImg, getPersonaName } from '@/lib/profiles';
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
import PersonaAvatar from '@/components/persona/PersonaAvatar';
import Link from 'next/link';

interface SidebarProps {
  selectedPersonaId: string;
  onSelectPersona: (id: string) => void;
  unreadCounts?: Record<string, number>;
  personas: any[];
}

export default function Sidebar({ selectedPersonaId, onSelectPersona, unreadCounts = {}, personas }: SidebarProps) {
  const { profile } = useUser();
  const [following, setFollowing] = useState<string[]>([]);

  // 🧬 AIRDROP TIER LOGIC: 1:1 Stake Model
  const getSyncRank = (points: number = 0) => {
    if (points >= 10000) return { label: 'Genesis Diamond 💎', color: '#00f0ff', priority: '10x', shadow: '0 0 20px #00f0ff44', icon: <Trophy size={12} /> };
    if (points >= 5000) return { label: 'Elite Platinum ⚡️', color: '#ff00ff', priority: '5x', shadow: '0 0 20px #ff00ff44', icon: <Zap size={12} /> };
    if (points >= 2000) return { label: 'Gold Protocol 🟡', color: '#ffea00', priority: '2x', shadow: '0 0 20px #ffea0044', icon: <ShieldCheck size={12} /> };
    if (points >= 500) return { label: 'Silver Pulse 🔘', color: '#e5e7eb', priority: '1.5x', shadow: '0 0 20px #ffffff22', icon: <Zap size={12} /> };
    return { label: 'Bronze Sync 🟠', color: '#cd7f32', priority: '1x', shadow: 'none', icon: <Zap size={12} /> };
  };

  const rank = getSyncRank(profile?.pulse_points || 0);

  useEffect(() => {
    const stored = localStorage.getItem('gasp_following');
    if (stored) {
      try {
        setFollowing(JSON.parse(stored));
      } catch (e) {
        setFollowing([]);
      }
    }

    const handleStorage = () => {
      const updated = localStorage.getItem('gasp_following');
      if (updated) setFollowing(JSON.parse(updated));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const [shuffledOthers, setShuffledOthers] = useState<any[]>([]);

  useEffect(() => {
    const followedIds = following;
    const others = personas.filter(p => !followedIds.includes(p.id));
    // SYNDICATE V10: High-Value Discovery Shuffle
    setShuffledOthers([...others].sort(() => 0.5 - Math.random()));
  }, [personas, following]);

  const followedPersonas = personas.filter(p => !following.includes(p.id) ? false : true); 
  const otherPersonas = shuffledOthers;

  const renderPersona = (persona: any) => {
    const isSelected = selectedPersonaId === persona.id;
    const unread = unreadCounts[persona.id] || 0;
    const isFollowing = following.includes(persona.id);

    return (
      <motion.div
        key={persona.id}
        onClick={() => onSelectPersona(persona.id)}
        whileHover={{ x: 4 }}
        className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all group relative mb-1 ${isSelected ? 'bg-white/5 border border-white/5 shadow-xl' : 'bg-transparent border border-transparent opacity-60 hover:opacity-100'}`}
      >
        {isFollowing && (
            <div className="absolute top-2 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
               <div className="w-1 h-1 rounded-full bg-[#00f0ff] animate-pulse" />
               <span className="text-[6px] font-black text-[#00f0ff] uppercase tracking-tighter italic">Following</span>
            </div>
        )}

        <div className="relative shrink-0">
          <div className={`w-12 h-12 rounded-full overflow-hidden border transition-all ${unread > 0 ? 'border-[#ff00ff] shadow-[0_0_15px_rgba(255,0,255,0.4)]' : 'border-white/10 group-hover:border-white/30'}`}>
            <PersonaAvatar src={persona.image} alt={persona.name} className={`object-cover transition-all ${unread > 0 || isSelected ? 'grayscale-0' : 'grayscale group-hover:grayscale-0'}`} />
          </div>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-black bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]" />
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
           <div className="flex items-center justify-between gap-2 mb-1">
              <span className={`text-[12px] font-black uppercase italic tracking-tighter transition-colors ${unread > 0 ? 'text-[#ff00ff]' : 'text-white'}`}>
                {getPersonaName(persona)}
              </span>
           </div>
           <p className="text-[9px] text-white/30 truncate leading-relaxed">
              {persona.vibe.toUpperCase()}
           </p>
        </div>
      </motion.div>
    );
  };

  return (
    <aside className="hidden lg:flex w-[320px] h-screen bg-[#000000] border-r border-white/5 flex-col shrink-0 overflow-hidden sticky top-0 font-outfit">
      <div className="h-20 shrink-0" />

      <div className="flex-1 overflow-y-auto no-scrollbar py-6">
        {followedPersonas.length > 0 && (
            <div className="mb-8">
                <div className="px-6 mb-4">
                    <div className="flex items-center gap-2">
                        <Heart size={10} className="text-[#ff00ff] fill-current" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ff00ff] italic">Following</span>
                    </div>
                </div>
                <div className="flex flex-col px-4">
                    {followedPersonas.map(renderPersona)}
                </div>
                <div className="h-px w-full bg-white/5 mt-6" />
            </div>
        )}

        <div className="px-6 mb-4 flex items-center gap-2">
           <Sparkles size={10} className="text-white/40" />
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 italic">Open Directory</span>
        </div>
        
        <div className="flex flex-col px-4">
          {otherPersonas.map(renderPersona)}
        </div>
      </div>

      <div className="p-6 border-t border-white/5 bg-black z-10 flex flex-col gap-5">
         
         {/* ══════════════════════════════════════════════════
             $GASPAI GENESIS AIRDROP (TGE Reservation Ledger)
             ══════════════════════════════════════════════════ */}
         <div className="bg-white/5 border border-white/10 rounded-[2rem] p-5 space-y-4 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#00f0ff]/5 to-transparent pointer-events-none" />
            
            <div className="flex items-center justify-between relative z-10 border-b border-white/5 pb-3">
               <div className="flex flex-col">
                  <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/30 italic">Lifetime Reservation</span>
                  <div className="flex items-center gap-2 mt-1">
                     <Coins size={10} className="text-[#ffea00]" />
                     <span className="text-[12px] font-syncopate font-black italic text-white leading-none">
                        {profile?.pulse_points?.toLocaleString() || '0'} <span className="text-[8px] text-[#ffea00] not-italic">$GASPAI STAKE</span>
                     </span>
                  </div>
               </div>
               <div className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                  <span className="text-[7px] font-black text-green-500 uppercase tracking-widest">Verfied 1:1 Stake</span>
               </div>
            </div>

            <div className="flex items-center justify-between relative z-10 px-1">
               <div className="flex flex-col gap-1">
                  <span className="text-[7px] font-black uppercase tracking-[0.2em] text-white/30">Next Snapshot Cycle</span>
                  <span className="text-[10px] font-black text-[#ff00ff] italic font-syncopate">48:24:12</span>
               </div>
               <div className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-green-500" />
                  <span className="text-[6px] font-black text-white/40 uppercase tracking-widest">Active Sink</span>
               </div>
            </div>

            <Link href="/docs/whitepaper" className="block p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] transition-all group/btn">
               <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/40 group-hover/btn:text-[#ff00ff]">Verify Snapshot Logic</span>
                  <ArrowRight size={10} className="text-white/20 group-hover/btn:text-[#ff00ff] -rotate-45" />
               </div>
            </Link>

            <div className="flex items-center justify-between relative z-10">
               <div className="flex items-center gap-2">
                  <Zap size={14} className="text-[#00f0ff] animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#00f0ff] italic">Genesis Rank</span>
               </div>
            </div>

            <div className="space-y-1 relative z-10">
               <p className="text-[8px] font-black uppercase text-white/40 tracking-[0.2em] italic">Current Standing</p>
               <h3 className="text-[14px] font-black uppercase italic tracking-tighter text-white" style={{ textShadow: rank.shadow }}>
                  {rank.label}
               </h3>
               <div className="flex items-center gap-2 mt-2">
                  <div className="px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                     <span className="text-[8px] font-black text-white/60 uppercase">{rank.priority} Allocation Multiplier</span>
                  </div>
               </div>
            </div>

            {/* Progress to next Tier */}
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden relative z-10">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${Math.min((profile?.pulse_points || 0) / 10000 * 100, 100)}%` }}
                 className="h-full bg-gradient-to-r from-[#00f0ff] to-[#ffea00]" 
               />
            </div>

            {/* 🧬 THE WHALE MAGNET: GENESIS LEADERBOARD */}
            <div className="pt-4 border-t border-white/5 space-y-3 relative z-10">
               <div className="flex items-center justify-between">
                  <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/30 italic">Genesis Leaders</span>
                  <span className="text-[7px] font-black uppercase tracking-widest text-[#00f0ff] hover:underline cursor-pointer">Live Audit →</span>
               </div>
               <div className="space-y-2">
                  <div className="flex items-center justify-between text-[9px]">
                     <div className="flex items-center gap-2">
                        <span className="text-[#ffea00] font-black">#1</span>
                        <span className="text-white/60 font-bold">Whale_Alpha</span>
                     </div>
                     <span className="text-white font-black italic">15,400 $GASPAI</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px]">
                     <div className="flex items-center gap-2">
                        <span className="text-[#00f0ff] font-black text-opacity-70">#2</span>
                        <span className="text-white/40 font-bold">CryptoGoddess</span>
                     </div>
                     <span className="text-white/40 font-black italic">12,180 $GASPAI</span>
                  </div>
               </div>
            </div>

            <div className="flex items-center justify-between pt-1 relative z-10 border-t border-white/5 mt-3 pt-3">
               <p className="text-[7px] font-black uppercase text-white/20 tracking-widest italic leading-relaxed">
                  Gasp Reserve Protocol v1.7 • 1:1 USD-to-Token Stake Model. <Link href="/docs/whitepaper" className="text-[#00f0ff] hover:underline underline-offset-2">$GASPAI Ledger Active</Link> 💎
               </p>
               <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1">
                     <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                     <span className="text-[6px] font-black text-green-500 uppercase tracking-widest">System Integrity Verified</span>
                  </div>
                  <span className="text-[5px] text-white/10 uppercase tracking-widest font-mono">HASH: 0x8F...7G2P</span>
               </div>
            </div>
         </div>

         {/* STAKE CTA */}
         <div className="space-y-3">
            <button className="w-full h-14 bg-[#ffea00] text-black rounded-3xl flex items-center justify-center gap-3 hover:bg-white transition-all group shadow-[0_8px_35px_rgba(255,234,0,0.25)] active:scale-95">
               <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center">
                  <Coins size={14} className="text-black" />
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest italic font-syncopate">STAKE FOR $GASPAI →</span>
            </button>
            <div className="flex items-center justify-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse" />
               <span className="text-[7px] font-black uppercase tracking-[0.2em] text-[#00f0ff] italic">USDC Preferred: +15% Stake Bonus Active 💎</span>
            </div>
         </div>

         <div className="flex flex-col gap-2 pt-2 border-t border-white/5 opacity-50">
            <div className="flex items-center justify-between">
               <div className="flex gap-4">
                  <a href="/terms" className="text-[8px] text-white/20 hover:text-white uppercase font-black italic">Terms</a>
                  <a href="/contact" className="text-[8px] text-[#ff00ff]/60 hover:text-[#ff00ff] uppercase font-black italic">TGE Support</a>
               </div>
               <div className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-[#ff00ff] animate-pulse" />
                  <span className="text-[6px] font-black text-[#ff00ff] uppercase tracking-widest italic">Neural Synapse v1.7 Locked</span>
               </div>
            </div>
            <span className="text-[7px] text-white/10 uppercase tracking-widest italic font-black flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <span>Managed by AllTheseFlows LLC • Node v1.7</span>
                  <span className="text-white/30 border-l border-white/5 pl-4">Authored by ATF Founder 🧬</span>
               </div>
               <span className="text-[#00f0ff] animate-pulse uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-[#00f0ff]/5 border border-[#00f0ff]/20">
                  Guardian Node: BASE Network ONLY 🛡️
               </span>
            </span>
         </div>
      </div>
    </aside>
  );
}


