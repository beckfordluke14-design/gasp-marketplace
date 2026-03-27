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
 * 🛰️ NEURAL DISCOVERY HUB v1.2
 * Objective: Drive autonomous discovery via floating, transparent persona nodes.
 */
export default function NeuralDiscoveryBubbles({ personas, onSelectPersona }: NeuralDiscoveryBubblesProps) {
  const [activePersonas, setActivePersonas] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (personas.length === 0) return;

    const pickRandom = () => {
       const shuffled = [...personas].sort(() => 0.5 - Math.random());
       setActivePersonas(shuffled.slice(0, 4)); // Show 4 at a time
    };

    pickRandom();
    const interval = setInterval(pickRandom, 8000); 
    return () => clearInterval(interval);
  }, [personas]);

  if (activePersonas.length === 0) return null;

  return (
    <motion.div 
      initial={false}
      animate={{ width: isVisible ? 120 : 48 }}
      className="fixed top-1/2 -translate-y-1/2 left-[5%] md:left-[120px] z-[800] flex flex-col items-center py-6 bg-transparent pointer-events-none"
    >
       <div className="flex flex-col items-center gap-10">
         <AnimatePresence mode="popLayout">
            {isVisible && activePersonas.map((p, idx) => {
               // SYNDICATE V10: IG-Style Story Node
               const hasUnviewed = Math.random() > 0.3; 
               return (
                 <motion.div
                   key={p.id}
                   initial={{ x: -30, opacity: 0, scale: 0.5 }}
                   animate={{ x: 0, opacity: 1, scale: 1 }}
                   exit={{ x: -30, opacity: 0, scale: 0.5 }}
                   transition={{ delay: idx * 0.1, type: 'spring', damping: 18 }}
                   className="pointer-events-auto group relative cursor-pointer"
                   onClick={() => onSelectPersona(p.id)}
                 >
                    {/* ⭕️ INSTAGRAM-STYLE STORY RING (NO GLOW) */}
                    {hasUnviewed && (
                      <div className="absolute -inset-[3px] rounded-full p-[2px] bg-gradient-to-tr from-[#ff00ff] via-[#ff6b6b] to-[#ffea00]">
                         <div className="w-full h-full rounded-full bg-black" />
                      </div>
                    )}

                    {/* THE BUBBLE NODE (FLOATING / SHADOW) */}
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-transparent bg-black shadow-[0_15px_30px_rgba(0,0,0,0.8)] relative z-10 transition-all group-hover:scale-110">
                       <PersonaAvatar src={p.image} alt={p.name} />
                    </div>

                    {/* 🟢 GREEN STATUS INDICATOR */}
                    <div className="absolute -bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-[#00ff00] border-2 border-black shadow-[0_0_10px_#00ff00] animate-pulse z-20" />

                    {/* Tooltip Label */}
                    <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
                       <span className="text-[10px] font-black uppercase text-white tracking-widest bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg">
                          {p.name.toLowerCase()}
                       </span>
                    </div>
                 </motion.div>
               );
            })}
         </AnimatePresence>
       </div>

       {/* 👁️ THE SOVEREIGN TOGGLE */}
       <button 
         onClick={() => setIsVisible(!isVisible)}
         className="mt-12 pointer-events-auto w-10 h-10 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-3xl border border-white/10 text-white/20 hover:text-[#00ff00] hover:border-[#00ff00]/40 transition-all active:scale-90 shadow-2xl"
       >
          {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
       </button>
    </motion.div>
  );
}
