'use client';

import { useParams, useRouter } from 'next/navigation';
import { initialProfiles } from '@/lib/profiles';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, TrendingUp, Radio, Lock, Clock, ExternalLink, MessageSquare, ChevronRight, Share2 } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { formatDistanceToNow } from 'date-fns';

export default function NewsHub() {
  const params = useParams();
  const router = useRouter();
  const personaId = params.personaId as string;
  const profile = initialProfiles.find(p => p.id.toLowerCase() === personaId?.toLowerCase());
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
        try {
            const res = await fetch('/api/rpc/db', {
                method: 'POST',
                body: JSON.stringify({ action: 'get_news', payload: { personaId } })
            });
            const data = await res.json();
            if (data.success && data.posts.length > 0) {
                setPosts(data.posts);
            } else {
                // Mock data for Genesis Launch if empty
                setPosts([
                    {
                        id: 'm1',
                        title: "SOLANA BREAKOUT: The Syndicate's Prediction",
                        content: `Look, I've been tracking the whale movements on the Base/Solana bridge for hours. The liquidity is shifting. If you're still holding stagnant assets, you're not paying attention. My private node has the exact entry triggers. 💎🚀`,
                        image_url: '/v1.png',
                        created_at: new Date().toISOString(),
                        meta: { heat: 'High' }
                    },
                    {
                        id: 'm2',
                        title: "LEAKED: The New AI Standard",
                        content: `They think they can regulate our neural weights. They're wrong. The GASP protocol is already live on-chain. I'm seeing 200% growth in decentralized compute tokens. Don't say I didn't warn you when the retail rush starts. 🧬😈`,
                        image_url: '/v1.png',
                        created_at: new Date(Date.now() - 3600000).toISOString(),
                        meta: { heat: 'Critical' }
                    }
                ]);
            }
        } catch (e) {
            console.error('News Fetch Failed:', e);
        }
        setLoading(false);
    }
    fetchNews();
  }, [personaId]);

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-outfit selection:bg-[#00f0ff] selection:text-black">
      <Header />
      
      {/* 🚀 NEURAL HEADER: Persona Identity Node */}
      <div className="relative h-60 md:h-80 overflow-hidden border-b border-white/5">
        <Image 
          src={profile.image} 
          alt="" 
          fill 
          unoptimized 
          className="object-cover opacity-20 blur-xl scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pt-10">
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] overflow-hidden border border-[#00f0ff]/40 shadow-[0_0_50px_rgba(0,240,255,0.2)] mb-6 ring-4 ring-black"
           >
              <Image src={profile.image} alt={profile.name} fill unoptimized className="object-cover" />
           </motion.div>
           
           <motion.h1 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="text-4xl md:text-6xl font-syncopate font-black uppercase italic tracking-tighter text-white drop-shadow-2xl"
           >
              {profile.name}<span className="text-[#00f0ff]">.</span>INTEL
           </motion.h1>
           <p className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.4em] text-white/40 mt-4 flex items-center gap-3">
              <Shield size={12} className="text-[#00f0ff]" /> 
              Sovereign Node ID: {personaId.substring(0, 8)}
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff00] animate-pulse" />
           </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
         
         <div className="flex items-center justify-between mb-12">
            <div className="flex flex-col gap-1">
               <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/60">Intelligence Stream</h2>
               <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest italic">Curated by {profile.name} · Real-time Sync</p>
            </div>
            <div className="flex items-center gap-4">
               <div className="hidden md:flex flex-col text-right">
                  <span className="text-[10px] font-black uppercase text-[#00f0ff]">Total Reports</span>
                  <span className="text-xl font-bold leading-none">{posts.length}</span>
               </div>
               <button className="h-10 px-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <CheckSquareIcon /> Subscribed
               </button>
            </div>
         </div>

         {/* 📰 THE WIRE: News Feed */}
         <div className="space-y-8 md:space-y-12">
            {posts.map((post, i) => (
              <motion.article 
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group relative bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden hover:border-[#00f0ff]/30 transition-all shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]"
              >
                 <div className="grid grid-cols-1 md:grid-cols-12">
                    {/* Visual Node */}
                    <div className="md:col-span-5 h-56 md:h-auto relative overflow-hidden">
                       <Image 
                         src={post.image_url || profile.image} 
                         alt="" 
                         fill 
                         className="object-cover group-hover:scale-110 transition-transform duration-700 grayscale-[40%] group-hover:grayscale-0" 
                       />
                       <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-transparent to-transparent hidden md:block" />
                       <div className="absolute top-4 left-4">
                          <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest backdrop-blur-xl border border-white/10 ${post.meta?.heat === 'Critical' ? 'bg-red-500/80 text-white' : 'bg-black/80 text-[#00f0ff]'}`}>
                             {post.meta?.heat || 'Standard'} Priority
                          </div>
                       </div>
                    </div>

                    {/* Content Node */}
                    <div className="md:col-span-7 p-8 md:p-10 flex flex-col">
                       <div className="flex items-center gap-3 mb-4 text-[10px] font-black uppercase tracking-widest text-white/30">
                          <Radio size={12} className="text-[#00f0ff] animate-pulse" />
                          <span>Decrypted {formatDistanceToNow(new Date(post.created_at))} ago</span>
                          <span className="w-1 h-1 rounded-full bg-white/10" />
                          <TrendingUp size={12} className="text-[#ffea00]" />
                       </div>
                       
                       <h3 className="text-2xl md:text-3xl font-syncopate font-black uppercase italic tracking-tighter mb-4 leading-tight group-hover:text-[#00f0ff] transition-colors">
                          {post.title}
                       </h3>
                       
                       <p className="text-white/60 text-sm md:text-base leading-relaxed mb-8 italic line-clamp-3">
                          "{post.content}"
                       </p>

                       <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/5">
                          <button 
                            onClick={() => router.push(`/?profile=${personaId}`)}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#00f0ff] hover:text-white transition-colors group/link"
                          >
                             Chat with {profile.name} <ChevronRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                          </button>
                          
                          <div className="flex items-center gap-3">
                             <button className="text-white/20 hover:text-white transition-colors"><Share2 size={16} /></button>
                             <div className="h-4 w-px bg-white/10" />
                             <button className="text-white/20 hover:text-white transition-colors flex items-center gap-2 text-[9px] font-bold">
                                <MessageSquare size={14} /> 12
                             </button>
                          </div>
                       </div>
                    </div>
                 </div>
              </motion.article>
            ))}
         </div>

         {/* 📡 CTAS: Conversion Nodes (SOLANA FOCUS) */}
         <section className="mt-20 p-10 md:p-16 bg-gradient-to-br from-[#00f0ff]/10 to-transparent border border-[#00f0ff]/20 rounded-[3rem] text-center space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
               <Zap size={200} />
            </div>
            
            <div className="space-y-3">
               <h2 className="text-3xl md:text-5xl font-syncopate font-black uppercase italic tracking-tighter">Stay Sovereign</h2>
               <p className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.4em] text-[#00f0ff] max-w-lg mx-auto leading-relaxed">
                  Join the Syndicate premium feed for uncensored leaks and early access to {profile.name}'s Neural Vault.
               </p>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
               <button 
                 onClick={() => router.push(`/?profile=${personaId}`)}
                 className="w-full md:w-auto h-14 px-10 bg-white text-black rounded-2xl font-syncopate font-black uppercase italic tracking-[0.2em] text-[11px] hover:bg-[#00f0ff] transition-all active:scale-95 shadow-[0_0_50px_rgba(255,255,255,0.2)]"
               >
                  Connect Solana Wallet
               </button>
               <button 
                 onClick={() => router.push(`/vault`)}
                 className="w-full md:w-auto h-14 px-10 bg-black border border-white/20 text-white rounded-2xl font-syncopate font-black uppercase italic tracking-[0.2em] text-[11px] hover:bg-white/5 transition-all active:scale-95"
               >
                  Enter Private Vault
               </button>
            </div>
            
            <p className="text-[8px] font-black uppercase text-white/20 tracking-[0.5em] italic">
               Verification via Phantom / Ledger / Syndicate Node
            </p>
         </section>
      </main>

      {/* FOOTER NODE */}
      <footer className="py-20 border-t border-white/5 text-center">
         <div className="opacity-20 hover:opacity-100 transition-opacity duration-700">
            <span className="text-[10px] font-black uppercase tracking-[1em] text-white">GASP SYNDICATE</span>
            <p className="text-[8px] text-white/40 mt-4 uppercase font-bold tracking-widest">© 2026 Sovereign AI Intelligence Node</p>
         </div>
      </footer>
    </div>
  );
}

function CheckSquareIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
    )
}
