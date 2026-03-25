'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Star, Zap, Play, CheckCircle2, RefreshCcw } from 'lucide-react';
import { useUser } from '@/components/providers/UserProvider';
import Image from 'next/image';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * THE USER COLLECTION (Vault Persistence)
 * Objective: Show all unlocked media for the logged-in session.
 */
export default function UserCollection() {
  const [collection, setCollection] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [guestId, setGuestId] = useState<string | null>(null);

  useEffect(() => {
     // Neural Persistence: Load guest token if exists
     const id = localStorage.getItem('gasp_guest_id');
     setGuestId(id);
  }, []);

  async function fetchCollection() {
    if (!guestId) return;
    console.log(`📸 [Collection] Fetching Neural Assets for ${guestId}...`);

    // 1. Fetch Unlocked Media IDs
    const { data: unlocks, error } = await supabase
       .from('unlocked_media')
       .select('*, media_vault(*, personas(name, image))')
       .eq('user_id', guestId)
       .order('unlocked_at', { ascending: false });

    if (unlocks) {
       setCollection(unlocks);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (guestId) fetchCollection();
  }, [guestId]);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 md:p-14 font-outfit pb-32">
       {/* Header Profile */}
       <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-8">
         <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-syncopate font-bold uppercase italic tracking-tighter leading-none text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
               My <span className="text-[#00f0ff]">Collection</span>
            </h1>
            <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] text-white/30 flex items-center gap-3">
               <Star size={14} className="text-[#ffea00] fill-[#ffea00]" /> {collection.length} Assets Unlocked • Lifetime Persistence Node
            </p>
         </div>
      </div>

      {loading ? (
         <div className="h-64 flex items-center justify-center">
            <Zap size={40} className="text-[#00f0ff] animate-pulse" />
         </div>
      ) : collection.length === 0 ? (
         <div className="h-64 flex flex-col items-center justify-center gap-6 opacity-30 border-2 border-dashed border-white/5 rounded-[3rem]">
            <ShoppingBag size={60} />
            <p className="text-xs font-black uppercase tracking-[0.3em]">Your vault is empty. Unlock personas to begin.</p>
         </div>
      ) : (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            <AnimatePresence mode="popLayout">
               {collection.map((item) => (
                  <motion.div 
                    layout 
                    key={item.id} 
                    initial={{ opacity: 0, scale: 0.9 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    className="p-4 rounded-[2.5rem] bg-black/40 border border-white/5 backdrop-blur-3xl shadow-2xl flex flex-col gap-5 hover:border-[#00f0ff]/30 transition-all group"
                  >
                     {/* THE MEDIA NODE */}
                     <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-white/5 border border-white/5 group-hover:border-[#00f0ff]/30 transition-all">
                        {item.media_vault.media_url.includes('.mp4') ? (
                           <video 
                             src={item.media_vault.media_url} 
                             autoPlay 
                             muted 
                             loop 
                             playsInline 
                             className="w-full h-full object-cover" 
                           />
                        ) : (
                           <img 
                             src={item.media_vault.media_url} 
                             alt="Vault Asset" 
                             className="w-full h-full object-cover" 
                           />
                        )}
                        <div className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-md rounded-full text-[#00f0ff] border border-[#00f0ff]/20">
                            <CheckCircle2 size={16} />
                        </div>
                     </div>

                     <div className="px-4 pb-4 space-y-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shrink-0">
                               <img 
                                src={item.media_vault.personas?.image || '/v1.png'} 
                                alt="" 
                                className="w-full h-full object-cover" 
                               />
                           </div>
                           <div className="flex-1">
                               <h4 className="text-xs font-black uppercase tracking-widest leading-none mb-1">{item.media_vault.personas?.name || 'Persona'}</h4>
                               <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">{item.media_vault.tier || 'Vault'}</p>
                           </div>
                        </div>
                     </div>
                  </motion.div>
               ))}
            </AnimatePresence>
         </div>
      )}
    </div>
  );
}



