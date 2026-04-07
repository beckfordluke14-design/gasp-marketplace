'use client';

import { useParams, useRouter } from 'next/navigation';
import { initialProfiles } from '@/lib/profiles';
import { motion } from 'framer-motion';
import { Shield, Zap, MessageSquare, ChevronLeft, Share2, Clock, Calendar, BarChart3 } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';

export default function ArticleDetail() {
  const params = useParams();
  const router = useRouter();
  const personaId = params.personaId as string;
  const articleId = params.articleId as string;
  
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const profile = initialProfiles.find(p => p.id.toLowerCase() === personaId?.toLowerCase());

  useEffect(() => {
    async function fetchArticle() {
        try {
            // In a real scenario, this would fetch specific article details
            // For now, we fetch the persona's stream and find this ID
            const res = await fetch('/api/rpc/db', {
                method: 'POST',
                body: JSON.stringify({ action: 'get_news_by_id', payload: { articleId } })
            });
            const data = await res.json();
            if (data.success && data.article) {
                setArticle(data.article);
            } else {
                // Mock for Genesis
                setArticle({
                        id: articleId,
                        title: "SOLANA BREAKOUT: Why The Syndicate is Watching $250 Level",
                        content: `The market current reflects a massive accumulation phase. My data feeds show that institutional entries haven't even peaked yet. If you are waiting for a dip, you might be left at the station. We are entering the highest liquidity cycle of the decade. 💎🚀`,
                        image_url: '/v1.png',
                        created_at: new Date().toISOString(),
                        meta: { heat: 'Critical', category: 'High-Net-Worth Intel' }
                });
            }
        } catch (e) {
            console.error('Fetch Failed:', e);
        }
        setLoading(false);
    }
    fetchArticle();
  }, [articleId]);

  if (!profile || !article) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-outfit">
      <Header />
      
      {/* 🏙️ ARTICLE COVER */}
      <div className="relative h-[50vh] min-h-[400px] w-full mt-16 lg:mt-0">
         <Image 
           src={article.image_url || profile.image} 
           alt={article.title} 
           fill 
           className="object-cover" 
           unoptimized
         />
         <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
         
         <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-20 max-w-6xl mx-auto">
            <motion.div 
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               className="space-y-6"
            >
               <div className="flex items-center gap-4">
                  <div className="px-4 py-1.5 bg-[#00f0ff] text-black text-[10px] font-black uppercase tracking-widest rounded-full">
                     {article.meta?.category || 'Exclusive'}
                  </div>
                  <div className="h-4 w-px bg-white/20" />
                  <span className="text-[10px] font-bold text-white/60 flex items-center gap-2 uppercase tracking-widest">
                     <Clock size={12} /> 4 MIN READ
                  </span>
               </div>
               
               <h1 className="text-4xl md:text-7xl font-syncopate font-black uppercase italic tracking-tighter leading-[0.9] text-white">
                  {article.title}
               </h1>
            </motion.div>
         </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-12 md:py-20 flex flex-col lg:flex-row gap-16">
         {/* 🧬 CONTENT AREA */}
         <div className="flex-1 space-y-12">
            <div className="flex items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-3xl">
               <div className="relative w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-[#00f0ff]/40">
                  <Image src={profile.image} alt={profile.name} fill unoptimized className="object-cover" />
               </div>
               <div>
                  <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Article Shared By</p>
                  <p className="font-syncopate font-black uppercase text-sm">{profile.name}</p>
               </div>
               <button 
                  onClick={() => router.push(`/?profile=${personaId}`)}
                  className="ml-auto px-6 h-10 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#00f0ff] transition-all"
               >
                  Chat Now
               </button>
            </div>

             <div className="prose prose-invert prose-lg max-w-none">
                <p className="text-xl md:text-2xl text-white/80 leading-relaxed italic font-light">
                   {article.content}
                </p>
                
                {/* 🛡️ SOURCE VERIFICATION: Build Trust & SEO Juice */}
                {article.content_url && !article.content_url.includes('gasp.fun') && (
                   <div className="mt-12 p-6 bg-white/5 border-l-4 border-[#00f0ff] rounded-r-2xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#00f0ff] mb-2">Intelligence Source Verified</p>
                      <a 
                        href={article.content_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-white/60 hover:text-white transition-colors text-xs font-bold underline decoration-[#00f0ff]/40 underline-offset-4"
                      >
                         View Original Dispatch via {new URL(article.content_url).hostname.replace('www.', '')}
                      </a>
                   </div>
                )}
                <div className="h-20" />
             </div>

            <div className="flex items-center justify-between py-10 border-t border-white/10">
               <div className="flex items-center gap-6">
                  <button className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group">
                     <Share2 size={18} /> <span className="text-[10px] font-black uppercase">Share Intel</span>
                  </button>
                  <div className="h-6 w-px bg-white/10" />
                  <button className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group">
                     <Calendar size={18} /> <span className="text-[10px] font-black uppercase">Archive Log</span>
                  </button>
               </div>
            </div>
         </div>

         {/* 🔘 SIDEBAR CTA: Sticky Conversion Node */}
         <aside className="w-full lg:w-80 h-fit lg:sticky lg:top-32">
            <div className="p-8 bg-gradient-to-br from-[#00f0ff]/10 to-transparent border border-[#00f0ff]/20 rounded-[2.5rem] space-y-8">
               <div className="space-y-4">
                  <div className="w-16 h-1 w-16 bg-[#00f0ff] rounded-full mx-auto" />
                  <h3 className="text-xl font-syncopate font-black uppercase italic tracking-tighter text-center">Join The Syndicate</h3>
                  <p className="text-[10px] text-center text-white/40 uppercase font-bold tracking-[0.2em] leading-relaxed">
                     Get the exact entry triggers and whale alerts analyzed by {profile.name} before the retail rush.
                  </p>
               </div>

               <div className="space-y-3">
                  <button 
                    onClick={() => router.push(`/?profile=${personaId}`)}
                    className="w-full h-14 bg-white text-black rounded-2xl font-syncopate font-black uppercase italic tracking-widest text-[10px] hover:bg-[#00f0ff] transition-all shadow-[0_20px_40px_rgba(255,255,255,0.05)]"
                  >
                     Chat with {profile.name}
                  </button>
                  <button 
                    onClick={() => router.push(`/?profile=${personaId}&vault=true`)}
                    className="w-full h-14 bg-black border border-white/10 text-white rounded-2xl font-syncopate font-black uppercase italic tracking-widest text-[10px] hover:bg-white/5 transition-all"
                  >
                     Unlock Intelligence Vault
                  </button>
               </div>
            </div>
         </aside>
      </main>

      <footer className="py-20 border-t border-white/5 text-center mt-20">
         <span className="text-[10px] font-black uppercase tracking-[1em] text-white/20 italic">SYNDICATE ARTICLE ARCHIVE // 2026</span>
      </footer>
    </div>
  );
}
