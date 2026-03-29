'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { initialProfiles } from '@/lib/profiles';

export default function MobilePulseTicker() {
  const [news, setNews] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    async function fetchLatest() {
        try {
            const res = await fetch('/api/rpc/db?action=get_latest_news&limit=3');
            const data = await res.json();
            if (data.success && data.posts.length > 0) {
                setNews(data.posts);
            } else {
                // Mocking for testing if DB is empty - Using REAL IDS
                const firstId = initialProfiles[0]?.id || 'syndicate-node';
                setNews([
                    { id: '1', persona_id: firstId, title: 'SOLANA RESISTANCE CRACKED 💎', heat: 'High' },
                    { id: '2', persona_id: firstId, title: 'BASE L2 PROTOCOL LEAK 🧬', heat: 'Critical' },
                    { id: '3', persona_id: firstId, title: 'WHALE ACCUMULATION TRACKED 📈', heat: 'Standard' }
                ]);
            }
        } catch (e) {}
    }
    fetchLatest();
  }, []);

  useEffect(() => {
    if (news.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % news.length);
    }, 4000); 
    return () => clearInterval(timer);
  }, [news]);

  if (news.length === 0) return null;

  const current = news[currentIndex];

  // 🛡️ SYNDICATE GLASS: Translucent Intelligence Node
  return (
    <div className="fixed top-[140px] left-0 right-0 z-[100] h-12 px-6 pointer-events-none">
       <motion.div 
         whileHover={{ scale: 1.02 }}
         whileTap={{ scale: 0.95 }}
         onClick={(e) => {
            (e as any).stopPropagation();
            router.push(`/news/${current.persona_id}`);
         }}
         className="w-full h-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-between px-5 pointer-events-auto relative overflow-hidden"
       >
          {/* Neural Pulse Background */}
          <motion.div 
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0 bg-gradient-to-r from-[#00f0ff]/10 via-transparent to-transparent pointer-events-none"
          />

          <div className="flex items-center gap-3 overflow-hidden relative z-10">
             <div className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse shadow-[0_0_10px_#00f0ff]" />
             <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-0.5"
                >
                   <p className="text-[7px] font-black uppercase tracking-[0.3em] text-[#00f0ff]/60 italic">Neural Intel Update // {current.persona_id.split('-')[0]}</p>
                   <span className="text-[10px] font-black uppercase tracking-tight text-white truncate italic leading-none">
                      {current.title}
                   </span>
                </motion.div>
             </AnimatePresence>
          </div>
          
          <div className="flex items-center gap-3 shrink-0 relative z-10">
             <div className="h-6 w-[1px] bg-white/10" />
             <Zap size={14} className="text-[#ffea00] animate-pulse" />
          </div>
       </motion.div>
    </div>
  );
}
