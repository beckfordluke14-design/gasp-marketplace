'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/components/providers/UserProvider';
import { usePrivy } from '@privy-io/react-auth';
import { Search, Loader2, Link2, ExternalLink, RefreshCw, AlertTriangle, Users, FileImage, FolderOpen } from 'lucide-react';

type Tab = 'personas' | 'posts' | 'lostfiles' | 'vault';

interface R2Asset { key: string; url: string; size?: number; }
interface Persona { id: string; name: string; seed_image_url?: string; is_active: boolean; city?: string; }
interface Post { id: string; persona_id: string; content_url?: string; caption?: string; content_type?: string; is_vault?: boolean; is_gallery?: boolean; is_freebie?: boolean; personas?: { name: string; }; }

const ADMIN_KEY = typeof window !== 'undefined' ? localStorage.getItem('admin_gasp_key') || '' : '';

function isDead(url?: string) {
    return !url || url.includes('null') || url.trim() === '';
}

export default function AssetAdmin() {
    const { authenticated } = usePrivy();
    const { profile } = useUser();
    const [isAdmin, setIsAdmin] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('personas');
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [vault, setVault] = useState<R2Asset[]>([]);
    const [lostFiles, setLostFiles] = useState<R2Asset[]>([]);
    const [target, setTarget] = useState<{ id: string; type: 'persona' | 'post'; name: string } | null>(null);
    const [status, setStatus] = useState('');

    useEffect(() => {
        const ok = profile?.is_admin || document.cookie.includes('admin_gasp_override=granted');
        setIsAdmin(!!ok);
    }, [profile]);

    useEffect(() => {
        if (authenticated && isAdmin) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authenticated, isAdmin]);

    async function loadAll() {
        setLoading(true);
        const key = localStorage.getItem('admin_gasp_key') || '';
        const headers: Record<string, string> = { 'x-admin-key': key };
        try {
            const [pRes, posRes, aRes, lRes] = await Promise.all([
                fetch('/api/admin/persona', { headers }),
                fetch('/api/admin/feed?all=true&limit=300', { headers }),
                fetch('/api/admin/assets', { headers }),
                fetch('/api/admin/lostfiles', { headers }),
            ]);
            const [pData, posData, aData, lData] = await Promise.all([
                pRes.json(), posRes.json(), aRes.json(), lRes.json()
            ]);
            if (Array.isArray(pData)) setPersonas(pData);
            if (posData?.posts) setPosts(posData.posts);
            if (aData?.vault) setVault(aData.vault);
            if (lData?.nodes) setLostFiles(lData.nodes);
        } catch (e) { console.error(e); }
        setLoading(false);
    }

    async function graft(assetUrl: string) {
        if (!target) return;
        const key = localStorage.getItem('admin_gasp_key') || '';
        setStatus('Linking...');
        try {
            if (target.type === 'persona') {
                await fetch('/api/admin/persona', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
                    body: JSON.stringify({ personaId: target.id, update: { seed_image_url: assetUrl } })
                });
            } else {
                await fetch('/api/admin/assets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
                    body: JSON.stringify({ id: target.id, type: 'post', assetUrl })
                });
            }
            setStatus(`✅ Linked: ${target.name.slice(0, 20)}`);
            setTarget(null);
            setTimeout(() => { setStatus(''); loadAll(); }, 2000);
        } catch (e) { setStatus('❌ Failed'); }
    }

    const orphanPersonas = personas.filter(p => isDead(p.seed_image_url));
    const orphanPosts = posts.filter(p => p.content_type !== 'text' && isDead(p.content_url));
    const allAssets = [...lostFiles, ...vault.filter(v => !lostFiles.find(l => l.key === v.key))];
    const filtered = allAssets.filter(a => a.key.toLowerCase().includes(search.toLowerCase()));

    if (!isAdmin) return (
        <div className="min-h-screen bg-black flex items-center justify-center font-mono">
            <div className="text-center space-y-4">
                <AlertTriangle size={40} className="text-red-500 mx-auto" />
                <p className="text-zinc-500 uppercase tracking-[0.3em] text-sm">Sovereign Clearance Required</p>
                <p className="text-zinc-700 text-xs">Activate Command Mode on /admin first.</p>
            </div>
        </div>
    );

    const tabs: { id: Tab; label: string; count: number; warn?: number; icon: React.ReactNode }[] = [
        { id: 'personas', label: 'Personas', count: personas.length, warn: orphanPersonas.length, icon: <Users size={13} /> },
        { id: 'posts',    label: 'All Posts', count: posts.length,   warn: orphanPosts.length,   icon: <FileImage size={13} /> },
        { id: 'lostfiles',label: 'Lost Files',count: lostFiles.length, icon: <FolderOpen size={13} /> },
        { id: 'vault',    label: 'R2 Vault',  count: vault.length,    icon: <Search size={13} /> },
    ];

    return (
        <div className="min-h-screen bg-[#080808] text-white font-mono">

            {/* HEADER */}
            <div className="sticky top-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-xl px-6 py-4">
                <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-xl font-black italic uppercase tracking-tighter">
                            Ultimate Post Editor <span className="text-[#00f0ff]">// V7</span>
                        </h1>
                        <p className="text-[9px] text-zinc-600 uppercase tracking-widest mt-0.5">
                            {orphanPersonas.length} persona orphans · {orphanPosts.length} dead post links · {lostFiles.length} lost files
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {status && <span className="text-[10px] text-[#00f0ff] font-black uppercase tracking-widest">{status}</span>}
                        {target && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-[#00f0ff]/10 border border-[#00f0ff]/30 rounded-xl">
                                <Link2 size={12} className="text-[#00f0ff] animate-pulse" />
                                <span className="text-[10px] text-[#00f0ff] font-black uppercase tracking-widest">
                                    → {target.name.slice(0, 18)}
                                </span>
                                <button onClick={() => setTarget(null)} className="text-zinc-600 hover:text-white ml-1 text-xs">✕</button>
                            </div>
                        )}
                        <button onClick={loadAll} disabled={loading}
                            className="p-2 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all">
                            <RefreshCw size={14} className={loading ? 'animate-spin text-[#00f0ff]' : 'text-zinc-600'} />
                        </button>
                    </div>
                </div>

                {/* TABS */}
                <div className="max-w-[1800px] mx-auto flex gap-2 mt-3 flex-wrap">
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t.id ? 'bg-[#00f0ff] text-black' : 'bg-white/5 text-zinc-500 hover:text-white'}`}>
                            {t.icon} {t.label}
                            <span className={`px-1.5 py-0.5 rounded text-[8px] ${activeTab === t.id ? 'bg-black/20' : 'bg-white/5'}`}>{t.count}</span>
                            {(t.warn ?? 0) > 0 && <span className="px-1.5 py-0.5 rounded text-[8px] bg-red-500/20 text-red-400">{t.warn}⚠</span>}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-[1800px] mx-auto p-6">
                {loading ? (
                    <div className="flex items-center justify-center gap-3 py-40">
                        <Loader2 size={24} className="animate-spin text-[#00f0ff]" />
                        <span className="text-xs uppercase tracking-widest text-zinc-600">Scanning Vault...</span>
                    </div>
                ) : (
                    <div>

                        {/* Target hint */}
                        {!target && (activeTab === 'lostfiles' || activeTab === 'vault') && (
                            <div className="mb-4 p-4 rounded-2xl border border-[#ffea00]/20 bg-[#ffea00]/5">
                                <p className="text-[10px] text-[#ffea00] uppercase tracking-widest font-black">
                                    ⚡ First select a target: go to Personas or Posts tab, click a record with a dead image, then come back here to assign.
                                </p>
                            </div>
                        )}

                        {/* PERSONAS */}
                        {activeTab === 'personas' && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                                {personas.map(p => {
                                    const dead = isDead(p.seed_image_url);
                                    const selected = target?.id === p.id;
                                    return (
                                        <div key={p.id}
                                            onClick={() => setTarget({ id: p.id, type: 'persona', name: p.name })}
                                            className={`rounded-2xl overflow-hidden border cursor-pointer transition-all ${selected ? 'border-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.2)]' : dead ? 'border-red-500/40' : 'border-white/5 hover:border-white/10'}`}>
                                            <div className="aspect-square relative bg-zinc-900">
                                                {dead ? (
                                                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-red-500/50">
                                                        <AlertTriangle size={24} />
                                                        <span className="text-[8px] uppercase font-black">No Image</span>
                                                    </div>
                                                ) : (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={p.seed_image_url!} alt={p.name} className="w-full h-full object-cover" />
                                                )}
                                                {selected && (
                                                    <div className="absolute inset-0 bg-[#00f0ff]/20 flex items-center justify-center">
                                                        <Link2 size={28} className="text-[#00f0ff]" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-3 bg-black/60">
                                                <p className="text-[10px] font-black text-white truncate">{p.name}</p>
                                                <p className="text-[8px] text-zinc-600 truncate">{p.city || 'Unknown'}</p>
                                                <p className={`text-[8px] font-black mt-1 ${dead ? 'text-red-400' : 'text-emerald-400'}`}>{dead ? '⚠ Orphan' : '✓ OK'}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* POSTS */}
                        {activeTab === 'posts' && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-3 mb-4 bg-white/[0.02] border border-white/5 rounded-2xl px-4 py-3">
                                    <Search size={14} className="text-zinc-600" />
                                    <input value={search} onChange={e => setSearch(e.target.value)}
                                        placeholder="Search posts by caption or persona..."
                                        className="bg-transparent outline-none text-xs text-white placeholder:text-zinc-700 w-full" />
                                </div>
                                {posts.filter(p => {
                                    const q = search.toLowerCase();
                                    return !q || (p.caption || '').toLowerCase().includes(q) || (p.personas?.name || '').toLowerCase().includes(q);
                                }).map(p => {
                                    const dead = p.content_type !== 'text' && isDead(p.content_url);
                                    const selected = target?.id === p.id;
                                    return (
                                        <div key={p.id}
                                            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${selected ? 'border-[#00f0ff] bg-[#00f0ff]/5' : dead ? 'border-red-500/20 bg-red-500/5' : 'border-white/5 bg-white/[0.02] hover:border-white/10'}`}>
                                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-900 shrink-0 cursor-pointer"
                                                onClick={() => setTarget({ id: p.id, type: 'post', name: p.caption?.slice(0, 30) || p.id })}>
                                                {p.content_type === 'text' ? (
                                                    <div className="w-full h-full flex items-center justify-center text-[8px] text-zinc-700 uppercase font-black">Text</div>
                                                ) : dead ? (
                                                    <div className="w-full h-full flex items-center justify-center"><AlertTriangle size={18} className="text-red-500/60" /></div>
                                                ) : (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={p.content_url!} alt="" className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-white">{p.personas?.name || p.persona_id}</span>
                                                    {dead && <span className="text-[8px] font-black bg-red-500/20 text-red-400 px-2 py-0.5 rounded">Dead Link</span>}
                                                    {p.is_vault && <span className="text-[8px] font-black bg-[#ff00ff]/20 text-[#ff00ff] px-2 py-0.5 rounded">Vault</span>}
                                                    {p.is_gallery && <span className="text-[8px] font-black bg-[#ffea00]/20 text-[#ffea00] px-2 py-0.5 rounded">Gallery</span>}
                                                    {p.is_freebie && <span className="text-[8px] font-black bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Freebie</span>}
                                                </div>
                                                <p className="text-[9px] text-zinc-500 truncate">{p.caption || 'No caption'}</p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {!dead && p.content_url && (
                                                    <a href={p.content_url} target="_blank" rel="noopener noreferrer"
                                                        className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
                                                        <ExternalLink size={12} className="text-zinc-600" />
                                                    </a>
                                                )}
                                                <button onClick={() => setTarget({ id: p.id, type: 'post', name: p.caption?.slice(0, 30) || p.id })}
                                                    className={`p-2 rounded-lg transition-all ${selected ? 'bg-[#00f0ff] text-black' : 'bg-white/5 hover:bg-white/10 text-zinc-600'}`}>
                                                    <Link2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* LOST FILES */}
                        {activeTab === 'lostfiles' && (
                            <div>
                                <div className="flex items-center gap-3 mb-4 bg-white/[0.02] border border-white/5 rounded-2xl px-4 py-3">
                                    <Search size={14} className="text-zinc-600" />
                                    <input value={search} onChange={e => setSearch(e.target.value)}
                                        placeholder="Search lost files..."
                                        className="bg-transparent outline-none text-xs text-white placeholder:text-zinc-700 w-full" />
                                </div>
                                {lostFiles.length === 0 ? (
                                    <div className="text-center py-20 text-zinc-700">
                                        <FolderOpen size={40} className="mx-auto mb-4 opacity-30" />
                                        <p className="text-xs uppercase tracking-widest">No Lost Files Found in R2</p>
                                        <p className="text-[9px] text-zinc-800 mt-2">Check that lostfiles/ prefix exists in your R2 bucket.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                                        {lostFiles.filter(a => a.key.toLowerCase().includes(search.toLowerCase())).map(a => (
                                            <div key={a.key} className="rounded-2xl border border-white/5 overflow-hidden group hover:border-[#ffea00]/40 transition-all">
                                                <div className="aspect-square relative overflow-hidden bg-zinc-900">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={a.url} alt={a.key} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 rounded-lg text-[7px] font-black uppercase text-[#ffea00]">Lost</div>
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                                                        <button onClick={() => graft(a.url)} disabled={!target}
                                                            className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${target ? 'bg-[#00f0ff] text-black' : 'bg-white/10 text-zinc-600 cursor-not-allowed'}`}>
                                                            {target ? '→ Link' : 'Select Target First'}
                                                        </button>
                                                        <a href={a.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white text-black rounded-xl hover:bg-[#00f0ff]">
                                                            <ExternalLink size={12} />
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

                        {/* R2 VAULT */}
                        {activeTab === 'vault' && (
                            <div>
                                <div className="flex items-center gap-3 mb-4 bg-white/[0.02] border border-white/5 rounded-2xl px-4 py-3">
                                    <Search size={14} className="text-zinc-600" />
                                    <input value={search} onChange={e => setSearch(e.target.value)}
                                        placeholder="Search R2 vault..."
                                        className="bg-transparent outline-none text-xs text-white placeholder:text-zinc-700 w-full" />
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                                    {filtered.map(a => (
                                        <div key={a.key} className="rounded-2xl border border-white/5 overflow-hidden group hover:border-[#00f0ff]/30 transition-all">
                                            <div className="aspect-square relative overflow-hidden bg-zinc-900">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={a.url} alt={a.key} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                <div className={`absolute top-2 left-2 px-2 py-1 bg-black/70 rounded-lg text-[7px] font-black uppercase ${lostFiles.find(l => l.key === a.key) ? 'text-[#ffea00]' : 'text-[#00f0ff]'}`}>
                                                    {lostFiles.find(l => l.key === a.key) ? 'Lost' : 'Vault'}
                                                </div>
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                                                    <button onClick={() => graft(a.url)} disabled={!target}
                                                        className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${target ? 'bg-[#00f0ff] text-black' : 'bg-white/10 text-zinc-600 cursor-not-allowed'}`}>
                                                        {target ? '→ Link' : 'Select Target'}
                                                    </button>
                                                    <a href={a.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white text-black rounded-xl hover:bg-[#00f0ff]">
                                                        <ExternalLink size={12} />
                                                    </a>
                                                </div>
                                            </div>
                                            <div className="p-2 bg-black/60">
                                                <p className="text-[8px] text-zinc-600 truncate">{a.key.split('/').pop()}</p>
                                                {a.size && <p className="text-[7px] text-zinc-800">{(a.size / 1024).toFixed(0)}KB</p>}
                                            </div>
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
