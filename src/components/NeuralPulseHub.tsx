'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Zap, ChevronRight, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { initialProfiles } from '@/lib/profiles';

interface NeuralPulseHubProps {
  followingIds?: string[];
  profiles?: any[];
  unreadCounts?: Record<string, number>;
  onSelectProfile?: (id: string, initialMsg?: string, profileObj?: any) => void;
}

export default function NeuralPulseHub({ followingIds, profiles, unreadCounts, onSelectProfile }: NeuralPulseHubProps) {
  const [news, setNews] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    async function fetchLatest() {
        try {
            const res = await fetch('/api/rpc/db', {
                method: 'POST',
                body: JSON.stringify({ action: 'get_latest_news', payload: { limit: 5 } })
            });
            const data = await res.json();
            if (data.success && data.posts.length > 0) {
                setNews(data.posts);
            } else {
                // Mocking for testing if DB is empty - Using REAL IDs from initialProfiles
                const firstId = initialProfiles[0]?.id || 'syndicate-node';
                setNews([
                    { id: '1', persona_id: firstId, title: 'ALPHA NODE BREACH: SECTOR 07 // HIGH-HEAT', heat: 'High' },
                    { id: '2', persona_id: firstId, title: 'SECURE DATA UPLINK: CLASSIFIED BROADCAST LEAK', heat: 'Critical' },
                    { id: '3', persona_id: firstId, title: 'TARGET NODE ACTIVITY SPIKE: REGION 12', heat: 'Standard' }
                ]);
            }
        } catch (e) {
            console.error('Pulse Fetch Failure:', e);
        }
    }
    fetchLatest();
    const inv = setInterval(fetchLatest, 30000); // 30s updates
    return () => clearInterval(inv);
  }, []);

  useEffect(() => {
    if (news.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % news.length);
    }, 5000); // Cycle every 5s
    return () => clearInterval(timer);
  }, [news]);

  if (news.length === 0) return null;

  const current = news[currentIndex];

  return (
    <div className="px-4 mb-8">
      <div className="bg-gradient-to-br from-[#00f0ff]/10 to-transparent border border-[#00f0ff]/20 rounded-2xl p-4 relative overflow-hidden group cursor-pointer" onClick={() => router.push(`/news/${current.persona_id}`)}>
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:rotate-12 transition-transform">
           <Zap size={40} className="text-[#00f0ff]" />
        </div>
        
        <div className="flex items-center gap-2 mb-3">
           <Radio size={10} className="text-[#00f0ff] animate-pulse" />
           <span className="text-[8px] font-black uppercase tracking-[0.3em] text-[#00f0ff] italic">Market Pulse</span>
        </div>

        <AnimatePresence mode="wait">
           <motion.div
             key={current.id}
             initial={{ opacity: 0, x: 10 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: -10 }}
             className="space-y-2"
           >
              <h4 className="text-[11px] font-syncopate font-black uppercase italic leading-tight text-white line-clamp-2">
                 {current.title}
              </h4>
              <div className="flex items-center justify-between mt-3">
                 <span className="text-[7px] font-black uppercase tracking-widest text-white/30 truncate max-w-[100px]">Verified: {current.persona_id}</span>
                 <div className="flex items-center gap-1 text-[7px] font-black uppercase text-[#ffea00] italic">
                    Source: Intel <ChevronRight size={8} />
                 </div>
              </div>
           </motion.div>
        </AnimatePresence>

        <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
           <motion.div 
             key={currentIndex}
             initial={{ width: 0 }}
             animate={{ width: "100%" }}
             transition={{ duration: 5, ease: "linear" }}
             className="h-full bg-[#00f0ff]" 
           />
        </div>
      </div>
    </div>
  );
}
