'use client';

/**
 * COUNTDOWN TIMER & STATUS
 * Shows recent activity and limited spots for private content.
 */

import { useEffect, useState } from 'react';
import { Lock, Zap, Clock, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VaultScarcityProps {
  personaName: string;
  price?: number;
  onUnlock?: () => void;
  compact?: boolean; 
}

const SCARCITY_MESSAGES = [
  (name: string) => `${name}'s private collection access is limited`,
  (name: string) => `${Math.floor(Math.random() * 8) + 3} people viewed this recently`,
  (_: string) => `Limited access — only a few spots left at this price`,
  (name: string) => `A user just unlocked ${name}'s private content`,
  (_: string) => `This content will be harder to access soon`,
  (name: string) => `Access to this content is limited`,
];

export default function VaultScarcity({ personaName, price = 150, onUnlock, compact = false }: VaultScarcityProps) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(() => Math.floor(Math.random() * 600) + 900); // 15-25 min countdown
  const [recentUnlocks] = useState(() => Math.floor(Math.random() * 12) + 3);
  const [spotsLeft] = useState(() => Math.floor(Math.random() * 7) + 2);

  // Rotate scarcity message every 6s
  useEffect(() => {
    const t = setInterval(() => {
      setMsgIndex(i => (i + 1) % SCARCITY_MESSAGES.length);
    }, 6000);
    return () => clearInterval(t);
  }, []);

  // Countdown
  useEffect(() => {
    const t = setInterval(() => {
      setSecondsLeft(s => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const mins = Math.floor(secondsLeft / 60);
  const secs = String(secondsLeft % 60).padStart(2, '0');
  const currentMsg = SCARCITY_MESSAGES[msgIndex](personaName);

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#ff00ff]/10 border border-[#ff00ff]/20 rounded-xl">
        <Clock size={10} className="text-[#ff00ff] shrink-0" />
        <span className="text-[8px] font-black uppercase tracking-widest text-[#ff00ff]">
          {mins}:{secs} left at this price
        </span>
        <span className="ml-auto text-[8px] text-white/30 font-black">{spotsLeft} spots</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 w-full">
      {/* Scarcity message rotator */}
      <AnimatePresence mode="wait">
        <motion.div
          key={msgIndex}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="flex items-center gap-2"
        >
          <TrendingUp size={11} className="text-[#ffea00] shrink-0" />
          <span className="text-[9px] font-black uppercase tracking-widest text-white/50">
            {currentMsg}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* Stats row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          <span className="text-[8px] font-black uppercase tracking-widest text-red-400">
            {recentUnlocks} unlocked today
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#ffea00]/10 border border-[#ffea00]/20 rounded-lg">
          <Clock size={9} className="text-[#ffea00]" />
          <span className="text-[8px] font-black uppercase tracking-widest text-[#ffea00]">
            {mins}:{secs}
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#ff00ff]/10 border border-[#ff00ff]/20 rounded-lg">
          <span className="text-[8px] font-black uppercase tracking-widest text-[#ff00ff]">
            {spotsLeft} spots left
          </span>
        </div>
      </div>

      {/* CTA BUTTON */}
      {onUnlock && (
        <button
          onClick={onUnlock}
          className="w-full py-4 bg-gradient-to-r from-[#ff00ff] to-[#ff4488] text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-[0_0_40px_rgba(255,0,255,0.35)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <Lock size={14} />
          Unlock Now · {price} BP
          <Zap size={14} />
        </button>
      )}
    </div>
  );
}


