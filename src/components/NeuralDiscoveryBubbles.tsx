'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import PersonaAvatar from './persona/PersonaAvatar';
import { getPersonaName } from '@/lib/profiles';
import { Eye, EyeOff } from 'lucide-react';

interface NeuralDiscoveryBubblesProps {
  personas: any[];
  onSelectPersona: (id: string) => void;
}

/**
 * 🛰️ NEURAL DISCOVERY HUB v1.0
 * Objective: Drive autonomous discovery via rotating left-side persona bubbles.
 */
export default function NeuralDiscoveryBubbles({ personas, onSelectPersona }: NeuralDiscoveryBubblesProps) {
  const [activePersonas, setActivePersonas] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (personas.length === 0) return;

    const pickRandom = () => {
       const shuffled = [...personas].sort(() => 0.5 - Math.random());
       setActivePersonas(shuffled.slice(0, 3));
    };

    pickRandom();
    const interval = setInterval(pickRandom, 8000); // 8-sec rotation cycle
    return () => clearInterval(interval);
  }, [personas]);

  if (activePersonas.length === 0) return null;

  return (
    <motion.div 
      initial={false}
      animate={{ width: isVisible ? (typeof window !== 'undefined' && window.innerWidth < 768 ? 48 : 80) : 32 }}
      className="flex flex-col items-center py-8 border-r border-white/5 bg-black/5 backdrop-blur-3xl shrink-0 overflow-hidden relative transition-all"
    >
       <div className="flex-1 flex flex-col items-center gap-8 py-4">
         <AnimatePresence mode="popLayout">
            {isVisible && activePersonas.map((p, idx) => {
               // SYNDICATE V10: Story/Discovery Pulse
               const hasUnviewed = Math.random() > 0.4; // Simulated story check
               return (
                 <motion.div
                   key={p.id}
                   initial={{ x: -20, opacity: 0, scale: 0.8 }}
                   animate={{ x: 0, opacity: 1, scale: 1 }}
                   exit={{ x: -40, opacity: 0, scale: 0.5 }}
                   transition={{ delay: idx * 0.1, type: 'spring', damping: 20 }}
                   className="pointer-events-auto group relative cursor-pointer"
                   onClick={() => onSelectPersona(p.id)}
                 >
                    {/* 🧬 STORY GLOW RING */}
                    {hasUnviewed && (
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                        className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-[#ff00ff] via-[#00f0ff] to-[#ffea00] p-[1px] opacity-100 blur-[2px] shadow-[0_0_15px_rgba(255,0,255,0.4)]"
                      />
                    )}

                    {/* THE BUBBLE NODE (NO BORDER) */}
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-black shadow-[0_10px_30px_rgba(0,0,0,1)] relative z-10 transition-all group-hover:scale-110">
                       <PersonaAvatar src={p.image} alt={p.name} />
                    </div>

                    {/* 🛰️ ONLINE DOT INDICATOR (GREEN GLOW) */}
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#00ff00] border-2 border-black shadow-[0_0_10px_#00ff00] animate-pulse z-20" />
                 </motion.div>
               );
            })}
         </AnimatePresence>
       </div>

       {/* 👁️ THE SOVEREIGN TOGGLE */}
       <button 
         onClick={() => setIsVisible(!isVisible)}
         className="mt-auto w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-white/20 hover:text-white/60 transition-all active:scale-95"
       >
          {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
       </button>
    </motion.div>
  );
}
