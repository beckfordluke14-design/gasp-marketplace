'use client';

import { useState, useEffect } from 'react';

/**
 * 🛰️ SOVEREIGN ASSET TERMINAL (Lite Edition v7.2)
 * Hardened for Safari Mobile + Cross-Device Persistence.
 * No strict UI guards — attempts sync immediately using localStorage keys.
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
    // 🧬 Data State
    const [tab, setTab] = useState<Tab>('personas');
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [vault, setVault] = useState<R2Asset[]>([]);
    const [lost, setLost] = useState<R2Asset[]>([]);
    const [error, setError] = useState<string | null>(null);
    
    // 🎯 Interaction State
    const [target, setTarget] = useState<{ id: string; type: 'persona' | 'post'; name: string } | null>(null);
    const [msg, setMsg] = useState('');

    const getHeaders = () => {
        if (typeof window === 'undefined') return {};
        const key = localStorage.getItem('admin_gasp_key') || '';
        return { 'x-admin-key': key };
    };

    const loadData = async () => {
        setLoading(true);
        setError(null);
        const headers = getHeaders();
        try {
            const [pRes, fRes, aRes, lRes] = await Promise.all([
                fetch('/api/admin/persona', { headers }).then(r => r.json()),
                fetch('/api/admin/feed?all=true&limit=300', { headers }).then(r => r.json()),
                fetch('/api/admin/assets', { headers }).then(r => r.json()),
                fetch('/api/admin/lostfiles', { headers }).then(r => r.json())
            ]);

            // If we get an error field back from any, we likely have no clearance
            if (pRes.error || fRes.error || aRes.error || lRes.error) {
                setError('SOVEREIGN CLEARANCE REQUIRED // ACCESS RESTRICTED');
            }

            if (Array.isArray(pRes)) setPersonas(pRes);
            if (fRes?.posts) setPosts(fRes.posts);
            if (aRes?.vault) setVault(aRes.vault);
            if (lRes?.nodes) setLost(lRes.nodes);

        } catch (e) {
            console.error('Terminal sync failure:', e);
            setError('SYNC PROTOCOL FATAL // RE-INITIALIZE AUTH');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleLink = async (assetUrl: string) => {
        if (!target) return;
        setMsg('Connecting...');
        const headers = { ...getHeaders(), 'Content-Type': 'application/json' };
        try {
            const res = await fetch(target.type === 'persona' ? '/api/admin/persona' : '/api/admin/assets', {
                method: target.type === 'persona' ? 'PATCH' : 'POST',
                headers,
                body: JSON.stringify(target.type === 'persona' 
                    ? { personaId: target.id, update: { seed_image_url: assetUrl } }
                    : { id: target.id, type: 'post', assetUrl })
            });
            const data = await res.json();
            if (data.success) {
                setMsg('✅ Success');
                setTarget(null);
                setTimeout(() => { setMsg(''); loadData(); }, 1500);
            } else {
                setMsg('❌ Write Failed');
            }
        } catch {
            setMsg('❌ Net Error');
        }
    };

    const activateCommandMode = () => {
        document.cookie = 'admin_gasp_override=granted; path=/; max-age=31536000;';
        window.location.reload();
    };

    // Stats
    const op = personas.filter(p => isDead(p.seed_image_url));
    const oPosts = posts.filter(p => isDead(p.content_url) && p.content_type !== 'text');
    const displayAssets = [...lost, ...vault.filter(v => !lost.find(l => l.key === v.key))];
    const filtered = displayAssets.filter(a => a.key.toLowerCase().includes(search.toLowerCase()));

    // Error Screen
    if (error && personas.length === 0) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-10 text-center font-mono uppercase">
                <span className="text-red-500 text-sm tracking-[0.4em] mb-4">{error}</span>
                <p className="text-[9px] text-zinc-600 tracking-widest max-w-sm leading-relaxed mb-8">
                    Your current identity node lacks the administrative signatures required for asset graft operations.
                </p>
                <button onClick={activateCommandMode} className="px-8 py-3 bg-[#00f0ff] text-black font-black text-[10px] tracking-widest rounded-2xl hover:bg-white transition-all shadow-[0_0_30px_rgba(0,240,255,0.4)]">
                    OVERRIDE // ACTIVATE COMMAND MODE
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-zinc-300 font-mono text-[11px]">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-black/90 border-b border-white/5 p-6 backdrop-blur-xl">
                <div className="max-w-[1800px] mx-auto flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-white font-black italic uppercase tracking-tighter text-xl">
                            Asset Invariant Terminal <span className="text-[#00f0ff]">V7.2</span>
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

                <div className="max-w-[1800px] mx-auto flex gap-2 mt-6 overflow-x-auto no-scrollbar pb-2">
                    {(['personas', 'posts', 'lostfiles', 'vault'] as Tab[]).map(t => (
                        <button key={t} onClick={() => { setTab(t); setSearch(''); }} 
                            className={`px-5 py-2 rounded-xl uppercase font-black tracking-widest transition-all shrink-0 ${tab === t ? 'bg-[#00f0ff] text-black shadow-[0_0_20px_rgba(0,240,255,0.3)]' : 'bg-white/5 text-zinc-500 hover:text-white'}`}>
                            {t}
                            {t === 'personas' && op.length > 0 && <span className="ml-2 text-red-500">⚠</span>}
                            {t === 'posts' && oPosts.length > 0 && <span className="ml-2 text-red-500">⚠</span>}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-[1800px] mx-auto p-6">
                {loading && personas.length === 0 ? (
                    <div className="py-40 text-center uppercase tracking-widest text-zinc-700 animate-pulse">Syncing Cloudflare Node...</div>
                ) : (
                    <div className="space-y-6 pb-20">
                        {tab === 'personas' && (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {personas.map(p => {
                                    const dead = isDead(p.seed_image_url);
                                    return (
                                        <div key={p.id} onClick={() => setTarget({ id: p.id, type: 'persona', name: p.name })}
                                            className={`rounded-2xl border bg-white/[0.02] overflow-hidden cursor-pointer transition-all ${target?.id === p.id ? 'border-[#00f0ff] scale-[1.02]' : dead ? 'border-red-900/50' : 'border-white/5 hover:border-white/20'}`}>
                                            <div className="aspect-square bg-zinc-900 relative">
                                                {!dead && <img src={p.seed_image_url!} className="w-full h-full object-cover" />}
                                                {dead && <div className="absolute inset-0 flex items-center justify-center text-red-500/30 text-2xl font-black">⚠</div>}
                                                {target?.id === p.id && <div className="absolute inset-0 bg-[#00f0ff]/20 flex items-center justify-center text-[#00f0ff] text-xl font-black">TARGET</div>}
                                            </div>
                                            <div className="p-3">
                                              <p className="font-black text-white truncate text-[10px]">{p.name}</p>
                                              <div className="flex justify-between items-center mt-1">
                                                <span className={`font-black ${dead ? 'text-red-500' : 'text-emerald-500'}`}>{dead ? 'ORPHAN' : 'READY'}</span>
                                                <span className="text-[7px] text-zinc-700 uppercase">{p.is_active ? 'Active' : 'Offline'}</span>
                                              </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {tab === 'posts' && (
                            <div className="space-y-2">
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="SEARCH CAPTIONS OR PERSONA NAMES..." className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl mb-6 outline-none text-white text-[10px] uppercase font-black" />
                                {posts.filter(p => !search || (p.caption || '').toLowerCase().includes(search.toLowerCase()) || (p.personas?.name || '').toLowerCase().includes(search.toLowerCase())).map(p => {
                                    const dead = p.content_type !== 'text' && isDead(p.content_url);
                                    return (
                                        <div key={p.id} onClick={() => setTarget({ id: p.id, type: 'post', name: p.caption?.slice(0, 20) || p.id })}
                                            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${target?.id === p.id ? 'border-[#00f0ff] bg-[#00f0ff]/5' : dead ? 'border-red-900/30' : 'border-white/5 hover:bg-white/[0.04]'}`}>
                                            <div className="w-12 h-12 rounded-xl bg-zinc-900 shrink-0 overflow-hidden flex items-center justify-center border border-white/5">
                                                {!isDead(p.content_url) ? <img src={p.content_url!} className="w-full h-full object-cover" /> : <span className="text-[8px] text-zinc-600 font-black">TEXT</span>}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-white font-black truncate text-[10px]">{p.personas?.name || 'UNKNOWN PERSONA'}</p>
                                                <p className="text-zinc-600 truncate text-[9px] mt-0.5">{p.caption || 'NO CAPTION'}</p>
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                {p.is_vault && <span className="text-[#ff00ff] font-black">V</span>}
                                                {p.is_gallery && <span className="text-[#ffea00] font-black">G</span>}
                                                {p.is_freebie && <span className="text-emerald-400 font-black">F</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {(tab === 'lostfiles' || tab === 'vault') && (
                            <div className="space-y-6">
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="FILTER R2 ASSET KEYS..." className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none text-white text-[10px] uppercase font-black" />
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {(tab === 'lostfiles' ? lost : filtered).map(a => (
                                        <div key={a.key} className="rounded-2xl border border-white/5 overflow-hidden group hover:border-[#00f0ff] transition-all">
                                            <div className="aspect-square bg-zinc-900 relative">
                                                <img src={a.url} className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                                                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center p-4 gap-2 transition-all">
                                                    <button onClick={() => handleLink(a.url)} disabled={!target} className={`w-full py-2 rounded-xl uppercase font-black text-[10px] ${target ? 'bg-[#00f0ff] text-black hover:bg-white' : 'bg-white/10 text-white/20'}`}>
                                                        {target ? 'LINK' : 'SELECT TARGET FIRST' }
                                                    </button>
                                                    <a href={a.url} target="_blank" className="w-full py-2 rounded-xl text-center bg-white text-black font-black text-[10px] uppercase">VIEW ASSET</a>
                                                </div>
                                                <div className={`absolute top-2 left-2 px-2 py-1 bg-black/70 rounded text-[7px] font-black uppercase ${lost.find(l => l.key === a.key) ? 'text-[#ffea00]' : 'text-[#00f0ff]'}`}>
                                                    {lost.find(l => l.key === a.key) ? 'LOST' : 'VAULT'}
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
