'use client';

import { useState, useEffect } from 'react';

/**
 * 🛰️ SOVEREIGN ASSET TERMINAL (Hardened Hydration v7.3)
 * Full Guard against Safari Hydration Crashes.
 * Zero-render until client is bulletproof.
 */

export default function AssetAdmin() {
    const [ready, setReady] = useState(false);
    const [tab, setTab] = useState('personas');
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [personas, setPersonas] = useState<any[]>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [vault, setVault] = useState<any[]>([]);
    const [lost, setLost] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [target, setTarget] = useState<any>(null);
    const [msg, setMsg] = useState('');

    // 🛡️ SAFARI HYDRATION GUARD
    // This stops the page from trying to render anything until the client-side engine is 100% stable.
    useEffect(() => {
        setReady(true);
        loadData();
    }, []);

    const loadData = async () => {
        if (typeof window === 'undefined') return;
        setLoading(true);
        setError(null);
        
        try {
            const key = localStorage.getItem('admin_gasp_key') || '';
            const headers = { 'x-admin-key': key };
            
            // Waterfall fetching - safer for low-memory mobile Safari
            const pRes = await fetch('/api/admin/persona', { headers }).then(r => r.json());
            if (Array.isArray(pRes)) setPersonas(pRes);
            if (pRes.error) setError('CLEARANCE_FAILED');

            const fRes = await fetch('/api/admin/feed?all=true&limit=200', { headers }).then(r => r.json());
            if (fRes?.posts) setPosts(fRes.posts);

            const aRes = await fetch('/api/admin/assets', { headers }).then(r => r.json());
            if (aRes?.vault) setVault(aRes.vault);

            const lRes = await fetch('/api/admin/lostfiles', { headers }).then(r => r.json());
            if (lRes?.nodes) setLost(lRes.nodes);

        } catch (e) {
            setError('SYNC_ERROR');
        } finally {
            setLoading(false);
        }
    };

    const handleLink = async (assetUrl: string) => {
        if (!target) return;
        setMsg('LINKING...');
        try {
            const key = localStorage.getItem('admin_gasp_key') || '';
            const res = await fetch(target.type === 'persona' ? '/api/admin/persona' : '/api/admin/assets', {
                method: target.type === 'persona' ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
                body: JSON.stringify(target.type === 'persona' 
                    ? { personaId: target.id, update: { seed_image_url: assetUrl } }
                    : { id: target.id, type: 'post', assetUrl })
            });
            const data = await res.json();
            if (data.success) {
                setMsg('SUCCESS');
                setTarget(null);
                loadData();
            } else {
                setMsg('FAILED');
            }
        } catch {
            setMsg('ERROR');
        }
    };

    const isDead = (u: any) => !u || u.trim() === '' || u.includes('null');

    if (!ready) return null; // 🛡️ CRITICAL: Do not render on server

    const displayAssets = [...lost, ...vault.filter((v: any) => !lost.find((l: any) => l.key === v.key))];
    const filteredAssets = displayAssets.filter((a: any) => a.key.toLowerCase().includes(search.toLowerCase()));

    return (
        <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', fontFamily: 'monospace', fontSize: '12px' }}>
            {/* Minimal CSS-based Header to avoid Tailwind conflicts */}
            <div style={{ padding: '20px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ margin: 0, fontWeight: 900, fontSize: '18px', fontStyle: 'italic', color: '#ff00ff' }}>ASSET TERMINAL v7.3</h1>
                  <p style={{ margin: '5px 0 0', opacity: 0.5, fontSize: '10px' }}>{personas.length} personas / {posts.length} posts / {lost.length} lost nodes</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {msg && <span style={{ color: '#00f0ff' }}>[{msg}]</span>}
                    <button onClick={loadData} style={{ background: '#222', border: '1px solid #444', color: '#fff', padding: '5px 15px', borderRadius: '5px', fontSize: '10px' }}>
                        {loading ? 'SYNCING...' : 'REFRESH'}
                    </button>
                </div>
            </div>

            {/* TAB SELECTOR */}
            <div style={{ display: 'flex', gap: '10px', padding: '15px' }}>
                {['personas', 'posts', 'lostfiles', 'vault'].map(t => (
                    <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? '#00f0ff' : '#111', color: tab === t ? '#000' : '#888', border: 'none', padding: '8px 15px', borderRadius: '5px', fontWeight: 'bold', textTransform: 'uppercase', cursor: 'pointer' }}>
                        {t}
                    </button>
                ))}
            </div>

            <div style={{ padding: '15px' }}>
                
                {tab === 'personas' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '15px' }}>
                        {personas.map(p => {
                            const dead = isDead(p.seed_image_url);
                            return (
                                <div key={p.id} onClick={() => setTarget({ id: p.id, type: 'persona', name: p.name })} style={{ border: target?.id === p.id ? '2px solid #00f0ff' : '1px solid #222', borderRadius: '15px', padding: '10px', cursor: 'pointer' }}>
                                    <div style={{ aspectRatio: '1', backgroundColor: '#111', borderRadius: '10px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {!dead ? <img src={p.seed_image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#ff3333' }}>⚠ ORPHAN</span>}
                                    </div>
                                    <p style={{ margin: '10px 0 0', fontWeight: 'bold' }}>{p.name}</p>
                                    <p style={{ fontSize: '10px', opacity: 0.4 }}>{p.id.slice(0, 10)}</p>
                                </div>
                            );
                        })}
                    </div>
                )}

                {tab === 'posts' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {posts.map(p => {
                            const dead = p.content_type !== 'text' && isDead(p.content_url);
                            return (
                                <div key={p.id} onClick={() => setTarget({ id: p.id, type: 'post', name: p.id })} style={{ display: 'flex', gap: '15px', padding: '15px', border: target?.id === p.id ? '2px solid #00f0ff' : '1px solid #222', borderRadius: '15px' }}>
                                    <div style={{ width: '50px', height: '50px', backgroundColor: '#111', borderRadius: '8px', flexShrink: 0, overflow: 'hidden' }}>
                                        {!isDead(p.content_url) ? <img src={p.content_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '8px' }}>TEXT</span>}
                                    </div>
                                    <div style={{ overflow: 'hidden' }}>
                                        <p style={{ margin: 0, fontWeight: 'bold' }}>{p.personas?.name || p.persona_id.slice(0, 8)}</p>
                                        <p style={{ margin: 0, opacity: 0.5, fontSize: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.caption || 'No caption'}</p>
                                        {dead && <span style={{ color: '#ff3333', fontSize: '10px' }}>[DEAD LINK]</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {(tab === 'lostfiles' || tab === 'vault') && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '15px' }}>
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter images..." style={{ gridColumn: '1/-1', padding: '12px', background: '#111', color: '#fff', border: '1px solid #222', borderRadius: '10px' }} />
                        {(tab === 'lostfiles' ? lost : filteredAssets).map((a: any) => (
                            <div key={a.key} style={{ border: '1px solid #222', borderRadius: '15px', overflow: 'hidden', background: '#111' }}>
                                <img src={a.url} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} onClick={() => handleLink(a.url)} />
                                <div style={{ padding: '8px', fontSize: '8px', opacity: 0.3 }}>{a.key.split('/').pop()}</div>
                                <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <button onClick={() => handleLink(a.url)} disabled={!target} style={{ width: '100%', padding: '5px', background: target ? '#00f0ff' : '#222', color: target ? '#000' : '#444', border: 'none', borderRadius: '5px', fontSize: '8px', fontWeight: 'bold' }}>LINK</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}
