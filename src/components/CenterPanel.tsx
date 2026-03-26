'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { initialPersonas, type Persona } from '@/lib/profiles';
import FeedItem from './FeedItem';

interface CenterPanelProps {
  selectedPersonaId: string;
}

export default function CenterPanel({ selectedPersonaId }: CenterPanelProps) {
  const selectedPersona = initialPersonas.find(p => p.id === selectedPersonaId) || initialPersonas[0] || {} as any;
  const broadcasts = selectedPersona.broadcasts || [];

  return (
    <div className="flex-1 h-screen overflow-y-auto no-scrollbar bg-[#000000] scroll-smooth pt-32 h-screen pb-40">
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedPersona.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          layoutId={`feed-${selectedPersona.id}`}
          className="container max-w-2xl mx-auto px-6"
        >
          {/* Section Header */}
          <div className="flex flex-col gap-4 mb-20 px-4">
             <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">node link established</span>
             </div>
             <h3 className="text-4xl md:text-5xl font-outfit font-black italic uppercase italic tracking-tighter leading-none text-white transition-all">
                {selectedPersona.name} <span className="text-[#FF007F]">Reality</span> Feed
             </h3>
          </div>

          {/* Broadcasts Feed */}
          <div className="flex flex-col">
            {broadcasts.length > 0 ? (
              broadcasts.map((b) => (
                <FeedItem key={b.id} persona={selectedPersona} broadcast={b} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center pt-20 text-center gap-6">
                <div className="w-1.5 h-1.5 bg-white/20 rounded-full animate-pulse" />
                <p className="text-xs font-black uppercase tracking-widest text-white/20">waiting for neural sync...</p>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}



