'use client';

import { motion } from 'framer-motion';
import { getBondTier } from '@/lib/economy/bondTiers';
import { Zap, HeartPulse, ShieldCheck, Flame } from 'lucide-react';

interface BondProgressProps {
  score: number;
  variant?: 'default' | 'compact';
}

/**
 * SYSTEM 3: THE 'BOND LEVEL' PROGRESSION
 * Objective: Maximize ARPU via Progression & Sunk Cost Fallacy.
 */
export default function BondProgress({ score, variant = 'default' }: BondProgressProps) {
  const currentTier = getBondTier(score);
  
  // Calculate percentage toward next tier
  const nextTier = getBondTier(score + 500); // Check for next
  const progressPercent = Math.min((score / 1500) * 100, 100);

  if (variant === 'compact') {
    return (
      <div className="space-y-1.5 w-full">
         <div className="flex items-center justify-between gap-2 px-1">
            <span className={`text-[7px] font-black uppercase tracking-widest ${currentTier.level >= 4 ? 'text-[#ff00ff]' : 'text-[#00f0ff]'}`}>
               {currentTier.label.toUpperCase()}
            </span>
            <span className="text-[7px] font-black text-white/30 uppercase tracking-widest">
               {score.toLocaleString()} BP
            </span>
         </div>
         <div className="flex gap-1 h-1 rounded-full overflow-hidden bg-white/5 p-[0.5px]">
          {[1, 2, 3, 4, 5].map((segment) => {
              const isActive = segment <= currentTier.level;
              const isLatest = segment === currentTier.level;

              return (
                <div 
                    key={segment}
                    className={`
                      flex-1 h-full rounded-full transition-all duration-700
                      ${isActive ? currentTier.color : 'bg-white/5'}
                      ${isLatest ? 'animate-pulse shadow-[0_0_8px_currentColor]' : ''}
                    `}
                />
              );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 space-y-4">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 ${currentTier.level >= 4 ? 'text-[#ff00ff]' : 'text-[#00f0ff]'}`}>
               {currentTier.level >= 4 ? <HeartPulse size={20} className="animate-pulse shadow-[0_0_10px_#ff00ff]" /> : <Zap size={20} />}
            </div>
            <div className="flex flex-col">
               <span className="text-[11px] font-black uppercase text-white tracking-widest leading-none">
                  Bond Score: {score.toLocaleString()}
               </span>
               <span className={`text-[8px] font-black uppercase tracking-[0.2em] mt-1.5 ${currentTier.level >= 4 ? 'text-[#ff00ff]' : 'text-[#00f0ff]'}`}>
                  Gasp Sync: {currentTier.label.toUpperCase()}
               </span>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <ShieldCheck size={12} className="text-[#00f0ff] opacity-40" />
            <span className="text-[8px] font-black uppercase tracking-[0.25em] text-white/20">Active Discovery</span>
         </div>
      </div>

      {/* Segmented Progress Bar */}
      <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-white/5 p-0.5">
         {[1, 2, 3, 4, 5].map((segment) => {
            const isActive = segment <= currentTier.level;
            const isLatest = segment === currentTier.level;

            return (
               <div 
                  key={segment}
                  className={`
                    flex-1 h-full rounded-full transition-all duration-700
                    ${isActive ? currentTier.color : 'bg-white/5'}
                    ${isLatest ? 'animate-pulse' : ''}
                  `}
               />
            );
         })}
      </div>

      <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-white/20">
          <span>Discovery</span>
          <div className="flex items-center gap-2">
             <Flame size={10} className="text-[#ff00ff]" />
             <span>Near Possession</span>
          </div>
      </div>
    </div>
  );
}



