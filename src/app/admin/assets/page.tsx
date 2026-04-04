'use client';

import { useState, useEffect } from 'react';

/**
 * 🛰️ ULTIMATE POST EDITOR (Hardened Safari v7.4)
 * Sequentially loads all data to avoid Safari memory/thread crashes.
 * Uses 100% guarded rendering to prevent null-pointer exceptions.
 */

type Tab = 'personas' | 'posts' | 'lost' | 'vault';

export default function AssetAdmin() {
    const [ready, setReady] = useState(false);
    const [tab, setTab] = useState<Tab>('personas');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('Standby');
    const [search, setSearch] = useState('');
    
    // Data Buffers
    const [personas, setPersonas] = useState<any[]>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [vault, setVault] = useState<any[]>([]);
    const [lost, setLost] = useState<any[]>([]);
    
    // Interaction
    const [target, setTarget] = useState<any>(null);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        setReady(true);
        loadFlow();
    }, []);

    // 🧬 SEQUENTIAL LOAD FLOW - Stability for Mobile
    const loadFlow = async () => {
        if (loading) return;
        setLoading(true);
        setStatus('Initializing Link...');
        
        try {
            const key = localStorage.getItem('admin_gasp_key') || '';
            const headers = { 'x-admin-key': key };

            // 1. Sync Personas
            setStatus('Syncing Personas...');
            const pRes = await fetch('/api/admin/persona', { headers }).then(r => r.json());
            if (Array.isArray(pRes)) setPersonas(pRes);

            // 2. Sync Feed (Limited to 200 for stability)
            setStatus('Syncing Feed...');
            const fRes = await fetch('/api/admin/feed?all=true&limit=200', { headers }).then(r => r.json());
            if (fRes?.posts) setPosts(fRes.posts);

            // 3. Sync R2 Lost Files
            setStatus('Syncing Lost Node...');
            const lRes = await fetch('/api/admin/lostfiles', { headers }).then(r => r.json());
            if (lRes?.nodes) setLost(lRes.nodes);

            // 4. Sync R2 Vault
            setStatus('Syncing Vault...');
            const vRes = await fetch('/api/admin/assets', { headers }).then(r => r.json());
            if (vRes?.vault) setVault(vRes.vault);

            setStatus('All Nodes Synced.');
        } catch (e: any) {
            setStatus('ERR: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGraft = async (assetUrl: string) => {
        if (!target) return;
        setMsg('GRAFTING...');
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
            if (data?.success) {
                setMsg('SUCCESS');
                setTarget(null);
                setTimeout(loadFlow, 800);
            } else {
                setMsg('FAILED');
            }
        } catch {
            setMsg('NET_ERROR');
        }
    };

    const isDead = (u: any) => !u || u.trim() === '' || u.includes('null');

    // 🛡️ Guard against hydration mismatch
    if (!ready) return null;

    // Derived State
    const orphanP = personas.filter(p => isDead(p.seed_image_url));
    const orphanPosts = posts.filter(p => p.content_type !== 'text' && isDead(p.content_url));
    const allAssets = [...lost, ...vault.filter(v => !lost.find(l => l.key === v.key))];
    const filtered = allAssets.filter(a => (a.key || '').toLowerCase().includes(search.toLowerCase()));

    return (
        <div style={{ background: '#050505', minHeight: '100vh', color: '#ccc', fontFamily: 'monospace', fontSize: '11px', display: 'flex', flexDirection: 'column' }}>
            
            {/* STICKY HEADER */}
            <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(0,0,0,0.95)', borderBottom: '1px solid #1a1a1a', padding: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 900, fontStyle: 'italic', color: '#fff' }}>ASSET TERMINAL <span style={{ color: '#00f0ff' }}>v7.4</span></h1>
                        <p style={{ margin: '3px 0 0', fontSize: '9px', color: '#444' }}>{status}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {msg && <span style={{ color: '#00f0ff' }}>[{msg}]</span>}
                        <button onClick={loadFlow} disabled={loading} style={{ background: '#222', border: '1px solid #333', color: '#fff', padding: '5px 12px', borderRadius: '5px', opacity: loading ? 0.5 : 1 }}>
                            {loading ? '---' : 'REFRESH'}
                        </button>
                    </div>
                </div>

                {/* TARGET PIN */}
                {target && (
                    <div style={{ background: 'rgba(0,240,255,0.1)', border: '1px solid #00f0ff55', borderRadius: '8px', padding: '8px 12px', marginBottom: '15px', color: '#00f0ff', display: 'flex', justifyContent: 'space-between' }}>
                        <span>GRAFT TARGET: {target.name.slice(0, 20)}...</span>
                        <button onClick={() => setTarget(null)} style={{ background: 'none', border: 'none', color: '#00f0ff', cursor: 'pointer' }}>✕</button>
                    </div>
                )}

                {/* TAB SWITCHER */}
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '5px' }}>
                    {[
                        { id: 'personas', label: 'Personas', count: personas.length, warn: orphanP.length },
                        { id: 'posts', label: 'Posts', count: posts.length, warn: orphanPosts.length },
                        { id: 'lost', label: 'Lost', count: lost.length },
                        { id: 'vault', label: 'Vault', count: vault.length }
                    ].map(t => (
                        <button key={t.id} onClick={() => setTab(t.id as Tab)} style={{ 
                            background: tab === t.id ? '#00f0ff' : '#111', 
                            color: tab === t.id ? '#000' : '#888', 
                            border: 'none', 
                            padding: '8px 12px', 
                            borderRadius: '6px', 
                            fontWeight: 'bold', 
                            textTransform: 'uppercase', 
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                        }}>
                            {t.label} 
                            <span style={{ fontSize: '9px', opacity: 0.6 }}>{t.count}</span>
                            {t.warn > 0 && <span style={{ color: t.id === tab ? '#000' : '#ff5555' }}>⚠</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div style={{ flex: 1, padding: '15px' }}>
                
                {/* ── PERSONAS ── */}
                {tab === 'personas' && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {personas.map(p => {
                            const dead = isDead(p.seed_image_url);
                            return (
                                <div key={p.id} onClick={() => setTarget({ id: p.id, type: 'persona', name: p.name })} style={{ width: 'calc(33.33% - 7px)', minWidth: '100px', background: '#111', borderRadius: '12px', border: target?.id === p.id ? '2px solid #00f0ff' : '1px solid #222', boxSizing: 'border-box' }}>
                                    <div style={{ aspectRatio: '1', position: 'relative', overflow: 'hidden', borderRadius: '10px 10px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {!dead ? <img src={p.seed_image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#ff5555', fontSize: '20px' }}>⚠</span>}
                                        {target?.id === p.id && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,240,255,0.2)', border: '2px solid #00f0ff', boxSizing: 'border-box' }} />}
                                    </div>
                                    <div style={{ padding: '8px' }}>
                                        <p style={{ margin: 0, fontWeight: 'bold', color: '#fff', fontSize: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                                        <p style={{ margin: '3px 0 0', color: dead ? '#ff5555' : '#00ff00', fontSize: '8px' }}>{dead ? 'DEAD' : 'OK'}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── POSTS ── */}
                {tab === 'posts' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search captions..." style={{ background: '#111', border: '1px solid #222', color: '#fff', padding: '12px', borderRadius: '10px', outline: 'none' }} />
                        {posts.filter(p => !search || (p.caption || '').toLowerCase().includes(search.toLowerCase())).map(p => {
                            const dead = p.content_type !== 'text' && isDead(p.content_url);
                            return (
                                <div key={p.id} onClick={() => setTarget({ id: p.id, type: 'post', name: p.caption || p.id })} style={{ display: 'flex', gap: '12px', background: '#111', padding: '12px', borderRadius: '12px', border: target?.id === p.id ? '2px solid #00f0ff' : '1px solid #222' }}>
                                    <div style={{ width: '45px', height: '45px', background: '#000', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                                        {p.content_type === 'text' ? <div style={{ fontSize: '8px', textAlign: 'center', marginTop: '15px' }}>TXT</div> : (!dead ? <img src={p.content_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ fontSize: '18px', textAlign: 'center', marginTop: '10px', color: '#ff5555' }}>⚠</div>)}
                                    </div>
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <p style={{ margin: 0, fontWeight: 'bold', color: '#fff' }}>{p.personas?.name || 'Unknown'}</p>
                                        <p style={{ margin: '4px 0 0', color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.caption || 'No caption'}</p>
                                    </div>
                                    {dead && <span style={{ color: '#ff5555' }}>DEAD</span>}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── ASSETS (LOST & VAULT) ── */}
                {(tab === 'lost' || tab === 'vault') && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter asset keys..." style={{ width: '100%', background: '#111', border: '1px solid #222', color: '#fff', padding: '12px', borderRadius: '10px', outline: 'none', marginBottom: '10px' }} />
                        {(tab === 'lost' ? lost : filtered).map((a: any) => (
                            <div key={a.key} style={{ width: 'calc(50% - 5px)', background: '#111', borderRadius: '12px', border: '1px solid #222', overflow: 'hidden' }}>
                                <img src={a.url} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} onClick={() => handleGraft(a.url)} />
                                <div style={{ padding: '8px' }}>
                                    <p style={{ margin: 0, fontSize: '8px', color: '#444', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.key.split('/').pop()}</p>
                                    <button onClick={() => handleGraft(a.url)} disabled={!target} style={{ width: '100%', marginTop: '8px', background: target ? '#00f0ff' : '#222', color: target ? '#000' : '#444', border: 'none', borderRadius: '6px', padding: '6px', fontWeight: 'bold', fontSize: '9px' }}>
                                        {target ? 'LINK' : 'SELECT TARGET'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}
