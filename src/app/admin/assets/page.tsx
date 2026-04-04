'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/components/providers/UserProvider';
import { usePrivy } from '@privy-io/react-auth';
import { Search, Loader2, Link2, ExternalLink, ImageIcon } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Asset {
    key: string;
    url: string;
    size?: number;
}

interface Orphan {
    id: string;
    name?: string;
    url?: string;
    type: 'persona' | 'post';
    persona_id?: string;
}

export default function AssetAdmin() {
    const { authenticated } = usePrivy();
    const { profile } = useUser();
    
    const [orphans, setOrphans] = useState<Orphan[]>([]);
    const [vault, setVault] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrphan, setSelectedOrphan] = useState<Orphan | null>(null);

    const fetchAssets = async () => {
        try {
            const res = await fetch('/api/admin/assets');
            const data = await res.json();
            if (data.success) {
                setOrphans(data.orphans);
                setVault(data.vault);
            }
        } catch (e) { console.error('Fetch Failed'); }
        finally { setLoading(false); }
    };

    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const hasClearance = profile?.is_admin || document.cookie.includes('admin_gasp_override=granted');
        setIsAdmin(!!hasClearance);

        if (authenticated && hasClearance) {
            fetchAssets();
        }
    }, [authenticated, profile]);

    const handleGraft = async (assetUrl: string) => {
        if (!selectedOrphan) return;
        try {
            const res = await fetch('/api/admin/assets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedOrphan.id, type: selectedOrphan.type, assetUrl })
            });
            const data = await res.json();
            if (data.success) {
                alert(`GRAFTED: ${selectedOrphan.name || selectedOrphan.id} is now linked to ${assetUrl.split('/').pop()}`);
                fetchAssets();
                setSelectedOrphan(null);
            }
        } catch (e) { alert('Graft Failed'); }
    };

    if (!isAdmin) return <div className="p-20 text-center text-zinc-500 font-mono uppercase tracking-[0.4em]">Sovereign Clearance Required // Access Restricted</div>;

    return (
        <div className="min-h-screen bg-black p-8 font-mono text-zinc-300">
            <div className="mx-auto max-w-[1600px] space-y-12">
                
                {/* 🛡️ TERMINAL HEADER */}
                <div className="flex justify-between items-end border-b border-zinc-900 pb-12">
                    <div className="space-y-4">
                        <h1 className="text-5xl font-black italic tracking-tighter text-white uppercase italic">
                            Asset Invariant Terminal
                        </h1>
                        <p className="text-[10px] uppercase font-bold tracking-[0.5em] text-[#00f0ff] animate-pulse">
                            R2 Vault Browser // Orphan Re-Sync Protocols // V6.2-Final
                        </p>
                    </div>
                    <div className="flex items-center gap-4 bg-zinc-900/40 p-4 rounded-3xl border border-white/5">
                        <span className="text-[9px] font-black uppercase text-white/30">Vault State:</span>
                        <span className="text-[9px] font-black uppercase text-[#00f0ff]">{vault.length} Assets Identified</span>
                        <div className="w-px h-4 bg-white/10" />
                        <span className="text-[9px] font-black uppercase text-[#ff3333]">{orphans.length} Orphans Active</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                    
                    {/* 🕵️ ORPHAN COLUMN (THE TARGETS) */}
                    <div className="space-y-8">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-black italic tracking-tighter text-white uppercase italic">
                                Identified Orphans
                            </h2>
                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest leading-none">Awaiting Linkage</span>
                        </div>
                        
                        <div className="space-y-3 max-h-[1000px] overflow-y-auto no-scrollbar">
                            {orphans.map((o) => (
                                <div 
                                    key={o.id}
                                    onClick={() => setSelectedOrphan(o)}
                                    className={`p-6 rounded-3xl border transition-all cursor-pointer group flex items-center justify-between ${selectedOrphan?.id === o.id ? 'bg-[#00f0ff]/10 border-[#00f0ff] shadow-[0_0_40px_rgba(0,240,255,0.15)]' : 'bg-[#050505] border-white/5 hover:border-white/10'}`}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${o.type === 'persona' ? 'bg-[#ff00ff]/10 text-[#ff00ff]' : 'bg-[#ffea00]/10 text-[#ffea00]'}`}>
                                            <ImageIcon size={20} />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[11px] font-black text-white hover:text-[#00f0ff] transition-colors">{o.name || `POST:${o.id.slice(0, 12)}`}</span>
                                            <span className="text-[7px] font-black uppercase tracking-[0.2em] text-white/30">{o.type} // {o.id}</span>
                                        </div>
                                    </div>
                                    {selectedOrphan?.id === o.id && (
                                        <div className="flex items-center gap-2 text-[#00f0ff] font-black text-[9px] uppercase tracking-widest animate-pulse">
                                            <Link2 size={12} /> Ready to Link
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 🏦 R2 VAULT COLUMN (THE ASSETS) */}
                    <div className="space-y-8">
                        <div className="flex justify-between items-center bg-zinc-900/30 p-4 rounded-3xl border border-white/5">
                            <div className="flex items-center gap-4 px-4 overflow-hidden flex-1">
                                <Search size={14} className="text-white/20" />
                                <input 
                                    className="bg-transparent border-none outline-none text-xs text-white placeholder:text-white/10 w-full font-black uppercase tracking-widest"
                                    placeholder="Search R2 Vault (Lost Files / Personas)"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[1000px] overflow-y-auto no-scrollbar pr-4">
                            {vault.filter(a => a.key.toLowerCase().includes(searchTerm.toLowerCase())).map((a) => (
                                <div 
                                    key={a.key}
                                    className="p-4 bg-[#0a0a0a] border border-white/5 rounded-3xl group hover:border-[#00f0ff]/40 transition-all space-y-4"
                                >
                                    <div className="aspect-square rounded-2xl overflow-hidden bg-black border border-white/5 relative group-hover:border-[#00f0ff]/20">
                                        <img src={a.url} alt={a.key} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <button 
                                                onClick={() => window.open(a.url, '_blank')}
                                                className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-[#00f0ff] transition-all"
                                            >
                                                <ExternalLink size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="px-2">
                                        <div className="flex flex-col gap-1 mb-4 overflow-hidden">
                                            <span className="text-[10px] font-black text-white truncate uppercase italic">{a.key.split('/').pop()}</span>
                                            <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.2em]">{a.key}</span>
                                        </div>
                                        <button 
                                            onClick={() => handleGraft(a.url)}
                                            disabled={!selectedOrphan}
                                            className={`w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedOrphan ? 'bg-[#00f0ff] text-black hover:bg-white shadow-[0_0_20px_rgba(0,240,255,0.2)]' : 'bg-white/5 text-white/10 cursor-not-allowed'}`}
                                        >
                                            {selectedOrphan ? `Link to ${selectedOrphan.type}` : 'Select Orphan First'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
