'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/components/providers/UserProvider';
import { Lock, Heart, ArrowLeft, Grid, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function VaultCollection() {
  const { user } = useUser();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // SYNDICATE V2.0: HYBRID PERSISTENCE (Guest + User)
    const sessionId = user?.id || (typeof window !== 'undefined' ? localStorage.getItem('gasp_guest_id') : '');
    if (!sessionId) return;

    const fetchCollection = async () => {
      setLoading(true);
      try {
        console.log(`🔓 [Vault] Decrypting collection for: ${sessionId}`);
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

  return (
    <div className="min-h-screen bg-black text-white font-outfit">
      {/* Header */}
      <div className="fixed top-0 inset-x-0 z-50 bg-black/60 backdrop-blur-3xl border-b border-white/5 p-6 flex items-center justify-between">
         <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#ff00ff]/10 transition-all">
                <ArrowLeft size={18} />
            </div>
            <span className="text-sm font-black uppercase tracking-widest italic">Back to Feed</span>
         </Link>
         <div className="flex flex-col items-center">
            <h1 className="text-xl font-syncopate font-black uppercase italic tracking-tighter">Your Collection</h1>
            <p className="text-[8px] text-[#ffea00] font-bold uppercase tracking-[0.3em] mt-1 italic">Private Vault Inventory</p>
         </div>
         <div className="w-24" /> {/* Spacer */}
      </div>

      <div className="pt-32 pb-24 px-6 max-w-6xl mx-auto">
        {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <div className="w-12 h-12 border-2 border-[#ff00ff] border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-[#ff00ff]">Decrypting Vault...</p>
            </div>
        ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-6">
                <div className="w-24 h-24 rounded-[3rem] bg-white/5 flex items-center justify-center">
                    <ShoppingBag size={40} className="text-white/10" />
                </div>
                <div>
                   <h2 className="text-2xl font-black uppercase italic tracking-tight">Vault is Empty</h2>
                   <p className="text-white/40 text-[10px] uppercase tracking-widest mt-2">Purchase exclusive content in chat to see it here.</p>
                </div>
                <Link href="/" className="px-8 py-4 bg-[#ff00ff] text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all">
                    Browse Marketplace
                </Link>
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {items.map((item) => (
                    <div key={item.id} className="relative aspect-[3/4] rounded-3xl overflow-hidden border border-white/10 bg-white/5 group">
                        <Image src={item.content_url} alt="" fill unoptimized className="object-cover group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                        
                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20">
                                    <img src={item.personas?.image} alt="" className="w-full h-full object-cover" />
                                </div>
                                <span className="text-[10px] font-black uppercase italic text-white">{item.personas?.name}</span>
                            </div>
                            <div className="px-2 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-white/10">
                                <span className="text-[8px] font-black uppercase text-[#ffea00] tracking-widest">Unlocked</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}



