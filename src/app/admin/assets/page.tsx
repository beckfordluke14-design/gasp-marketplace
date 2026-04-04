'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/components/providers/UserProvider';
import { usePrivy } from '@privy-io/react-auth';
import { 
  Search, Loader2, Link2, ExternalLink, ImageIcon, 
  AlertTriangle, Users, FileImage, 
  FolderOpen, RefreshCw, Unlink
} from 'lucide-react';
import { motion } from 'framer-motion';

// ─── Types ─────────────────────────────────────────────────────────────────
interface R2Asset { key: string; url: string; size?: number; lastModified?: string; }
interface Persona { id: string; name: string; seed_image_url?: string; is_active: boolean; city?: string; }
interface Post { 
  id: string; persona_id: string; content_url?: string; caption?: string; 
  content_type?: string; is_vault?: boolean; is_gallery?: boolean; is_freebie?: boolean;
  personas?: { name: string; seed_image_url?: string; };
  created_at?: string;
}

type Tab = 'posts' | 'personas' | 'lostfiles' | 'vault';

export default function AssetAdmin() {
    const { authenticated } = usePrivy();
    const { profile } = useUser();
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminKey, setAdminKey] = useState('');
    
    // Data State
    const [posts, setPosts] = useState<Post[]>([]);
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [lostFiles, setLostFiles] = useState<R2Asset[]>([]);
    const [vaultAssets, setVaultAssets] = useState<R2Asset[]>([]);
    
    // UI State
    const [activeTab, setActiveTab] = useState<Tab>('personas');
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTarget, setSelectedTarget] = useState<{ id: string; type: 'persona' | 'post'; name: string } | null>(null);
    const [graftStatus, setGraftStatus] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'orphan' | 'ok'>('all');

    // ─── Auth Check
    useEffect(() => {
        const hasClearance = profile?.is_admin || document.cookie.includes('admin_gasp_override=granted');
        setIsAdmin(!!hasClearance);
        const storedKey = typeof window !== 'undefined' ? localStorage.getItem('admin_gasp_key') || '' : '';
        setAdminKey(storedKey);
    }, [profile]);

    // ─── Fetch all data
    const fetchAll = useCallback(async () => {
        if (!isAdmin) return;
        setLoading(true);
        const key = typeof window !== 'undefined' ? localStorage.getItem('admin_gasp_key') || '' : '';

        try {
            const [postsRes, personasRes, assetsRes, lostRes] = await Promise.all([
                fetch('/api/admin/feed?all=true&limit=200', { headers: { 'x-admin-key': key } }),
                fetch('/api/admin/persona', { headers: { 'x-admin-key': key } }),
                fetch('/api/admin/assets', { headers: { 'x-admin-key': key } }),
                fetch('/api/admin/lostfiles', { headers: { 'x-admin-key': key } })
            ]);

            const [postsData, personasData, assetsData, lostData] = await Promise.all([
                postsRes.json(), personasRes.json(), assetsRes.json(), lostRes.json()
            ]);

            if (postsData.success || Array.isArray(postsData.posts)) setPosts(postsData.posts || []);
            if (Array.isArray(personasData)) setPersonas(personasData);
            if (assetsData.success) setVaultAssets(assetsData.vault || []);
            if (lostData.success) setLostFiles(lostData.nodes || []);

        } catch (e) { console.error('Fetch failed:', e); }
        finally { setLoading(false); }
    }, [isAdmin]);

    useEffect(() => {
        if (authenticated && isAdmin) fetchAll();
    }, [authenticated, isAdmin, fetchAll]);

    // ─── Graft / Link an asset to a record
    const handleGraft = async (assetUrl: string) => {
        if (!selectedTarget) return;
        const key = typeof window !== 'undefined' ? localStorage.getItem('admin_gasp_key') || '' : '';
        setGraftStatus('Linking...');
        try {
            if (selectedTarget.type === 'persona') {
                await fetch('/api/admin/persona', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
                    body: JSON.stringify({ personaId: selectedTarget.id, update: { seed_image_url: assetUrl } })
                });
            } else {
                await fetch('/api/admin/assets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
                    body: JSON.stringify({ id: selectedTarget.id, type: selectedTarget.type, assetUrl })
                });
            }
            setGraftStatus(`✅ Linked to ${selectedTarget.name}`);
            setSelectedTarget(null);
            setTimeout(() => { setGraftStatus(null); fetchAll(); }, 2000);
        } catch (e) { setGraftStatus('❌ Link Failed'); }
    };

    // ─── Update post flags
    const togglePostFlag = async (postId: string, flag: 'is_vault' | 'is_gallery' | 'is_freebie', currentVal: boolean) => {
        const key = typeof window !== 'undefined' ? localStorage.getItem('admin_gasp_key') || '' : '';
        await fetch(`/api/admin/posts/${postId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
            body: JSON.stringify({ [flag]: !currentVal })
        }).catch(() => {});
        await fetchAll();
    };

    // ─── Helpers
    const isDead = (url?: string) => !url || url.includes('null') || url === '';
    const orphanPersonas = personas.filter(p => isDead(p.seed_image_url));
    const orphanPosts = posts.filter(p => isDead(p.content_url) && p.content_type !== 'text');
    const allAssets = [...lostFiles, ...vaultAssets.filter(v => !lostFiles.find(l => l.key === v.key))];
    const filteredAssets = allAssets.filter(a => a.key.toLowerCase().includes(searchTerm.toLowerCase()));

    // ─── Access Guard
    if (!isAdmin) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center space-y-4">
                <AlertTriangle size={40} className="text-red-500 mx-auto" />
                <p className="font-mono text-zinc-500 uppercase tracking-[0.4em] text-sm">
                    Sovereign Clearance Required // Access Restricted
                </p>
                <p className="text-xs text-zinc-700">Activate Command Mode on the Admin Hub first.</p>
            </div>
        </div>
    );

    const tabs = [
        { id: 'personas' as Tab, label: 'Personas', count: personas.length, orphans: orphanPersonas.length, icon: <Users size={14} /> },
        { id: 'posts' as Tab, label: 'All Posts', count: posts.length, orphans: orphanPosts.length, icon: <FileImage size={14} /> },
        { id: 'lostfiles' as Tab, label: 'Lost Files', count: lostFiles.length, orphans: 0, icon: <FolderOpen size={14} /> },
        { id: 'vault' as Tab, label: 'R2 Vault', count: vaultAssets.length, orphans: 0, icon: <ImageIcon size={14} /> },
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-white font-mono">
            
            {/* ─── HEADER ─── */}
            <div className="border-b border-white/5 bg-black/60 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between gap-6">
                    <div>
                        <h1 className="text-lg font-black italic uppercase tracking-tighter text-white">
                            Ultimate Post Editor <span className="text-[#00f0ff]">// V7</span>
                        </h1>
                        <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600">
                            {orphanPersonas.length} Persona Orphans · {orphanPosts.length} Post Orphans · {lostFiles.length} Lost Files · {vaultAssets.length} Vault Assets
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {graftStatus && (
                            <motion.div 
                                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                                className="text-[10px] font-black uppercase tracking-widest text-[#00f0ff]"
                            >
                                {graftStatus}
                            </motion.div>
                        )}
                        {selectedTarget && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-[#00f0ff]/10 border border-[#00f0ff]/40 rounded-xl">
                                <Link2 size={12} className="text-[#00f0ff] animate-pulse" />
                                <span className="text-[10px] font-black text-[#00f0ff] uppercase tracking-widest">
                                    Linking: {selectedTarget.name.slice(0, 20)}
                                </span>
                                <button onClick={() => setSelectedTarget(null)} className="text-white/20 hover:text-white ml-2 text-xs">✕</button>
                            </div>
                        )}
                        <button 
                            onClick={fetchAll}
                            disabled={loading}
                            className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/5"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin text-[#00f0ff]' : 'text-white/40'} />
                        </button>
                    </div>
                </div>

                {/* ─── TABS ─── */}
                <div className="max-w-[1800px] mx-auto px-6 flex gap-1 pb-3">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                activeTab === tab.id 
                                    ? 'bg-[#00f0ff] text-black' 
                                    : 'bg-white/5 text-white/40 hover:text-white'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                            <span className={`px-1.5 py-0.5 rounded text-[8px] ${activeTab === tab.id ? 'bg-black/20' : 'bg-white/5'}`}>
                                {tab.count}
                            </span>
                            {tab.orphans > 0 && (
                                <span className="px-1.5 py-0.5 rounded text-[8px] bg-red-500/20 text-red-400">
                                    {tab.orphans} ⚠
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-[1800px] mx-auto p-6">
                {loading ? (
                    <div className="flex items-center justify-center gap-3 py-40">
                        <Loader2 className="animate-spin text-[#00f0ff]" size={24} />
                        <span className="text-xs uppercase tracking-widest text-zinc-500">Scanning Vault...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8">
                        
                        {/* ─── LEFT PANEL: MAIN CONTENT ─── */}
                        <div className="space-y-4">
                            
                            {/* Search + Filter Bar */}
                            <div className="flex items-center gap-3">
                                <div className="flex-1 flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3">
                                    <Search size={14} className="text-white/20 shrink-0" />
                                    <input
                                        className="bg-transparent outline-none text-xs text-white placeholder:text-white/20 w-full"
                                        placeholder={`Search ${activeTab}...`}
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                {(activeTab === 'personas' || activeTab === 'posts') && (
                                    <div className="flex gap-1 bg-white/[0.03] border border-white/5 rounded-2xl p-1">
                                        {(['all', 'orphan', 'ok'] as const).map(f => (
                                            <button key={f}
                                                onClick={() => setFilter(f)}
                                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                                    filter === f ? 'bg-white text-black' : 'text-white/30 hover:text-white'
                                                }`}
                                            >
                                                {f === 'orphan' ? '⚠ Orphans' : f === 'ok' ? '✓ Healthy' : 'All'}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* ── PERSONAS TAB ── */}
                            {activeTab === 'personas' && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {personas
                                        .filter(p => {
                                            const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.includes(searchTerm);
                                            const matchFilter = filter === 'all' || (filter === 'orphan' && isDead(p.seed_image_url)) || (filter === 'ok' && !isDead(p.seed_image_url));
                                            return matchSearch && matchFilter;
                                        })
                                        .map(p => (
                                            <motion.div
                                                key={p.id}
                                                whileHover={{ y: -2 }}
                                                onClick={() => setSelectedTarget({ id: p.id, type: 'persona', name: p.name })}
                                                className={`rounded-2xl border overflow-hidden cursor-pointer transition-all ${
                                                    selectedTarget?.id === p.id 
                                                        ? 'border-[#00f0ff] shadow-[0_0_30px_rgba(0,240,255,0.2)]' 
                                                        : isDead(p.seed_image_url)
                                                            ? 'border-red-500/40 bg-red-500/5'
                                                            : 'border-white/5 bg-white/[0.02] hover:border-white/10'
                                                }`}
                                            >
                                                <div className="aspect-square relative overflow-hidden bg-zinc-900">
                                                    {!isDead(p.seed_image_url) ? (
                                                        <img src={p.seed_image_url} alt={p.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-red-500/60">
                                                            <Unlink size={28} />
                                                            <span className="text-[9px] font-black uppercase tracking-widest">No Image</span>
                                                        </div>
                                                    )}
                                                    {isDead(p.seed_image_url) && (
                                                        <div className="absolute top-2 right-2">
                                                            <AlertTriangle size={14} className="text-red-500" />
                                                        </div>
                                                    )}
                                                    {selectedTarget?.id === p.id && (
                                                        <div className="absolute inset-0 bg-[#00f0ff]/20 flex items-center justify-center">
                                                            <Link2 size={28} className="text-[#00f0ff]" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-3 space-y-1">
                                                    <p className="text-[10px] font-black text-white truncate">{p.name}</p>
                                                    <p className="text-[8px] text-zinc-600 uppercase tracking-widest truncate">{p.city || p.id.slice(0, 16)}</p>
                                                    <div className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full w-fit ${p.is_active ? 'text-emerald-400 bg-emerald-400/10' : 'text-zinc-600 bg-zinc-800/50'}`}>
                                                        {p.is_active ? '● Active' : '○ Inactive'}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                </div>
                            )}

                            {/* ── POSTS TAB ── */}
                            {activeTab === 'posts' && (
                                <div className="space-y-2">
                                    {posts
                                        .filter(p => {
                                            const matchSearch = (p.caption || '').toLowerCase().includes(searchTerm.toLowerCase()) || p.id.includes(searchTerm) || (p.personas?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
                                            const matchFilter = filter === 'all' || (filter === 'orphan' && isDead(p.content_url) && p.content_type !== 'text') || (filter === 'ok' && (!isDead(p.content_url) || p.content_type === 'text'));
                                            return matchSearch && matchFilter;
                                        })
                                        .map(p => (
                                            <div
                                                key={p.id}
                                                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                                                    selectedTarget?.id === p.id 
                                                        ? 'border-[#00f0ff] bg-[#00f0ff]/5'
                                                        : isDead(p.content_url) && p.content_type !== 'text'
                                                            ? 'border-red-500/20 bg-red-500/5'
                                                            : 'border-white/5 bg-white/[0.02] hover:border-white/10'
                                                }`}
                                            >
                                                {/* Thumbnail */}
                                                <div 
                                                    className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-900 shrink-0 cursor-pointer"
                                                    onClick={() => setSelectedTarget({ id: p.id, type: 'post', name: p.caption?.slice(0, 30) || p.id })}
                                                >
                                                    {!isDead(p.content_url) ? (
                                                        <img src={p.content_url} alt="" className="w-full h-full object-cover" />
                                                    ) : p.content_type === 'text' ? (
                                                        <div className="w-full h-full flex items-center justify-center text-zinc-700 text-[10px] font-black uppercase">Text</div>
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <AlertTriangle size={20} className="text-red-500/60" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-white truncate">{p.personas?.name || p.persona_id}</span>
                                                        {isDead(p.content_url) && p.content_type !== 'text' && (
                                                            <span className="px-2 py-0.5 rounded text-[8px] font-black bg-red-500/20 text-red-400 uppercase shrink-0">Dead Link</span>
                                                        )}
                                                    </div>
                                                    <p className="text-[9px] text-zinc-500 truncate">{p.caption || 'No caption'}</p>
                                                    <p className="text-[8px] text-zinc-700 font-mono">{p.id.slice(0, 24)}...</p>
                                                </div>

                                                {/* Flags */}
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {[
                                                        { flag: 'is_vault' as const, label: 'V', active: p.is_vault, color: 'text-[#ff00ff] bg-[#ff00ff]/10' },
                                                        { flag: 'is_gallery' as const, label: 'G', active: p.is_gallery, color: 'text-[#ffea00] bg-[#ffea00]/10' },
                                                        { flag: 'is_freebie' as const, label: 'F', active: p.is_freebie, color: 'text-emerald-400 bg-emerald-400/10' },
                                                    ].map(({ flag, label, active, color }) => (
                                                        <button
                                                            key={flag}
                                                            onClick={() => togglePostFlag(p.id, flag, !!active)}
                                                            className={`w-7 h-7 rounded-lg text-[9px] font-black transition-all border ${active ? `${color} border-current` : 'text-zinc-700 bg-white/5 border-white/5 hover:border-white/20'}`}
                                                        >
                                                            {label}
                                                        </button>
                                                    ))}
                                                    {!isDead(p.content_url) && (
                                                        <a href={p.content_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
                                                            <ExternalLink size={12} className="text-zinc-600" />
                                                        </a>
                                                    )}
                                                    <button
                                                        onClick={() => setSelectedTarget({ id: p.id, type: 'post', name: p.caption?.slice(0, 30) || p.id })}
                                                        className={`p-2 rounded-lg transition-all ${selectedTarget?.id === p.id ? 'bg-[#00f0ff] text-black' : 'bg-white/5 hover:bg-white/10'}`}
                                                    >
                                                        <Link2 size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}

                            {/* ── LOST FILES TAB ── */}
                            {activeTab === 'lostfiles' && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {lostFiles.filter(a => a.key.toLowerCase().includes(searchTerm.toLowerCase())).map(a => (
                                        <motion.div key={a.key} whileHover={{ y: -2 }} className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden group hover:border-[#00f0ff]/30 transition-all">
                                            <div className="aspect-square overflow-hidden bg-zinc-900 relative">
                                                <img src={a.url} alt={a.key} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                                                    <button onClick={() => handleGraft(a.url)} disabled={!selectedTarget}
                                                        className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${selectedTarget ? 'bg-[#00f0ff] text-black' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
                                                    >
                                                        {selectedTarget ? 'Link' : 'Select Target'}
                                                    </button>
                                                    <a href={a.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white text-black rounded-xl hover:bg-[#00f0ff]">
                                                        <ExternalLink size={12} />
                                                    </a>
                                                </div>
                                                <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded-lg text-[7px] font-black uppercase text-[#ffea00] tracking-widest">Lost</div>
                                            </div>
                                            <div className="p-2">
                                                <p className="text-[8px] text-zinc-500 truncate">{a.key.split('/').pop()}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {lostFiles.length === 0 && (
                                        <div className="col-span-full text-center py-20 text-zinc-700">
                                            <FolderOpen size={40} className="mx-auto mb-4 opacity-30" />
                                            <p className="text-xs uppercase tracking-widest">No Lost Files Found</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── R2 VAULT TAB ── */}
                            {activeTab === 'vault' && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {filteredAssets.map(a => (
                                        <motion.div key={a.key} whileHover={{ y: -2 }} className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden group hover:border-[#00f0ff]/30 transition-all">
                                            <div className="aspect-square overflow-hidden bg-zinc-900 relative">
                                                <img src={a.url} alt={a.key} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                                                    <button onClick={() => handleGraft(a.url)} disabled={!selectedTarget}
                                                        className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${selectedTarget ? 'bg-[#00f0ff] text-black' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
                                                    >
                                                        {selectedTarget ? 'Link' : 'Select Target'}
                                                    </button>
                                                    <a href={a.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white text-black rounded-xl hover:bg-[#00f0ff]">
                                                        <ExternalLink size={12} />
                                                    </a>
                                                </div>
                                                <div className={`absolute top-2 left-2 px-2 py-1 bg-black/60 rounded-lg text-[7px] font-black uppercase tracking-widest ${lostFiles.find(l => l.key === a.key) ? 'text-[#ffea00]' : 'text-[#00f0ff]'}`}>
                                                    {lostFiles.find(l => l.key === a.key) ? 'Lost' : 'Vault'}
                                                </div>
                                            </div>
                                            <div className="p-2">
                                                <p className="text-[8px] text-zinc-500 truncate">{a.key.split('/').pop()}</p>
                                                <p className="text-[7px] text-zinc-700">{a.size ? `${(a.size / 1024).toFixed(0)}KB` : ''}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ─── RIGHT PANEL: QUICK LINK ASSISTANT ─── */}
                        <div className="space-y-6">
                            
                            {/* Orphan Quick Stats */}
                            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Quick Stats</h3>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Persona Orphans', count: orphanPersonas.length, color: 'text-red-400' },
                                        { label: 'Post Dead Links', count: orphanPosts.length, color: 'text-orange-400' },
                                        { label: 'Lost Files Available', count: lostFiles.length, color: 'text-[#ffea00]' },
                                        { label: 'R2 Vault Total', count: vaultAssets.length, color: 'text-[#00f0ff]' },
                                        { label: 'Total Posts', count: posts.length, color: 'text-white' },
                                        { label: 'Active Personas', count: personas.filter(p => p.is_active).length, color: 'text-emerald-400' },
                                    ].map(s => (
                                        <div key={s.label} className="flex justify-between items-center">
                                            <span className="text-[9px] text-zinc-600 uppercase tracking-widest">{s.label}</span>
                                            <span className={`text-sm font-black ${s.color}`}>{s.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Current Target */}
                            <div className={`p-6 rounded-3xl border space-y-4 transition-all ${selectedTarget ? 'border-[#00f0ff]/40 bg-[#00f0ff]/5 shadow-[0_0_40px_rgba(0,240,255,0.08)]' : 'border-white/5 bg-white/[0.02]'}`}>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Active Link Target</h3>
                                {selectedTarget ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-[#00f0ff]/10 flex items-center justify-center">
                                                {selectedTarget.type === 'persona' ? <Users size={16} className="text-[#00f0ff]" /> : <FileImage size={16} className="text-[#00f0ff]" />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-white">{selectedTarget.name}</p>
                                                <p className="text-[8px] text-zinc-500 uppercase">{selectedTarget.type} · {selectedTarget.id.slice(0, 16)}...</p>
                                            </div>
                                        </div>
                                        <p className="text-[9px] text-[#00f0ff] uppercase tracking-widest animate-pulse">
                                            Click any image to link it →
                                        </p>
                                        <button onClick={() => setSelectedTarget(null)} className="w-full py-2 rounded-xl text-[9px] font-black bg-white/5 text-white/30 hover:text-white uppercase tracking-widest transition-all">
                                            Clear Target
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-[9px] text-zinc-700 uppercase tracking-widest">
                                        Click a persona or post to select it as the link target. Then click an image from the Vault or Lost Files to assign it.
                                    </p>
                                )}
                            </div>

                            {/* Persona Orphan Quick List */}
                            {orphanPersonas.length > 0 && (
                                <div className="p-6 rounded-3xl border border-red-500/20 bg-red-500/5 space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-400">
                                        <AlertTriangle size={10} className="inline mr-2" />
                                        Persona Orphans ({orphanPersonas.length})
                                    </h3>
                                    <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                                        {orphanPersonas.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => { setSelectedTarget({ id: p.id, type: 'persona', name: p.name }); setActiveTab('lostfiles'); }}
                                                className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all ${selectedTarget?.id === p.id ? 'bg-[#00f0ff]/10 border border-[#00f0ff]/40' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}
                                            >
                                                <Unlink size={12} className="text-red-400 shrink-0" />
                                                <span className="text-[10px] font-black text-white">{p.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
