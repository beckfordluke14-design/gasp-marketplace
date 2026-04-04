'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/components/providers/UserProvider';
import { usePrivy } from '@privy-io/react-auth';

type Tab = 'personas' | 'posts' | 'lostfiles' | 'vault';

interface R2Asset { key: string; url: string; size?: number; }
interface Persona { id: string; name: string; seed_image_url?: string; is_active: boolean; city?: string; }
interface Post { id: string; persona_id: string; content_url?: string; caption?: string; content_type?: string; is_vault?: boolean; is_gallery?: boolean; is_freebie?: boolean; personas?: { name: string }; }

function isDead(url?: string | null): boolean {
    if (!url) return true;
    if (url.trim() === '') return true;
    if (url.includes('null')) return true;
    return false;
}

function getAdminKey(): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('admin_gasp_key') || '';
}

export default function AssetAdmin() {
    const { authenticated } = usePrivy();
    const { profile } = useUser();

    const [isAdmin, setIsAdmin] = useState(false);
    const [tab, setTab] = useState<Tab>('personas');
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    const [personas, setPersonas] = useState<Persona[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [vault, setVault] = useState<R2Asset[]>([]);
    const [lost, setLost] = useState<R2Asset[]>([]);

    const [target, setTarget] = useState<{ id: string; type: 'persona' | 'post'; name: string } | null>(null);
    const [msg, setMsg] = useState('');

    // Check admin
    useEffect(() => {
        if (typeof document === 'undefined') return;
        const ok = !!(profile?.is_admin || document.cookie.includes('admin_gasp_override=granted'));
        setIsAdmin(ok);
    }, [profile]);

    // Load data once admin confirmed
    useEffect(() => {
        if (!isAdmin || !authenticated) return;
        load();
    }, [isAdmin, authenticated]);

    async function load() {
        setLoading(true);
        const k = getAdminKey();
        const h = { 'x-admin-key': k };
        try {
            const [r1, r2, r3, r4] = await Promise.allSettled([
                fetch('/api/admin/persona', { headers: h }).then(r => r.json()),
                fetch('/api/admin/feed?all=true&limit=300', { headers: h }).then(r => r.json()),
                fetch('/api/admin/assets', { headers: h }).then(r => r.json()),
                fetch('/api/admin/lostfiles', { headers: h }).then(r => r.json()),
            ]);
            if (r1.status === 'fulfilled' && Array.isArray(r1.value)) setPersonas(r1.value);
            if (r2.status === 'fulfilled' && r2.value?.posts) setPosts(r2.value.posts);
            if (r3.status === 'fulfilled' && r3.value?.vault) setVault(r3.value.vault);
            if (r4.status === 'fulfilled' && r4.value?.nodes) setLost(r4.value.nodes);
        } catch (e) {
            console.error('[AssetAdmin] Load error:', e);
        }
        setLoading(false);
    }

    async function graft(assetUrl: string) {
        if (!target) return;
        const k = getAdminKey();
        setMsg('Linking...');
        try {
            if (target.type === 'persona') {
                await fetch('/api/admin/persona', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'x-admin-key': k },
                    body: JSON.stringify({ personaId: target.id, update: { seed_image_url: assetUrl } })
                });
            } else {
                await fetch('/api/admin/assets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-admin-key': k },
                    body: JSON.stringify({ id: target.id, type: 'post', assetUrl })
                });
            }
            setMsg('✅ Linked!');
            setTarget(null);
            setTimeout(() => { setMsg(''); load(); }, 1500);
        } catch {
            setMsg('❌ Failed');
        }
    }

    const orphanP = personas.filter(p => isDead(p.seed_image_url));
    const orphanPosts = posts.filter(p => p.content_type !== 'text' && isDead(p.content_url));
    const allAssets = [...lost, ...vault.filter(v => !lost.find(l => l.key === v.key))];
    const filtered = allAssets.filter(a => a.key.toLowerCase().includes(search.toLowerCase()));

    if (!isAdmin) {
        return (
            <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', color: '#555' }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ textTransform: 'uppercase', letterSpacing: '0.3em' }}>Sovereign Clearance Required</p>
                    <p style={{ fontSize: 12, marginTop: 8, color: '#333' }}>Activate Command Mode on /admin first.</p>
                </div>
            </div>
        );
    }

    const tabs: { id: Tab; label: string; count: number; warn?: number }[] = [
        { id: 'personas', label: 'Personas', count: personas.length, warn: orphanP.length },
        { id: 'posts', label: 'All Posts', count: posts.length, warn: orphanPosts.length },
        { id: 'lostfiles', label: 'Lost Files', count: lost.length },
        { id: 'vault', label: 'R2 Vault', count: vault.length },
    ];

    return (
        <div className="min-h-screen bg-[#080808] text-white" style={{ fontFamily: 'monospace' }}>

            {/* STICKY HEADER */}
            <div className="sticky top-0 z-50 border-b border-white/5 bg-black/90 backdrop-blur-xl px-6 py-4">
                <div className="max-w-[1800px] mx-auto">
                    <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
                        <div>
                            <h1 className="text-xl font-black italic uppercase tracking-tighter">
                                Ultimate Post Editor <span className="text-[#00f0ff]">// V7</span>
                            </h1>
                            <p className="text-[9px] text-zinc-600 uppercase tracking-widest mt-0.5">
                                {orphanP.length} persona orphans · {orphanPosts.length} dead links · {lost.length} lost files · {vault.length} vault
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {msg && <span className="text-[10px] text-[#00f0ff] font-black uppercase tracking-widest">{msg}</span>}
                            {target && (
                                <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black text-[#00f0ff] uppercase border border-[#00f0ff]/30 bg-[#00f0ff]/5">
                                    ⟶ {target.name.slice(0, 20)}
                                    <button onClick={() => setTarget(null)} className="ml-1 text-zinc-600 hover:text-white">✕</button>
                                </div>
                            )}
                            <button onClick={load} disabled={loading}
                                className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-xs font-black uppercase hover:bg-white/10 transition-all">
                                {loading ? '...' : '↺ Refresh'}
                            </button>
                        </div>
                    </div>

                    {/* TABS */}
                    <div className="flex gap-2 flex-wrap">
                        {tabs.map(t => (
                            <button key={t.id} onClick={() => { setTab(t.id); setSearch(''); }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === t.id ? 'bg-[#00f0ff] text-black' : 'bg-white/5 text-zinc-500 hover:text-white'}`}>
                                {t.label}
                                <span className={`px-1.5 py-0.5 rounded text-[8px] ${tab === t.id ? 'bg-black/20' : 'bg-white/5'}`}>{t.count}</span>
                                {(t.warn ?? 0) > 0 && <span className="px-1.5 py-0.5 rounded text-[8px] bg-red-500/20 text-red-400">{t.warn}⚠</span>}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-[1800px] mx-auto p-6">
                {loading ? (
                    <div className="flex items-center justify-center gap-3 py-40 text-zinc-600 text-xs uppercase tracking-widest">
                        Loading vault data...
                    </div>
                ) : (
                    <>
                        {/* Hint when on image tabs */}
                        {!target && (tab === 'lostfiles' || tab === 'vault') && (
                            <div className="mb-4 p-4 rounded-2xl border border-[#ffea00]/20 bg-[#ffea00]/5 text-[10px] text-[#ffea00] font-black uppercase tracking-widest">
                                ⚡ First go to Personas or Posts tab → click a record with a ⚠ dead image → then come back here to assign an image.
                            </div>
                        )}

                        {/* ── PERSONAS ── */}
                        {tab === 'personas' && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                                {personas.map(p => {
                                    const dead = isDead(p.seed_image_url);
                                    const sel = target?.id === p.id;
                                    return (
                                        <div key={p.id}
                                            onClick={() => setTarget({ id: p.id, type: 'persona', name: p.name })}
                                            className={`rounded-2xl overflow-hidden border cursor-pointer transition-all ${sel ? 'border-[#00f0ff] ring-1 ring-[#00f0ff]/30' : dead ? 'border-red-500/40' : 'border-white/5 hover:border-white/20'}`}>
                                            <div className="aspect-square bg-zinc-900 relative overflow-hidden">
                                                {dead ? (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-red-500/50 text-center gap-1">
                                                        <span style={{ fontSize: 28 }}>⚠</span>
                                                        <span className="text-[8px] font-black uppercase">No Image</span>
                                                    </div>
                                                ) : (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={p.seed_image_url!} alt={p.name} className="w-full h-full object-cover" />
                                                )}
                                                {sel && (
                                                    <div className="absolute inset-0 bg-[#00f0ff]/20 flex items-center justify-center text-[#00f0ff] font-black text-2xl">⟶</div>
                                                )}
                                            </div>
                                            <div className="p-3 bg-black/60 space-y-1">
                                                <p className="text-[10px] font-black text-white truncate">{p.name}</p>
                                                <p className="text-[8px] text-zinc-600 truncate">{p.city || '—'}</p>
                                                <p className={`text-[8px] font-black ${dead ? 'text-red-400' : 'text-emerald-400'}`}>{dead ? '⚠ Dead' : '✓ OK'}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* ── POSTS ── */}
                        {tab === 'posts' && (
                            <div className="space-y-2">
                                <input value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Search by caption or persona name..."
                                    className="w-full mb-4 bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-zinc-700 outline-none" />
                                {posts
                                    .filter(p => !search || (p.caption || '').toLowerCase().includes(search) || (p.personas?.name || '').toLowerCase().includes(search))
                                    .map(p => {
                                        const dead = p.content_type !== 'text' && isDead(p.content_url);
                                        const sel = target?.id === p.id;
                                        return (
                                            <div key={p.id}
                                                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${sel ? 'border-[#00f0ff] bg-[#00f0ff]/5' : dead ? 'border-red-500/20 bg-red-500/[0.03]' : 'border-white/5 hover:border-white/10'}`}>
                                                <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-900 shrink-0 cursor-pointer"
                                                    onClick={() => setTarget({ id: p.id, type: 'post', name: p.caption?.slice(0, 30) || p.id })}>
                                                    {p.content_type === 'text' ? (
                                                        <div className="w-full h-full flex items-center justify-center text-[8px] text-zinc-700 uppercase font-black">TXT</div>
                                                    ) : dead ? (
                                                        <div className="w-full h-full flex items-center justify-center text-red-500/60 text-xl">⚠</div>
                                                    ) : (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={p.content_url!} alt="" className="w-full h-full object-cover" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-[10px] font-black text-white">{p.personas?.name || p.persona_id}</span>
                                                        {dead && <span className="text-[8px] font-black bg-red-500/20 text-red-400 px-2 py-0.5 rounded">Dead Link</span>}
                                                        {p.is_vault && <span className="text-[8px] bg-[#ff00ff]/20 text-[#ff00ff] px-2 py-0.5 rounded font-black">Vault</span>}
                                                        {p.is_gallery && <span className="text-[8px] bg-[#ffea00]/20 text-[#ffea00] px-2 py-0.5 rounded font-black">Gallery</span>}
                                                        {p.is_freebie && <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-black">Freebie</span>}
                                                    </div>
                                                    <p className="text-[9px] text-zinc-500 truncate mt-1">{p.caption || 'No caption'}</p>
                                                </div>
                                                <button
                                                    onClick={() => setTarget({ id: p.id, type: 'post', name: p.caption?.slice(0, 30) || p.id })}
                                                    className={`shrink-0 px-3 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${sel ? 'bg-[#00f0ff] text-black' : 'bg-white/5 text-zinc-500 hover:text-white'}`}>
                                                    Link
                                                </button>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}

                        {/* ── LOST FILES ── */}
                        {tab === 'lostfiles' && (
                            <div>
                                <input value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Search lost files..."
                                    className="w-full mb-4 bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-zinc-700 outline-none" />
                                {lost.length === 0 ? (
                                    <div className="text-center py-20 text-zinc-700 text-xs uppercase tracking-widest">No lost files found in R2 lostfiles/ prefix.</div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                                        {lost.filter(a => a.key.toLowerCase().includes(search.toLowerCase())).map(a => (
                                            <div key={a.key} className="rounded-2xl border border-white/5 overflow-hidden group hover:border-[#ffea00]/40 transition-all">
                                                <div className="aspect-square relative overflow-hidden bg-zinc-900">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={a.url} alt={a.key} className="w-full h-full object-cover" />
                                                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 rounded text-[7px] font-black uppercase text-[#ffea00]">Lost</div>
                                                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2 p-2">
                                                        <button onClick={() => graft(a.url)} disabled={!target}
                                                            className={`w-full py-2 rounded-xl text-[9px] font-black uppercase ${target ? 'bg-[#00f0ff] text-black' : 'bg-white/10 text-zinc-600 cursor-not-allowed'}`}>
                                                            {target ? '→ Link' : 'Select Target'}
                                                        </button>
                                                        <a href={a.url} target="_blank" rel="noopener noreferrer" className="w-full py-2 rounded-xl text-[9px] font-black uppercase bg-white text-black text-center hover:bg-[#00f0ff]">
                                                            View
                                                        </a>
                                                    </div>
                                                </div>
                                                <div className="p-2 bg-black/60">
                                                    <p className="text-[8px] text-zinc-600 truncate">{a.key.split('/').pop()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── R2 VAULT ── */}
                        {tab === 'vault' && (
                            <div>
                                <input value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Search R2 vault..."
                                    className="w-full mb-4 bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-zinc-700 outline-none" />
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                                    {filtered.map(a => {
                                        const isLost = !!lost.find(l => l.key === a.key);
                                        return (
                                            <div key={a.key} className="rounded-2xl border border-white/5 overflow-hidden group hover:border-[#00f0ff]/30 transition-all">
                                                <div className="aspect-square relative overflow-hidden bg-zinc-900">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={a.url} alt={a.key} className="w-full h-full object-cover" />
                                                    <div className={`absolute top-2 left-2 px-2 py-1 bg-black/70 rounded text-[7px] font-black uppercase ${isLost ? 'text-[#ffea00]' : 'text-[#00f0ff]'}`}>
                                                        {isLost ? 'Lost' : 'Vault'}
                                                    </div>
                                                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2 p-2">
                                                        <button onClick={() => graft(a.url)} disabled={!target}
                                                            className={`w-full py-2 rounded-xl text-[9px] font-black uppercase ${target ? 'bg-[#00f0ff] text-black' : 'bg-white/10 text-zinc-600 cursor-not-allowed'}`}>
                                                            {target ? '→ Link' : 'Select Target'}
                                                        </button>
                                                        <a href={a.url} target="_blank" rel="noopener noreferrer" className="w-full py-2 rounded-xl text-[9px] font-black uppercase bg-white text-black text-center hover:bg-[#00f0ff]">
                                                            View
                                                        </a>
                                                    </div>
                                                </div>
                                                <div className="p-2 bg-black/60">
                                                    <p className="text-[8px] text-zinc-600 truncate">{a.key.split('/').pop()}</p>
                                                    {a.size != null && <p className="text-[7px] text-zinc-800">{(a.size / 1024).toFixed(0)}KB</p>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
