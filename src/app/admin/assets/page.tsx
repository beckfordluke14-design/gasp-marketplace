'use client';

import { useState, useEffect } from 'react';

/**
 * 🛰️ SOVEREIGN ASSET TERMINAL (Lite Edition)
 * Zero-dependency architecture to resolve Safari/Mobile crashes.
 * Works strictly off cookies and localStorage like the main Admin hub.
 */

type Tab = 'personas' | 'posts' | 'lostfiles' | 'vault';

interface R2Asset { key: string; url: string; size?: number; }
interface Persona { id: string; name: string; seed_image_url?: string; is_active: boolean; city?: string; }
interface Post { id: string; persona_id: string; content_url?: string; caption?: string; content_type?: string; is_vault?: boolean; is_gallery?: boolean; is_freebie?: boolean; personas?: { name: string }; }

function isDead(url?: string | null): boolean {
    if (!url) return true;
    const clean = url.trim();
    return clean === '' || clean.includes('null');
}

export default function AssetAdmin() {
    // 🛡️ Auth - Cookie-only to match AdminHub
    const [isAuthed, setIsAuthed] = useState(false);
    
    // 🧬 Data State
    const [tab, setTab] = useState<Tab>('personas');
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [vault, setVault] = useState<R2Asset[]>([]);
    const [lost, setLost] = useState<R2Asset[]>([]);
    
    // 🎯 Interaction State
    const [target, setTarget] = useState<{ id: string; type: 'persona' | 'post'; name: string } | null>(null);
    const [msg, setMsg] = useState('');

    // Step 1: Initial Handshake (Cookies + LocalStorage)
    useEffect(() => {
        if (typeof document === 'undefined') return;
        const hasCookie = document.cookie.includes('admin_gasp_override=granted');
        setIsAuthed(hasCookie);
        if (hasCookie) loadData();
    }, []);

    const getHeaders = () => {
        if (typeof window === 'undefined') return {};
        return { 'x-admin-key': localStorage.getItem('admin_gasp_key') || '' };
    };

    // Step 2: Protocol Ingress
    const loadData = async () => {
        setLoading(true);
        const headers = getHeaders();
        try {
            // Sequential fetching to simplify stack depth for Safari
            const pRes = await fetch('/api/admin/persona', { headers }).then(r => r.json());
            if (Array.isArray(pRes)) setPersonas(pRes);

            const fRes = await fetch('/api/admin/feed?all=true&limit=300', { headers }).then(r => r.json());
            if (fRes?.posts) setPosts(fRes.posts);

            const aRes = await fetch('/api/admin/assets', { headers }).then(r => r.json());
            if (aRes?.vault) setVault(aRes.vault);

            const lRes = await fetch('/api/admin/lostfiles', { headers }).then(r => r.json());
            if (lRes?.nodes) setLost(lRes.nodes);

        } catch (e) {
            console.error('Terminal sync failure:', e);
        }
        setLoading(false);
    };

    // Step 3: Grafting Logic
    const handleLink = async (assetUrl: string) => {
        if (!target) return;
        setMsg('Connecting...');
        const headers = { ...getHeaders(), 'Content-Type': 'application/json' };
        try {
            if (target.type === 'persona') {
                await fetch('/api/admin/persona', {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({ personaId: target.id, update: { seed_image_url: assetUrl } })
                });
            } else {
                await fetch('/api/admin/assets', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ id: target.id, type: 'post', assetUrl })
                });
            }
            setMsg('✅ Success');
            setTarget(null);
            setTimeout(() => { setMsg(''); loadData(); }, 1500);
        } catch {
            setMsg('❌ Link Error');
        }
    };

    // Stats
    const op = personas.filter(p => isDead(p.seed_image_url));
    const oPosts = posts.filter(p => !isDead(p.content_url) && p.content_type !== 'text');
    const displayAssets = [...lost, ...vault.filter(v => !lost.find(l => l.key === v.key))];
    const filtered = displayAssets.filter(a => a.key.toLowerCase().includes(search.toLowerCase()));

    // Access Denied Screen
    if (!isAuthed) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-10 text-center font-mono uppercase tracking-[0.4em] text-zinc-600 text-xs">
                Sovereign Clearance Required // Access Restricted
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-zinc-300 font-mono text-[11px]">
            {/* Header / Nav */}
            <div className="sticky top-0 z-50 bg-black/90 border-b border-white/5 p-6 backdrop-blur-xl">
                <div className="max-w-[1800px] mx-auto flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-white font-black italic uppercase tracking-tighter text-xl">
                            Asset Invariant Terminal <span className="text-[#00f0ff]">V7.1</span>
                        </h1>
                        <p className="text-[9px] uppercase tracking-widest text-zinc-600 mt-1">
                            {op.length} P-Orphans // {oPosts.length} Post Dead-Links // {lost.length} Lost Nodes
                        </p>
                    </div>
                    <div className="flex gap-4 items-center">
                        {msg && <span className="text-[#00f0ff] animate-pulse">{msg}</span>}
                        {target && (
                            <div className="bg-[#00f0ff]/10 border border-[#00f0ff]/40 text-[#00f0ff] px-4 py-2 rounded-xl">
                                LINK → {target.name.slice(0, 15)}...
                                <button onClick={() => setTarget(null)} className="ml-2 text-white/20 hover:text-white">✕</button>
                            </div>
                        )}
                        <button onClick={loadData} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 uppercase font-black transition-all">
                            {loading ? '---' : 'Refresh Sync'}
                        </button>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="max-w-[1800px] mx-auto flex gap-2 mt-6">
                    {(['personas', 'posts', 'lostfiles', 'vault'] as Tab[]).map(t => (
                        <button key={t} onClick={() => { setTab(t); setSearch(''); }} 
                            className={`px-5 py-2 rounded-xl uppercase font-black tracking-widest transition-all ${tab === t ? 'bg-[#00f0ff] text-black shadow-[0_0_20px_rgba(0,240,255,0.3)]' : 'bg-white/5 text-zinc-500 hover:text-white'}`}>
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-[1800px] mx-auto p-6">
                {loading ? (
                    <div className="py-40 text-center uppercase tracking-widest text-zinc-700 animate-pulse">Syncing Cloudflare Node...</div>
                ) : (
                    <div className="space-y-6">
                        {/* INGRESS PANELS */}
                        {tab === 'personas' && (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {personas.map(p => {
                                    const dead = isDead(p.seed_image_url);
                                    return (
                                        <div key={p.id} onClick={() => setTarget({ id: p.id, type: 'persona', name: p.name })}
                                            className={`rounded-2xl border bg-white/[0.02] overflow-hidden cursor-pointer transition-all ${target?.id === p.id ? 'border-[#00f0ff] scale-[1.02]' : dead ? 'border-red-900/50' : 'border-white/5 hover:border-white/20'}`}>
                                            <div className="aspect-square bg-zinc-900 relative">
                                                {!dead && <img src={p.seed_image_url!} className="w-full h-full object-cover" />}
                                                {dead && <div className="absolute inset-0 flex items-center justify-center text-red-500/30 text-2xl uppercase font-black">?</div>}
                                                {target?.id === p.id && <div className="absolute inset-0 bg-[#00f0ff]/20 flex items-center justify-center text-[#00f0ff] text-xl font-black">TARGET</div>}
                                            </div>
                                            <div className="p-3">
                                              <p className="font-black text-white truncate text-[10px]">{p.name}</p>
                                              <p className={`mt-1 font-black ${dead ? 'text-red-500' : 'text-emerald-500'}`}>{dead ? 'ORPHAN' : 'READY'}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {tab === 'posts' && (
                            <div className="space-y-2">
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="SEARCH CAPTIONS..." className="w-full bg-white/5 border border-white/10 p-3 rounded-2xl mb-4 outline-none text-white" />
                                {posts.filter(p => !search || (p.caption || '').toLowerCase().includes(search.toLowerCase())).map(p => {
                                    const dead = p.content_type !== 'text' && isDead(p.content_url);
                                    return (
                                        <div key={p.id} onClick={() => setTarget({ id: p.id, type: 'post', name: p.caption?.slice(0, 20) || p.id })}
                                            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${target?.id === p.id ? 'border-[#00f0ff] bg-[#00f0ff]/5' : dead ? 'border-red-900/30' : 'border-white/5 hover:bg-white/[0.04]'}`}>
                                            <div className="w-12 h-12 rounded-xl bg-zinc-900 shrink-0 overflow-hidden flex items-center justify-center border border-white/5">
                                                {!isDead(p.content_url) ? <img src={p.content_url!} className="w-full h-full object-cover" /> : 'TXT'}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-white font-black truncate">{p.personas?.name || 'UNKNOWN'}</p>
                                                <p className="text-zinc-600 truncate">{p.caption || '---'}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                {p.is_vault && <span className="text-[#ff00ff]">V</span>}
                                                {p.is_gallery && <span className="text-[#ffea00]">G</span>}
                                                {p.is_freebie && <span className="text-emerald-400">F</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {(tab === 'lostfiles' || tab === 'vault') && (
                            <div className="space-y-6">
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="FILTER ASSETS..." className="w-full bg-white/5 border border-white/10 p-3 rounded-2xl outline-none text-white" />
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {(tab === 'lostfiles' ? lost : filtered).map(a => (
                                        <div key={a.key} className="rounded-2xl border border-white/5 overflow-hidden group hover:border-[#00f0ff] transition-all">
                                            <div className="aspect-square bg-zinc-900 relative">
                                                <img src={a.url} className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                                                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center p-4 gap-2 transition-all">
                                                    <button onClick={() => handleLink(a.url)} disabled={!target} className={`w-full py-2 rounded-xl uppercase font-black ${target ? 'bg-[#00f0ff] text-black' : 'bg-white/10 text-white/20'}`}>
                                                        {target ? 'LINK' : '!' }
                                                    </button>
                                                    <a href={a.url} target="_blank" className="w-full py-2 rounded-xl text-center bg-white text-black font-black">VIEW</a>
                                                </div>
                                            </div>
                                            <div className="p-2 truncate text-[8px] text-zinc-700">{a.key.split('/').pop()}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
