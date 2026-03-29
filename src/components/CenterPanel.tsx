'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { initialProfiles, type Profile } from '@/lib/profiles';
import FeedItem from './FeedItem';

interface CenterPanelProps {
  selectedProfileId: string;
}

export default function CenterPanel({ selectedProfileId }: CenterPanelProps) {
  const selectedProfile = initialProfiles.find(p => p.id === selectedProfileId) || initialProfiles[0] || {} as any;
  const broadcasts = selectedProfile.broadcasts || [];

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar bg-[#000000] scroll-smooth pt-32 h-screen pb-40">
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedProfile.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          layoutId={`feed-${selectedProfile.id}`}
          className="container max-w-2xl mx-auto px-6"
        >
          {/* Section Header */}
          <div className="flex flex-col gap-4 mb-20 px-4">
             <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#00f0ff] opacity-60">Active Uplink Established // Syndicate Node</span>
             </div>
             <h1 className="text-4xl md:text-5xl font-syncopate font-black italic uppercase tracking-tighter leading-none text-white transition-all drop-shadow-2xl">
                {selectedProfile.name} <span className="text-[#00f0ff]">Intelligence</span> Feed
              </h1>
          </div>

          {/* Broadcasts Feed */}
          <div className="flex flex-col">
            {broadcasts.length > 0 ? (
              broadcasts.map((b: any) => (
                <FeedItem key={b.id} profile={selectedProfile} broadcast={b} />
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
