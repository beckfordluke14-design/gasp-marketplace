'use client';

import { useState, useEffect } from 'react';

/**
 * 🛰️ SOVEREIGN ASSET COMMAND (Hardened v7.5)
 * Feature: Vault-Crafting + Lazy Loading for Mobile Stability.
 * Purpose: Linking R2 nodes to Personas/Posts/Vaults without crashing Safari.
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
    const [limit, setLimit] = useState(30); // 🛡️ Safari Memory Guard
    
    // Interaction
    const [target, setTarget] = useState<any>(null);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        setReady(true);
        loadFlow();
    }, []);

    const loadFlow = async () => {
        if (loading) return;
        setLoading(true);
        setStatus('Initializing Link...');
        try {
            const key = localStorage.getItem('admin_gasp_key') || '';
            const headers = { 'x-admin-key': key };

            setStatus('Syncing Personas...');
            const pRes = await fetch('/api/admin/persona', { headers }).then(r => r.json());
            if (Array.isArray(pRes)) setPersonas(pRes);

            setStatus('Syncing Posts...');
            const fRes = await fetch('/api/admin/feed?all=true&limit=300', { headers }).then(r => r.json());
            if (fRes?.posts) setPosts(fRes.posts);

            setStatus('Syncing Lost Node...');
            const lRes = await fetch('/api/admin/lostfiles', { headers }).then(r => r.json());
            if (lRes?.nodes) setLost(lRes.nodes);

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

    const handleAction = async (assetUrl: string, actionType: 'link' | 'vault') => {
        if (!target) return;
        setMsg('COMMITTING...');
        try {
            const key = localStorage.getItem('admin_gasp_key') || '';
            const payload = actionType === 'vault' 
                ? { action: 'create_vault', personaId: target.id, assetUrl }
                : (target.type === 'persona' 
                    ? { personaId: target.id, update: { seed_image_url: assetUrl } }
                    : { id: target.id, type: 'post', assetUrl });

            const endpoint = actionType === 'vault' ? '/api/admin/assets' : (target.type === 'persona' ? '/api/admin/persona' : '/api/admin/assets');
            const method = (actionType === 'vault' || target.type === 'post') ? 'POST' : 'PATCH';

            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data?.success) {
                setMsg('✅ SYNCED');
                if (actionType === 'link') setTarget(null);
                setTimeout(loadFlow, 800);
            } else {
                setMsg('❌ REJECTED');
            }
        } catch {
            setMsg('NET_ERROR');
        }
    };

    const isDead = (u: any) => !u || u.trim() === '' || u.includes('null');

    if (!ready) return null;

    // Filter Logic
    const orphanP = personas.filter(p => isDead(p.seed_image_url));
    const orphanPosts = posts.filter(p => p.content_type !== 'text' && isDead(p.content_url));
    const allAssets = [...lost, ...vault.filter((v: any) => !lost.find((l: any) => l.key === v.key))];
    const filtered = allAssets.filter((a: any) => (a.key || '').toLowerCase().includes(search.toLowerCase()));

    return (
        <div style={{ background: '#000', minHeight: '100vh', color: '#ccc', fontFamily: 'monospace', fontSize: '11px', display: 'flex', flexDirection: 'column' }}>
            
            {/* STICKY CONTROL HUB */}
            <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(0,0,0,0.9)', borderBottom: '1px solid #222', padding: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: '#fff' }}>ASSET COMMAND <span style={{ color: '#00f0ff' }}>v7.5</span></h1>
                        <p style={{ margin: '3px 0 0', fontSize: '8px', color: '#555' }}>{status}</p>
                    </div>
                </div>

                {target && (
                    <div style={{ background: 'rgba(0,240,255,0.05)', border: '1px solid #00f0ff44', borderRadius: '10px', padding: '10px', marginBottom: '12px', color: '#00f0ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '8px', display: 'block', opacity: 0.5 }}>TARGET ACTIVE:</span>
                          <span style={{ fontWeight: 'bold' }}>{target.name.slice(0, 25)}</span>
                        </div>
                        <button onClick={() => setTarget(null)} style={{ background: '#00f0ff', border: 'none', color: '#000', borderRadius: '5px', padding: '4px 8px', fontWeight: 'bold' }}>CLEAR</button>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', paddingBottom: '5px' }}>
                    {[
                        { id: 'personas', label: 'Personas', count: personas.length, warn: orphanP.length },
                        { id: 'posts', label: 'Posts', count: posts.length, warn: orphanPosts.length },
                        { id: 'lost', label: 'Lost', count: lost.length },
                        { id: 'vault', label: 'Vault', count: vault.length }
                    ].map(t => (
                        <button key={t.id} onClick={() => { setTab(t.id as Tab); setLimit(30); }} style={{ 
                            background: tab === t.id ? '#00f0ff' : '#111', 
                            color: tab === t.id ? '#000' : '#888', 
                            border: 'none', padding: '10px 15px', borderRadius: '8px', fontWeight: 'bold', textTransform: 'uppercase', whiteSpace: 'nowrap'
                        }}>
                            {t.label} 
                            {t.warn > 0 && <span style={{ marginLeft: '5px', color: tab === t.id ? '#000' : '#ff00ff' }}>!</span>}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ flex: 1, padding: '15px' }}>
                
                {/* ── PERSONAS ── */}
                {tab === 'personas' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                        {personas.map(p => {
                            const dead = isDead(p.seed_image_url);
                            return (
                                <div key={p.id} onClick={() => setTarget({ id: p.id, type: 'persona', name: p.name })} style={{ background: '#0a0a0a', borderRadius: '15px', border: target?.id === p.id ? '2px solid #00f0ff' : '1px solid #111', overflow: 'hidden' }}>
                                    <div style={{ aspectRatio: '1', position: 'relative' }}>
                                        {!dead ? <img src={p.seed_image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff00ff' }}>⚠</div>}
                                    </div>
                                    <div style={{ padding: '8px', textAlign: 'center' }}>
                                        <p style={{ margin: 0, fontSize: '9px', fontWeight: 'bold', truncate: 'true' }}>{p.name.split(' ')[0]}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── POSTS ── */}
                {tab === 'posts' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter..." style={{ background: '#111', border: '1px solid #222', color: '#fff', padding: '12px', borderRadius: '12px', outline: 'none' }} />
                        {posts.filter(p => !search || (p.caption || '').toLowerCase().includes(search.toLowerCase())).slice(0, 50).map(p => {
                            const isSystem = !p.personas?.id || p.persona_id === '00000000-0000-0000-0000-000000000000';
                            const dead = p.content_type !== 'text' && isDead(p.content_url);
                            return (
                                <div key={p.id} onClick={() => setTarget({ id: p.id, type: 'post', name: p.caption || p.id })} style={{ display: 'flex', gap: '10px', background: isSystem ? '#050505' : '#111', padding: '10px', borderRadius: '15px', border: target?.id === p.id ? '2px solid #00f0ff' : (dead ? '1px solid #400' : '1px solid #222') }}>
                                    <div style={{ width: '40px', height: '40px', background: '#000', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
                                        {!dead ? <img src={p.content_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" /> : <div style={{ fontSize: '8px', textAlign: 'center', paddingTop: '15px' }}>TXT</div>}
                                    </div>
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '10px', color: isSystem ? '#444' : '#fff' }}>{isSystem ? 'SYSTEM' : p.personas?.name}</p>
                                        <p style={{ margin: '2px 0 0', opacity: 0.4, fontSize: '9px', truncate: 'true' }}>{p.caption || 'No caption'}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── ASSETS (LOST & VAULT) ── */}
                {(tab === 'lost' || tab === 'vault') && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ width: '100%', background: '#111', border: '1px solid #222', color: '#fff', padding: '12px', borderRadius: '12px', outline: 'none' }} />
                        {(tab === 'lost' ? lost : filtered).slice(0, limit).map((a: any) => (
                            <div key={a.key} style={{ width: 'calc(50% - 5px)', background: '#0a0a0a', borderRadius: '15px', border: '1px solid #111', overflow: 'hidden' }}>
                                <img src={a.url} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} loading="lazy" />
                                <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <button onClick={() => handleAction(a.url, 'link')} disabled={!target} style={{ background: target ? '#00f0ff' : '#222', color: target ? '#000' : '#444', border: 'none', borderRadius: '8px', padding: '8px', fontWeight: 'bold', fontSize: '9px' }}>
                                        LINK AS MAIN
                                    </button>
                                    <button onClick={() => handleAction(a.url, 'vault')} disabled={!target || target.type !== 'persona'} style={{ background: (target && target.type === 'persona') ? '#ff00ff' : '#222', color: (target && target.type === 'persona') ? '#fff' : '#444', border: 'none', borderRadius: '8px', padding: '8px', fontWeight: 'bold', fontSize: '9px' }}>
                                        ADD TO VAULT
                                    </button>
                                </div>
                            </div>
                        ))}
                        {limit < (tab === 'lost' ? lost.length : filtered.length) && (
                            <button onClick={() => setLimit(l => l + 30)} style={{ width: '100%', padding: '20px', background: '#111', border: 'none', color: '#fff', borderRadius: '15px', marginTop: '10px' }}>LOAD NEXT 30 ASSETS</button>
                        )}
                    </div>
                )}

            </div>
            {msg && <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: '#00f0ff', color: '#000', padding: '10px 20px', borderRadius: '30px', fontWeight: 'black', zIndex: 1000, boxShadow: '0 10px 50px rgba(0,240,255,0.5)' }}>{msg}</div>}
        </div>
    );
}
