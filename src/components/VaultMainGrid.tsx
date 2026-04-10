'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/components/providers/UserProvider';
import { Lock, ShoppingBag, ZoomIn } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { proxyImg } from '@/lib/profiles';
import VaultLightbox from '@/components/VaultLightbox';

export default function VaultMainGrid() {
  const { user } = useUser();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    const sessionId = user?.id || (typeof window !== 'undefined' ? localStorage.getItem('gasp_guest_id') : '');
    if (!sessionId) {
        setLoading(false);
        return;
    }

    const fetchCollection = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/vault?userId=${sessionId}&t=${Date.now()}`);
        const json = await res.json();
        if (json.success) setItems(json.items || []);
      } catch (e) {
        console.error('[Vault Fetch Failure]:', e);
      }
      setLoading(false);
    };

    fetchCollection();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-2 border-[#ff00ff] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_#ff00ff44]" />
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#ff00ff] animate-pulse">Decrypting Access...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-6 px-4">
        <div className="w-20 h-20 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center">
            <ShoppingBag size={32} className="text-white/10" />
        </div>
        <div>
           <h2 className="text-xl font-black uppercase italic tracking-tight">Vault Idle</h2>
           <p className="text-white/30 text-[9px] uppercase tracking-widest mt-2 leading-relaxed">You haven't unlocked any archival data yet.</p>
        </div>
        <Link href="/" className="px-6 py-3 bg-white/5 border border-white/10 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-white hover:text-black transition-all">
            Return to Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
        {items.map((item, idx) => (
          <motion.div 
            key={item.id} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => setSelectedIndex(idx)}
            className="relative aspect-[3/4] rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 bg-white/5 group cursor-pointer shadow-2xl"
          >
            <Image 
              src={proxyImg(item.content_url)} 
              alt="" 
              fill 
              unoptimized 
              className="object-cover group-hover:scale-110 transition-transform duration-700" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
            
            <div className="absolute top-3 right-3 z-20">
                <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/40 group-hover:text-white transition-all opacity-0 group-hover:opacity-100">
                    <ZoomIn size={14} />
                </div>
            </div>

            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
                <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full overflow-hidden border border-white/20">
                        <img src={item.personas?.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[8px] font-black uppercase italic text-white truncate max-w-[60px]">{item.personas?.name}</span>
                </div>
                <div className="px-2 py-0.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/10">
                    <span className="text-[6px] font-black uppercase text-[#ffea00] tracking-widest italic">Unlocked</span>
                </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedIndex !== null && (
          <VaultLightbox 
            items={items}
            initialIndex={selectedIndex}
            onClose={() => setSelectedIndex(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
