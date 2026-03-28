'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import ProfileAvatar from './profile/ProfileAvatar';
import { getProfileName } from '@/lib/profiles';
import { Eye, EyeOff } from 'lucide-react';

interface NeuralDiscoveryBubblesProps {
  profiles: any[];
  onSelectProfile: (id: string) => void;
}

/**
 * DISCOVERY FEED v1.2
 * Objective: Drive autonomous discovery via floating profile avatars.
 */
export default function NeuralDiscoveryBubbles({ profiles, onSelectProfile }: NeuralDiscoveryBubblesProps) {
  const [activeProfiles, setActiveProfiles] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (profiles.length === 0) return;

    const refreshDiscovery = () => {
       const shuffled = [...profiles].sort(() => 0.5 - Math.random());
       setActiveProfiles(shuffled.slice(0, 4)); // Show 4 at a time
    };

    refreshDiscovery();
    const interval = setInterval(refreshDiscovery, 8000); 
    return () => clearInterval(interval);
  }, [profiles]);

  if (activeProfiles.length === 0) return null;

  return (
    <motion.div 
      initial={false}
      animate={{ width: isVisible ? 120 : 48 }}
      className="fixed top-1/2 -translate-y-1/2 left-[5%] md:left-[120px] z-[800] flex flex-col items-center py-6 bg-transparent pointer-events-none"
    >
       <div className="flex flex-col items-center gap-10">
         <AnimatePresence mode="popLayout">
            {isVisible && activeProfiles.map((p, idx) => {
               const hasUnviewed = Math.random() > 0.3; 
               return (
                 <motion.div
                   key={p.id}
                   initial={{ x: -30, opacity: 0, scale: 0.5 }}
                   animate={{ x: 0, opacity: 1, scale: 1 }}
                   exit={{ x: -30, opacity: 0, scale: 0.5 }}
                   transition={{ delay: idx * 0.1, type: 'spring', damping: 18 }}
                   className="pointer-events-auto group relative cursor-pointer"
                   onClick={() => onSelectProfile(p.id)}
                 >
                    {/* Story Ring */}
                    {hasUnviewed && (
                      <div className="absolute -inset-[3px] rounded-full p-[2px] bg-gradient-to-tr from-[#ff00ff] via-[#ff6b6b] to-[#ffea00]">
                         <div className="w-full h-full rounded-full bg-black" />
                      </div>
                    )}

                    {/* Avatar Bubble */}
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-transparent bg-black shadow-[0_15px_30px_rgba(0,0,0,0.8)] relative z-10 transition-all group-hover:scale-110">
                       <ProfileAvatar src={p.image} alt={p.name} />
                    </div>

                    {/* Status Indicator */}
                    <div className="absolute -bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-[#00ff00] border-2 border-black shadow-[0_0_10px_#00ff00] animate-pulse z-20" />

                    {/* Label */}
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

       {/* View Toggle */}
       <button 
         onClick={() => setIsVisible(!isVisible)}
         className="mt-12 pointer-events-auto w-10 h-10 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-3xl border border-white/10 text-white/20 hover:text-[#00ff00] hover:border-[#00ff00]/40 transition-all active:scale-90 shadow-2xl"
       >
          {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
       </button>
    </motion.div>
  );
}
