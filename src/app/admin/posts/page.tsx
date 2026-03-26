'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Pencil, Trash2, Star, Lock, Unlock, X, 
  Search, Filter, RefreshCw, LayoutGrid, Check, 
  EyeOff, Copy, AlertCircle, Video as VideoIcon, Image as ImageIcon,
  RotateCcw
} from 'lucide-react';
import { proxyImg } from '@/lib/profiles';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PersonaPost {
    id: string;
    persona_id: string;
    content_url: string;
    content_type: string;
    is_vault: boolean;
    is_burner: boolean;
    caption: string;
    created_at: string;
    personas?: {
        name: string;
    };
}

export default function PostStudio() {
    const [posts, setPosts] = useState<PersonaPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [syncing, setSyncing] = useState<string | null>(null);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('posts')
            .select('*, personas(name)')
            .order('created_at', { ascending: false });
        
        if (!error) setPosts(data || []);
        setLoading(false);
    };

    const toggleVaultStatus = async (postId: string, current: boolean) => {
        setSyncing(postId);
        try {
            // 🛡️ EXCLUSIVITY PROTOCOL: Vault assets CANNOT be Hero/Feed posts.
            // If setting to Vault (True), we force is_featured to False.
            const nextValue = !current;
            const res = await fetch('/api/admin/audit', {
                method: 'POST',
                body: JSON.stringify({ 
                    action: 'update-post', 
                    payload: { 
                        id: postId, 
                        is_vault: nextValue,
                        is_featured: nextValue ? false : undefined // Force Hero OFF if Vault ON
                    } 
                })
            });
            const data = await res.json();
            if (data.success) {
                setPosts(prev => prev.map(p => p.id === postId ? { 
                    ...p, 
                    is_vault: nextValue,
                    is_burner: nextValue ? false : p.is_burner 
                } : p));
            }
        } catch(e) { console.error(e); }
        setSyncing(null);
    };

    const toggleHeroStatus = async (postId: string, current: boolean) => {
        setSyncing(postId);
        try {
            // 🛡️ EXCLUSIVITY PROTOCOL: Hero/Feed assets CANNOT be in the Vault.
            // If setting to Hero (True), we force is_vault to False.
            const nextValue = !current;
            const res = await fetch('/api/admin/audit', {
                method: 'POST',
                body: JSON.stringify({ 
                    action: 'update-post', 
                    payload: { 
                        id: postId, 
                        is_burner: nextValue, // Backend might map this to is_featured
                        is_vault: nextValue ? false : undefined // Force Vault OFF if Hero ON
                    } 
                })
            });
            const data = await res.json();
            if (data.success) {
                setPosts(prev => prev.map(p => p.id === postId ? { 
                    ...p, 
                    is_burner: nextValue,
                    is_vault: nextValue ? false : p.is_vault 
                } : p));
            }
        } catch(e) { console.error(e); }
        setSyncing(null);
    };

    const hidePost = async (postId: string) => {
        if (!confirm('🚨 Neural Tombstone: Hide this post from site?')) return;
        setSyncing(postId);
        try {
            const res = await fetch('/api/admin/audit', {
                method: 'POST',
                body: JSON.stringify({ action: 'delete-post', payload: { id: postId } })
            });
            const data = await res.json();
            if (data.success) {
                // Instantly remove from view
                setPosts(prev => prev.filter(p => p.id !== postId));
            }
        } catch(e) { console.error(e); }
        setSyncing(null);
    };

    const updateCaption = async (postId: string, newCaption: string) => {
        try {
            await fetch('/api/admin/audit', {
                method: 'POST',
                body: JSON.stringify({ action: 'update-post', payload: { id: postId, caption: newCaption } })
            });
        } catch(e) { alert('Caption Sync Error'); }
    };

    const filteredPosts = posts.filter(p => 
        p.persona_id.toLowerCase().includes(search.toLowerCase()) || 
        (p.personas?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.caption || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white font-outfit p-4 md:p-12">
            <header className="max-w-7xl mx-auto flex flex-col md:flex-row items-end justify-between gap-8 mb-16">
                <div>
                   <h1 className="text-5xl md:text-7xl font-syncopate font-black italic tracking-tighter text-white uppercase mb-2">Post Studio</h1>
                   <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
                      <span>Neural Asset Command</span>
                      <div className="w-1 h-1 rounded-full bg-white/20" />
                      <span>{posts?.length || 0} Nodes Loaded</span>
                   </div>
                </div>

                <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-2 pl-6 focus-within:border-[#00f0ff]/50 transition-all w-full md:w-96">
                   <Search size={18} className="text-white/20" />
                   <input 
                    type="text" 
                    placeholder="Search Identity or Caption..." 
                    className="bg-transparent border-none outline-none flex-1 text-sm font-black uppercase tracking-widest placeholder:text-white/10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                   />
                   <button onClick={fetchPosts} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                      <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                   </button>
                </div>
            </header>

            <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row items-center gap-6 p-8 bg-white/5 border border-white/10 rounded-[2.5rem]">
               <div className="flex-1 space-y-1">
                  <h3 className="text-xs font-black uppercase text-[#00f0ff] tracking-widest">Birth Node from Path</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed">Map any asset from c:\gasp_assets\personas to the database</p>
               </div>
               <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                  <input id="asset_pid" placeholder="Persona ID (e.g. malia...)" className="flex-1 px-4 py-3 bg-black border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest outline-none focus:border-[#00f0ff]" />
                  <input id="asset_path" placeholder="Path (e.g. hero.webp)" className="flex-1 px-4 py-3 bg-black border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest outline-none focus:border-[#00f0ff]" />
                  <button 
                    onClick={async () => {
                        const pid = (document.getElementById('asset_pid') as HTMLInputElement).value;
                        const path = (document.getElementById('asset_path') as HTMLInputElement).value;
                        if (!pid || !path) return alert('ID and Path Required.');
                        
                        const full_url = `https://asset.gasp.fun/personas/${pid}/${path}`;
                        const res = await fetch('/api/admin/audit', {
                            method: 'POST',
                            body: JSON.stringify({ 
                                action: 'update-post', 
                                payload: { 
                                    id: `${pid}-${Date.now()}`,
                                    persona_id: pid,
                                    content_url: full_url,
                                    caption: 'GASP Syndicate Sync: Manual Node Birth. ✨💦',
                                    is_vault: false
                                } 
                            })
                        });
                        const data = await res.json();
                        if (data.success) { fetchPosts(); (document.getElementById('asset_path') as HTMLInputElement).value = ''; alert('Node Birthed Successfully.'); }
                        else alert('Birth Failed: ' + data.error);
                    }}
                    className="px-8 py-3 bg-[#00f0ff] text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-[#00f0ff]/10"
                  >
                    Birth Asset
                  </button>
               </div>
            </div>

            <main className="max-w-7xl mx-auto">
                <AnimatePresence>
                    {loading ? (
                        <div className="py-40 flex flex-col items-center justify-center gap-6">
                            <div className="w-16 h-16 border-4 border-[#00f0ff]/20 border-t-[#00f0ff] rounded-full animate-spin" />
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#00f0ff] animate-pulse">Syncing Library...</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredPosts?.length > 0 ? filteredPosts.map((post) => (
                                <motion.div 
                                    layout
                                    key={post.id}
                                    className={`group relative bg-white/[0.02] border border-white/10 rounded-[2rem] overflow-hidden hover:border-[#00f0ff]/50 transition-all ${syncing === post.id ? 'opacity-50 pointer-events-none' : ''}`}
                                >
                                    <div className="relative aspect-[4/5] bg-black">
                                       <img 
                                        src={proxyImg(post.content_url)} 
                                        alt="Asset" 
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                       />
                                       
                                       <div className="absolute top-4 left-4 flex flex-col gap-2">
                                          {post.is_vault && (
                                            <div className="px-3 py-1 bg-[#ff00ff] text-white text-[9px] font-black uppercase tracking-widest rounded shadow-[0_0_15px_#ff00ff]">Vault</div>
                                          )}
                                          {post.is_burner && (
                                            <div className="px-3 py-1 bg-[#00f0ff] text-black text-[9px] font-black uppercase tracking-widest rounded shadow-[0_0_15px_#00f0ff]">Hero</div>
                                          )}
                                       </div>

                                       {/* COMMAND OVERLAY */}
                                       <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto backdrop-blur-sm">
                                            <div className="flex items-center gap-3">
                                                <button 
                                                    onClick={() => toggleVaultStatus(post.id, post.is_vault)}
                                                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${post.is_vault ? 'bg-[#ff00ff] text-white border-none' : 'bg-white/5 border border-white/10 text-white/40 hover:bg-white/20'}`}
                                                    title="Toggle Vault Status"
                                                >
                                                    <Lock size={22} />
                                                </button>
                                                <button 
                                                    onClick={() => toggleHeroStatus(post.id, post.is_burner)}
                                                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${post.is_burner ? 'bg-[#00f0ff] text-black border-none' : 'bg-white/5 border border-white/10 text-white/40 hover:bg-white/20'}`}
                                                    title="Toggle Hero (Story) Status"
                                                >
                                                    <Star size={22} />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button 
                                                    onClick={() => hidePost(post.id)}
                                                    className="w-14 h-14 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-[#ff00ff] hover:bg-white/10 transition-all"
                                                    title="Hide from Feed"
                                                >
                                                    <EyeOff size={22} />
                                                </button>
                                                <button 
                                                    onClick={() => hidePost(post.id)}
                                                    className="w-14 h-14 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-[#ffea00] hover:bg-white/10 transition-all"
                                                    title="Mark Duplicate & Hide"
                                                >
                                                    <AlertCircle size={22} />
                                                </button>
                                            </div>
                                       </div>
                                    </div>

                                    <div className="p-6 space-y-4 bg-gradient-to-t from-black to-transparent">
                                       <div className="flex flex-col gap-1">
                                          <span className="text-[10px] font-black uppercase tracking-widest text-[#00f0ff]">{post.personas?.name || 'Unknown Node'}</span>
                                          <textarea 
                                            defaultValue={post.caption}
                                            onBlur={(e) => updateCaption(post.id, e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white/60 focus:border-[#00f0ff]/50 outline-none transition-all resize-none h-20"
                                            placeholder="Edit narrative..."
                                          />
                                       </div>
                                       <div className="flex items-center justify-between opacity-20 group-hover:opacity-100 transition-opacity">
                                          <span className="text-[9px] font-mono tracking-tighter max-w-[140px] truncate">{post.id}</span>
                                          <span className="text-[9px] font-black uppercase tracking-widest">{new Date(post.created_at).toLocaleDateString()}</span>
                                       </div>
                                    </div>
                                </motion.div>
                            )) : null}
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
