'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Search, Trash2, Zap, ArrowLeft, Loader2, Sparkles, Filter } from 'lucide-react';
import { initialProfiles } from '@/lib/profiles';
import Header from '@/components/Header';

export const dynamic = 'force-dynamic';

/**
 * THE BILLBOARD COMMANDER (V11.0)
 * Objective: Full media visibility including Rendering Ratios.
 */
export default function BillboardCommander() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'feed' | 'vault' | 'local'>('all');
    const [savingId, setSavingId] = useState<string | null>(null);
    const [filterOnlyFeatured, setFilterOnlyFeatured] = useState(false);

    async function fetchAllPosts() {
        console.log('📡 [Billboard] Fetching Global Content Matrix...');
        
        try {
            const res = await fetch('/api/rpc/db', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'GET_BILLBOARD_DATA' })
            });
            const data = await res.json();
            
            // 1. Remap DB Nodes from SQL join structure
            const dbPosts = (data.posts || []).map((p: any) => ({
                ...p,
                profiles: { name: p.name, city: p.city, seed_image_url: p.seed_image_url }
            }));

            // 2. Initial Nodes (static fallback)
            const initialNodes: any[] = initialProfiles.flatMap(p => 
                (p.broadcasts || []).map((b: any) => ({
                    id: b.id,
                    profile_id: p.id,
                    profiles: { name: p.name, city: p.city, seed_image_url: p.image },
                    content_type: b.type,
                    caption: b.content,
                    content_url: b.image_url || b.video_url,
                    is_featured: b.is_featured || false,
                    is_vault: b.is_locked || false,
                    created_at: b.created_at || new Date().toISOString(),
                    is_local: true
                }))
            );

            // 3. Merged Matrix
            const merged = [...dbPosts, ...initialNodes];
            const unique = Array.from(new Map(merged.map(p => [p.id, p])).values());

            // 4. Construction Nodes (from jobs)
            const constructionNodes = (data.jobs || []).map((j: any) => ({
                id: `job-${j.job_id}`,
                profile_id: j.persona_id,
                profiles: { name: j.persona_id.split('-')[0], city: 'Factory Node', seed_image_url: j.temp_image_url || '/v1.png' },
                content_type: 'video',
                caption: 'RENDER IN PROGRESS: Syncing Neural Cluster...',
                content_url: j.temp_image_url || '/v1.png',
                is_featured: false,
                is_vault: false,
                is_rendering: true,
                created_at: j.created_at
            }));

            // 5. Empty Profile Injections
            const empties = (data.personas || []).filter((p: any) => 
                !unique.some(post => post.profile_id === p.id) && 
                !data.jobs?.some((j: any) => j.persona_id === p.id)
            );
            const newNodes = empties.map((p: any) => ({
                id: `new-${p.id}`,
                profile_id: p.id,
                profiles: { name: p.name, city: p.city, seed_image_url: p.seed_image_url || '/v1.png' },
                content_type: 'genesis',
                caption: 'NEW: Genesis Dispatch Required.',
                content_url: p.seed_image_url || '/v1.png',
                is_featured: false,
                is_vault: false,
                is_new_profile: true,
                created_at: new Date().toISOString()
            }));

            setPosts([...unique, ...constructionNodes, ...newNodes]);
            
        } catch (e) {
            console.error('[Billboard] Sovereign Handshake Failed:', e);
        }
        setLoading(false);
    }

    useEffect(() => {
        fetchAllPosts();
    }, []);

    const dispatchBirth = async (profileId: string) => {
        setSavingId(`new-${profileId}`);
        try {
            const res = await fetch('/api/factory/birth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ persona_id: profileId, category: 'STREET_FLASH_CANDID' })
            });
            if (!res.ok) throw new Error('Dispatch Handshake Failed.');
            alert(`New Node Dispatched! Content appearing soon. 🏁🦾🏎️💨`);
            fetchAllPosts();
        } catch (e) {
            alert(e as any);
        }
        setSavingId(null);
    };

    const toggleFeatured = async (post: any, currentState: boolean) => {
        if (post.is_new_profile) return dispatchBirth(post.profile_id);
        if (post.is_rendering) return;

        setSavingId(post.id);
        const newState = !currentState;
        try {
            await fetch('/api/rpc/db', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'TOGGLE_POST_FEATURED', id: post.id, is_featured: newState })
            });
            setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_featured: newState, is_local: false } : p));
        } catch (e) {
            console.error('SQL Sync Error:', e);
            alert('Sync Handshake Failed.');
        }
        setSavingId(null);
    };

    const deletePost = async (postId: string) => {
        if (!confirm('Execute DB Purge?')) return;
        try {
            await fetch('/api/rpc/db', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'DELETE_POST', id: postId })
            });
            setPosts(prev => prev.filter(p => p.id !== postId));
        } catch (e) { alert(e as any); }
    };

    const filtered = posts.filter(p => {
        const matchesSearch = p.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              p.caption?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFeatured = filterOnlyFeatured ? p.is_featured : true;
        
        let matchesTab = true;
        if (activeTab === 'feed') matchesTab = !p.is_vault && !p.is_new_profile && !p.is_rendering;
        if (activeTab === 'vault') matchesTab = p.is_vault && !p.is_new_profile && !p.is_rendering;
        if (activeTab === 'local') matchesTab = p.is_local;
        if (activeTab === 'all' && (p.is_new_profile || p.is_rendering)) matchesTab = true;

        return matchesSearch && matchesFeatured && matchesTab;
    });

    const proxyImg = (url?: string | null) => {
        if (!url) return '/v1.png';
        if (!url.startsWith('http')) {
            return `https://vvcwjlcequbkhlpmwzlc.supabase.co/storage/v1/object/public/posts/${url}`;
        }
        return url;
    };

    return (
        <main className="min-h-screen bg-[#050505] text-white font-outfit pb-24">
            <Header />

            <div className="container max-w-7xl mx-auto pt-24 px-6 space-y-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <button onClick={() => window.location.href = '/admin'} className="p-2 hover:bg-white/5 rounded-lg transition-all text-white/30 hover:text-white">
                                <ArrowLeft size={16} />
                            </button>
                            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#ffea00] italic">
                                FEED CURATION HUB v11.0
                            </h2>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-syncopate font-bold uppercase italic tracking-tighter leading-none">
                            Billboard <span className="text-[#ffea00]">Manager</span>
                        </h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
                            {(['all', 'feed', 'vault', 'local'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-black shadow-lg' : 'text-white/30 hover:text-white'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="relative">
                            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search..."
                                className="bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-[10px] font-black uppercase tracking-widest outline-none transition-all w-64"
                            />
                        </div>
                        <button 
                            onClick={() => setFilterOnlyFeatured(!filterOnlyFeatured)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filterOnlyFeatured ? 'bg-[#ffea00] text-black' : 'bg-white/5 border border-white/10 text-white/40'}`}
                        >
                            <Filter size={14} />
                            {filterOnlyFeatured ? 'Show All' : 'Only Pinned'}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-4 text-white/10">
                        <Loader2 className="animate-spin" size={40} />
                        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Syncing Matrix...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        <AnimatePresence mode="popLayout">
                            {filtered.map((post) => (
                                <motion.div 
                                    layout
                                    key={post.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`relative group aspect-[9/16] rounded-[2rem] overflow-hidden border transition-all ${post.is_featured ? 'border-[#ffea00]/40 shadow-[0_0_30px_#ffea0011]' : 'border-white/10 backdrop-blur-3xl'} ${(post.is_new_profile || post.is_rendering) ? 'border-dashed opacity-80 ring-2 ring-[#00f0ff]/20' : ''}`}
                                >
                                    <div className="absolute inset-0 bg-black">
                                        {post.content_type === 'video' && !post.is_rendering ? (
                                            <video src={proxyImg(post.content_url)} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                                        ) : (
                                            <img src={proxyImg(post.content_url)} alt="" className={`w-full h-full object-cover ${post.is_rendering ? 'opacity-40 blur-sm grayscale' : ''}`} />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
                                    </div>

                                    <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col gap-4">
                                        <div>
                                            <h4 className="text-[11px] font-syncopate font-black uppercase italic tracking-tighter text-white drop-shadow-lg">{post.profiles?.name}</h4>
                                            <p className="text-[8px] font-black uppercase tracking-widest text-[#ffea00] drop-shadow-md">/{post.profiles?.city}</p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {post.is_new_profile ? (
                                                <button 
                                                    onClick={() => dispatchBirth(post.profile_id || post.persona_id)}
                                                    disabled={savingId === post.id}
                                                    className="flex-1 h-12 rounded-xl bg-[#00f0ff] text-black text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                                >
                                                    {savingId === post.id ? <Loader2 className="animate-spin" size={16} /> : <><Sparkles size={12} /> Dispatch New</>}
                                                </button>
                                            ) : post.is_rendering ? (
                                                <div className="flex-1 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-2">
                                                    <Loader2 className="animate-spin text-[#00f0ff]" size={14} />
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-white/40 italic">Syncing...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <button 
                                                        onClick={() => toggleFeatured(post, post.is_featured || false)}
                                                        className={`flex-1 h-12 rounded-xl flex items-center justify-center transition-all ${post.is_featured ? 'bg-[#ffea00] text-black shadow-lg scale-105' : 'bg-black/60 border border-white/10 text-white/40 hover:text-[#ffea00]'}`}
                                                    >
                                                        {savingId === post.id ? <Loader2 className="animate-spin" size={16} /> : <Star size={16} fill={post.is_featured ? 'currentColor' : 'none'} />}
                                                    </button>
                                                    <button onClick={() => deletePost(post.id)} className="w-12 h-12 rounded-xl bg-black/60 border border-white/10 text-white/20 hover:text-red-500 flex items-center justify-center transition-all">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {post.is_featured && (
                                        <div className="absolute top-4 left-4 bg-[#ffea00] text-black px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                            <Star size={10} fill="black" />
                                            <p className="text-[7px] font-black uppercase tracking-widest">Pinned</p>
                                        </div>
                                    )}

                                    {(post.is_new_profile || post.is_rendering) && (
                                        <div className="absolute top-4 left-4 bg-[#00f0ff] text-black px-3 py-1.5 rounded-full flex items-center gap-1.5 animate-pulse">
                                            <Zap size={10} fill="black" />
                                            <p className="text-[7px] font-black uppercase tracking-widest italic">{post.is_rendering ? 'Rendering' : 'New'}</p>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-8 py-4 bg-[#ffea00]/5 border border-[#ffea00]/20 rounded-full backdrop-blur-3xl flex items-center gap-4 z-[100] shadow-lg">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#ffea00]">Stat Matrix:</span>
                    <span className="text-[9px] font-bold text-white/60 uppercase">{posts.length} Nodes</span>
                    <span className="text-[9px] font-bold text-[#00f0ff] uppercase italic">{posts.filter(p => p.is_rendering).length} Rendering Hubs</span>
                </div>
            </div>
        </main>
    );
}
