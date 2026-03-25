'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, ShieldAlert, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface BurnerMessageProps {
  id: string;
  thumbnailUrl: string;
  fullUrl: string;
  price: number;
  onUnlock: (id: string, price: number) => Promise<boolean>;
  onBurned?: () => void;
}

/**
 * SYSTEM 1: THE 'BURNER MESSAGE' (Ephemeral Scarcity)
 * Objective: High-velocity coin spending through FOMO.
 */
export default function BurnerMessage({ id, thumbnailUrl, fullUrl, price, onUnlock, onBurned }: BurnerMessageProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isBurning, setIsBurning] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isDestroyed, setIsDestroyed] = useState(false);

  const handleUnlock = async () => {
    if (isUnlocked || isBurning || isDestroyed) return;
    
    // SECURITY: Transactional Check (Supabase RPC)
    const success = await onUnlock(id, price);
    if (success) {
      setIsUnlocked(true);
      setIsBurning(true);
    }
  };

  useEffect(() => {
    if (isBurning && countdown > 0) {
      const timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (isBurning && countdown === 0) {
      setIsBurning(false);
      setIsDestroyed(true);
      if (onBurned) onBurned();
    }
  }, [isBurning, countdown, onBurned]);

  if (isDestroyed) {
    return (
      <div className="relative w-full aspect-square rounded-[2rem] overflow-hidden bg-[#000000] border border-white/5 flex flex-col items-center justify-center gap-2 group transition-all duration-700 select-none">
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />
          <ShieldAlert size={28} className="text-white/10 group-hover:text-[#ff00ff] transition-all" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">media destroyed</span>
          <div className="absolute bottom-6 flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
             <Sparkles size={10} className="text-[#ff00ff]" />
             <span className="text-[8px] font-bold uppercase tracking-widest text-white/40">sunk cost active</span>
          </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-square rounded-[2rem] overflow-hidden bg-[#000000] border border-white/10 group shadow-2xl">
      {/* Background Stale Thumbnail (Heavily Blurred) */}
      <Image 
        src={thumbnailUrl} 
        alt="" 
        fill 
        unoptimized 
        className={`object-cover blur-3xl opacity-20 transition-all duration-1000 ${isUnlocked ? 'scale-110' : 'scale-100'}`} 
      />

      {/* OLED LOCK OVERLAY */}
      {!isUnlocked && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-10 text-center backdrop-blur-3xl bg-[#000000]/80 group-hover:bg-[#000000]/70 transition-all">
           <div className="mb-6 w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center opacity-40 group-hover:opacity-100 transition-all group-hover:scale-110">
              <Coins size={32} className="text-[#ff00ff] drop-shadow-[0_0_10px_#ff00ff]" />
           </div>
           
           <h4 className="text-[14px] font-black uppercase tracking-[0.2em] text-[#ff00ff] mb-2 drop-shadow-[0_0_5px_rgba(255,0,255,0.4)]">
              view-once scarcity
           </h4>
           <p className="text-[9px] text-white/30 leading-relaxed max-w-[180px] mb-8 lowercase font-medium italic">
              self-destructs in 5 seconds. <br/> no screenshots. no trace.
           </p>
           
           <button 
              onClick={handleUnlock}
              className="w-full py-4 bg-[#ff00ff] text-black font-black text-[11px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_40px_rgba(255,0,255,0.6)]"
           >
              <Zap size={16} fill="black" className="animate-pulse" />
              view once: {price} coins
           </button>
        </div>
      )}

      {/* FULL RESOLUTION MEDIA (Only mounted on unlock) */}
      {isUnlocked && !isDestroyed && (
        <>
            <motion.div
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-0"
            >
                <Image 
                  src={fullUrl} 
                  alt="" 
                  fill 
                  unoptimized 
                  className="object-cover" 
                />
            </motion.div>

            {/* Pulsing Timer Overlay */}
            <AnimatePresence mode="popLayout">
                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none bg-black/20">
                    <motion.span 
                        key={countdown}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                        exit={{ scale: 2, opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-[140px] font-syncopate font-black text-white drop-shadow-[0_0_50px_rgba(0,0,0,1)] select-none italic"
                    >
                        {countdown}
                    </motion.span>
                </div>
            </AnimatePresence>
            
            <div className="absolute top-6 left-6 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/20">
               <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
               <span className="text-[8px] font-black uppercase tracking-widest text-white">Burning...</span>
            </div>
        </>
      )}
    </div>
  );
}

function Zap({ size, fill, className }: { size: number, fill?: string, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill={fill || "none"} 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}



