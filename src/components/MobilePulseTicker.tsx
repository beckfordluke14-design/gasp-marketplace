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

  return (
    <div className="fixed top-[64px] left-0 right-0 z-[100] h-10 px-4 pointer-events-none">
       <motion.div 
         onClick={(e) => {
            (e as any).stopPropagation();
            router.push(`/news/${current.persona_id}`);
         }}
         className="w-full h-full bg-black/40 backdrop-blur-3xl border-x border-b border-[#00f0ff]/20 rounded-b-2xl flex items-center justify-between px-4 pointer-events-auto active:scale-95 transition-all"
       >
          <div className="flex items-center gap-2 overflow-hidden">
             <Radio size={12} className="text-[#00f0ff] animate-pulse shrink-0" />
             <AnimatePresence mode="wait">
                <motion.span
                  key={current.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-[9px] font-black uppercase tracking-widest text-white/90 truncate italic"
                >
                   {current.title}
                </motion.span>
             </AnimatePresence>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
             <span className="text-[7px] font-black text-[#00f0ff] uppercase tracking-widest italic">{current.persona_id.split('-')[0]}</span>
             <Zap size={10} className="text-[#ffea00] animate-pulse" />
          </div>
       </motion.div>
    </div>
  );
}
