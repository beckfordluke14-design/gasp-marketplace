'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { proxyImg } from '@/lib/profiles';
import { LayoutGrid, Zap, Lock, Eye, Trash2 } from 'lucide-react';
import Header from '@/components/Header';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);

interface PersonaSummary {
  id: string;
  name: string;
  seed_image_url: string;
  is_active: boolean;
  vaults: { content_url: string }[];
}

export default function RosterGallery() {
  const [roster, setRoster] = useState<PersonaSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoster();
  }, []);

  async function fetchRoster() {
    console.log('🏁 Fetching Master Roster Gallery...');
    const { data: personas } = await supabase.from('personas').select('id, name, seed_image_url, is_active').order('name');
    
    if (personas) {
      const fullRoster = await Promise.all(personas.map(async (p) => {
          const { data: posts } = await supabase.from('posts').select('content_url').eq('persona_id', p.id).eq('is_vault', true).limit(5);
          return { ...p, vaults: posts || [] };
      }));
      setRoster(fullRoster);
    }
    setLoading(false);
  }

  if (loading) return <div className="h-screen bg-black flex items-center justify-center"><Zap size={40} className="text-[#ffea00] animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-black text-white font-outfit">
      <Header />
      
      <div className="pt-32 px-6 pb-20 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
            <div>
                <h1 className="text-4xl font-syncopate font-black italic uppercase tracking-tighter">Neural Roster Gallery</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mt-2">Visual Audit: 1 Main + Vault Assets</p>
            </div>
            <div className="flex gap-4">
               <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center">
                  <span className="text-[18px] font-black">{roster.length}</span>
                  <span className="text-[8px] font-black uppercase text-white/40">Total Nodes</span>
               </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {roster.map((p, idx) => (
                <motion.div 
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className={`p-6 bg-zinc-900/40 border rounded-[3rem] backdrop-blur-3xl flex flex-col gap-6 group transition-all ${p.seed_image_url.includes('supabase') || p.seed_image_url.includes('permanent_x') || p.seed_image_url.includes('master_') ? 'border-white/5 hover:border-green-500/20 shadow-2xl shadow-green-500/5' : 'border-red-500/20 grayscale shadow-2xl shadow-red-500/10'}`}
                >
                    {/* Main Identity */}
                    <div className="flex gap-6 items-start">
                        <div className={`w-32 h-44 rounded-3xl overflow-hidden border-2 shrink-0 bg-black relative shadow-2xl ${p.seed_image_url.includes('supabase') || p.seed_image_url.includes('permanent_x') || p.seed_image_url.includes('master_') ? 'border-[#ffea00]/20' : 'border-red-500/40 opacity-40'}`}>
                             <img 
                                src={proxyImg(p.seed_image_url)} 
                                className="w-full h-full object-cover transition-all duration-1000"
                                onError={(e: any) => e.target.src = '/gasp_white.png'}
                            />
                            {!(p.seed_image_url.includes('supabase') || p.seed_image_url.includes('permanent_x') || p.seed_image_url.includes('master_')) && (
                                <div className="absolute inset-0 bg-red-500/20 flex flex-col items-center justify-center text-center p-2 backdrop-blur-sm animate-pulse">
                                    <span className="text-[10px] font-black uppercase text-red-500 bg-black/80 px-4 py-2 rounded-full ring-2 ring-red-500 shadow-[0_0_20px_rgba(185,28,28,0.5)]">Ghost Node</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 space-y-3">
                            <h3 className={`text-xl font-bold uppercase tracking-tighter transition-colors ${p.seed_image_url.includes('supabase') || p.seed_image_url.includes('permanent_x') || p.seed_image_url.includes('master_') ? 'text-white group-hover:text-[#ffea00]' : 'text-red-500/60'}`}>{p.name || 'Anonymous'}</h3>
                            <p className="text-[10px] font-mono text-white/40 uppercase truncate bg-black/40 p-2 rounded-xl border border-white/5">{p.id}</p>
                            <div className="flex gap-2">
                                {p.is_active ? <span className="px-2 py-1 rounded-lg bg-green-500/10 text-green-500 text-[8px] font-black uppercase">Active</span> : <span className="px-2 py-1 rounded-lg bg-white/5 text-white/20 text-[8px] font-black uppercase">Retired</span>}
                                {!(p.seed_image_url.includes('supabase') || p.seed_image_url.includes('permanent_x') || p.seed_image_url.includes('master_')) && <span className="px-2 py-1 rounded-lg bg-red-500/10 text-red-500 text-[8px] font-black uppercase animate-pulse">EXPIRED xAI Link</span>}
                            </div>
                        </div>
                    </div>

                    {/* Vault Thumbnails */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-[10px] font-black uppercase text-white/40 tracking-widest flex items-center gap-2"><Lock size={12}/> Vault Assets</span>
                            <span className="text-[10px] text-white/20">{p.vaults.length} items</span>
                        </div>
                        <div className="grid grid-cols-4 gap-3 bg-black/40 p-3 rounded-[2rem] border border-white/5 h-20 overflow-hidden">
                            {p.vaults.map((v, i) => (
                                <div key={i} className="aspect-square rounded-xl bg-zinc-800 overflow-hidden border border-white/5">
                                    <img src={proxyImg(v.content_url)} className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity" />
                                </div>
                            ))}
                            {p.vaults.length === 0 && <div className="col-span-4 h-full flex items-center justify-center opacity-10"><Eye size={20}/></div>}
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
      </div>
    </div>
  );
}



