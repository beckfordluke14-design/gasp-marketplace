'use client';

import { useEffect, useState } from 'react';
import { Shield, Trash2, Zap, Radio, TrendingUp, ExternalLink, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { initialProfiles } from '@/lib/profiles';

export default function AdminPosts() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sniping, setSniping] = useState(false);

  async function fetchPosts() {
    try {
        const res = await fetch('/api/rpc/db', {
            method: 'POST',
            body: JSON.stringify({ action: 'get_latest_news', payload: { limit: 50 } })
        });
        const data = await res.json();
        if (data.success) setPosts(data.posts);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { fetchPosts(); }, []);

  const triggerSnipe = async () => {
    setSniping(true);
    try {
        await fetch('/api/news/curate');
        await fetchPosts();
    } catch (e) {}
    setSniping(false);
  };

  const deletePost = async (id: number) => {
    if (!confirm('Vaporize this intel?')) return;
    try {
        await fetch('/api/rpc/db', {
            method: 'POST',
            body: JSON.stringify({ action: 'delete_news', payload: { id } })
        });
        fetchPosts();
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-outfit">
      
      {/* 🚀 ADMIN HEADER */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
         <div className="flex items-center gap-4">
            <div className="p-3 bg-[#00f0ff]/10 rounded-2xl border border-[#00f0ff]/20 text-[#00f0ff]">
               <Shield size={32} />
            </div>
            <div>
               <h1 className="text-3xl font-black uppercase italic tracking-tighter">Syndicate Intelligence Feed</h1>
               <p className="text-[10px] text-white/30 uppercase tracking-widest font-black">Manage automated persona blogs & neural leaks</p>
            </div>
         </div>
         
         <button 
           onClick={triggerSnipe}
           disabled={sniping}
           className="h-14 px-10 bg-[#00f0ff] text-black rounded-2xl font-syncopate font-black uppercase italic tracking-widest text-[11px] shadow-[0_0_50px_rgba(0,240,255,0.2)] hover:bg-white transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
         >
            {sniping ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />}
            {sniping ? 'Sniping Real-time Intel...' : 'Force Curate (Real-time)'}
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {posts.map((post) => {
            const profile = initialProfiles.find(p => p.id === post.persona_id);
            return (
               <div key={post.id} className="bg-white/5 border border-white/5 rounded-[2rem] p-6 group hover:border-[#00f0ff]/30 transition-all flex flex-col relative overflow-hidden">
                  
                  {/* Persona Indicator */}
                  <div className="flex items-center gap-3 mb-6">
                     <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 relative">
                        <Image src={profile?.image || '/v1.png'} alt="" fill className="object-cover" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#00f0ff]">{profile?.name || post.persona_id}</p>
                        <p className="text-[8px] text-white/20 uppercase font-bold italic">Node ID: {post.persona_id.substring(0,8)}</p>
                     </div>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                     <Radio size={10} className="text-[#00f0ff] animate-pulse" />
                     <span className="text-[8px] font-black uppercase tracking-widest text-white/30 italic">Heat: {post.meta?.heat || 'Standard'}</span>
                  </div>

                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-white mb-4 line-clamp-2">{post.title}</h3>
                  <p className="text-[12px] text-white/40 italic leading-relaxed mb-8 line-clamp-4">"{post.content}"</p>

                  <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/5">
                     <a href={post.source_url} target="_blank" className="text-white/20 hover:text-white transition-colors">
                        <ExternalLink size={16} />
                     </a>
                     <button 
                       onClick={() => deletePost(post.id)}
                       className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 transition-all hover:text-white"
                     >
                        <Trash2 size={16} />
                     </button>
                  </div>

               </div>
            );
         })}
      </div>

      {posts.length === 0 && !loading && (
        <div className="py-20 text-center space-y-4 max-w-sm mx-auto opacity-30">
           <Radio size={48} className="mx-auto text-white/20" />
           <p className="text-[10px] font-black uppercase tracking-widest">Feed is Zero-State. Click "Force Curate" to snipe the first world intel.</p>
        </div>
      )}

    </div>
  );
}
