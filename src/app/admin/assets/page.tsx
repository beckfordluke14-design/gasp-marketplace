'use client';

import { useState, useEffect } from 'react';

/**
 * 🏟️ SOVEREIGN INTELLIGENCE SUITE (v8.0)
 * The Ultimate Persona & Asset Command Terminal.
 * Hybrid Desktop/Mobile interface with Deep-Inspector protocols.
 */

type Tab = 'global' | 'lost' | 'birth';

export default function AssetAdmin() {
    const [ready, setReady] = useState(false);
    const [view, setView] = useState<Tab>('global');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('Standby');
    const [search, setSearch] = useState('');
    
    // Core Data
    const [personas, setPersonas] = useState<any[]>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [lost, setLost] = useState<any[]>([]);
    const [vault, setVault] = useState<any[]>([]);
    
    // Modal / Inspector State
    const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
    const [msg, setMsg] = useState('');
    const [limit, setLimit] = useState(30);
    const [birthName, setBirthName] = useState('');
    const [birthUrl, setBirthUrl] = useState('');

    useEffect(() => {
        setReady(true);
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const k = localStorage.getItem('admin_gasp_key') || '';
        const h = { 'x-admin-key': k };
        try {
            setStatus('Syncing Nodes...');
            const pRes = await fetch('/api/admin/persona', { headers: h }).then(r => r.json());
            const fRes = await fetch('/api/admin/feed?all=true&limit=500', { headers: h }).then(r => r.json());
            const lRes = await fetch('/api/admin/lostfiles', { headers: h }).then(r => r.json());
            const vRes = await fetch('/api/admin/assets', { headers: h }).then(r => r.json());

            if (Array.isArray(pRes)) setPersonas(pRes);
            if (fRes?.posts) setPosts(fRes.posts);
            if (lRes?.nodes) setLost(lRes.nodes);
            if (vRes?.vault) setVault(vRes.vault);
            
            setStatus('Synchronized.');
        } catch (e: any) { setStatus('Error: ' + e.message); }
        setLoading(false);
    };

    const runAction = async (payload: any) => {
        setMsg('COMMITTING...');
        const k = localStorage.getItem('admin_gasp_key') || '';
        try {
            const res = await fetch('/api/admin/assets', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': k },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                setMsg('✓ SUCCESS');
                setTimeout(loadData, 500);
            } else { setMsg('✗ FAILED'); }
        } catch { setMsg('✗ ERR'); }
    };

    const birthPersona = async () => {
        if (!birthName || !birthUrl) return;
        setMsg('BIRTHING...');
        const k = localStorage.getItem('admin_gasp_key') || '';
        try {
            const res = await fetch('/api/admin/persona', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': k },
                body: JSON.stringify({ name: birthName, seed_image_url: birthUrl })
            });
            const data = await res.json();
            if (data.success) {
                setMsg('★ BORN: ' + birthName);
                setBirthName('');
                setBirthUrl('');
                loadData();
            }
        } catch { setMsg('✗ ERR'); }
    };

    const isDead = (u: any) => !u || u.trim() === '' || u.includes('null');

    if (!ready) return null;

    const selectedPersona = personas.find(p => p.id === selectedPersonaId);
    const personaPosts = posts.filter(p => p.persona_id === selectedPersonaId);
    // 🛡️ NORMALIZE: lost nodes use 'id', vault nodes use 'key'. Unify both.
    const allAssets = [
        ...lost.map((n: any) => ({ key: n.id || n.key || '', url: n.url })),
        ...vault.filter((v: any) => !lost.find((l: any) => (l.id || l.key) === v.key)).map((v: any) => ({ key: v.key || '', url: v.url }))
    ];
    const displayAssets = allAssets.filter(a => (a.key || '').toLowerCase().includes((search || '').toLowerCase()));

    return (
        <div style={{ background: '#000', minHeight: '100vh', color: '#ccc', fontFamily: 'monospace', fontSize: '11px', display: 'flex', flexDirection: 'column' }}>
            
            {/* HUB HEADER */}
            <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(0,0,0,0.9)', borderBottom: '1px solid #111', padding: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '14px', fontWeight: 'black', color: '#fff' }}>SOVEREIGN INTELLIGENCE <span style={{ color: '#00f0ff' }}>HUB v8</span></h1>
                        <p style={{ margin: '2px 0 0', fontSize: '9px', color: '#444' }}>{status} // {msg}</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    <button onClick={() => { setView('global'); setSelectedPersonaId(null); }} style={{ background: view === 'global' && !selectedPersonaId ? '#00f0ff' : '#111', color: view === 'global' && !selectedPersonaId ? '#000' : '#888', border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold' }}>GLOBAL</button>
                    <button onClick={() => setView('lost')} style={{ background: view === 'lost' ? '#ff00ff' : '#111', color: view === 'lost' ? '#fff' : '#888', border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold' }}>SCAN LOST</button>
                    {selectedPersonaId && <button style={{ background: '#333', color: '#00f0ff', border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold' }}>EDITING: {selectedPersona?.name}</button>}
                </div>
            </div>

            <div style={{ flex: 1, padding: '15px' }}>

                {/* ── GLOBAL ROSTER VIEW ── */}
                {view === 'global' && !selectedPersonaId && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                        {personas.map(p => (
                            <div key={p.id} onClick={() => setSelectedPersonaId(p.id)} style={{ background: '#0a0a0a', borderRadius: '12px', border: '1px solid #111', overflow: 'hidden' }}>
                                <div style={{ aspectRatio: '1', position: 'relative' }}>
                                    <img src={p.seed_image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                                </div>
                                <div style={{ padding: '8px', textAlign: 'center' }}>
                                    <p style={{ margin: 0, fontSize: '9px', fontWeight: 'bold' }}>{p.name.split(' ')[0]}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── PEER-LEVEL INSPECTOR ─ */}
                {selectedPersonaId && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        
                        {/* 1. HERO CONTROLS */}
                        <div style={{ display: 'flex', gap: '15px', background: '#111', padding: '15px', borderRadius: '20px', alignItems: 'center' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '15px', overflow: 'hidden', border: '1px solid #00f0ff' }}>
                                <img src={selectedPersona?.seed_image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div>
                                <h2 style={{ color: '#fff', fontSize: '16px', margin: 0 }}>{selectedPersona?.name}</h2>
                                <p style={{ fontSize: '9px', color: '#555', margin: '4px 0' }}>{selectedPersona?.id}</p>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                    <button onClick={() => setView('lost')} style={{ background: '#00f0ff', color: '#000', border: 'none', padding: '4px 8px', borderRadius: '5px', fontSize: '9px', fontWeight: 'bold' }}>SWAP HERO</button>
                                    <button onClick={() => setSelectedPersonaId(null)} style={{ background: '#222', color: '#888', border: 'none', padding: '4px 8px', borderRadius: '5px', fontSize: '9px' }}>CLOSE</button>
                                </div>
                            </div>
                        </div>

                        {/* 2. COLLECTION MANAGEMENT */}
                        <div style={{ borderTop: '1px solid #111', paddingTop: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h3 style={{ fontSize: '12px', fontWeight: 'black', color: '#fff' }}>NODAL INVENTORY</h3>
                                <button onClick={() => setView('lost')} style={{ background: '#ff00ff', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '9px', fontWeight: 'bold' }}>+ ADD ASSETS</button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {personaPosts.filter(p => !isDead(p.content_url) && p.content_type !== 'text').map(p => (
                                    <div key={p.id} style={{ display: 'flex', gap: '12px', background: '#080808', padding: '12px', borderRadius: '15px', border: '1px solid #111' }}>
                                        <div style={{ width: '60px', height: '60px', background: '#111', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
                                            <img src={p.content_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                                <button onClick={() => runAction({ id: p.id, action: 'toggle_gallery' })} style={{ background: p.is_gallery ? '#ffea00' : '#222', color: p.is_gallery ? '#000' : '#444', border: 'none', padding: '6px 8px', borderRadius: '4px', fontSize: '8px', fontWeight: 'bold' }}>GALLERY</button>
                                                <button onClick={() => runAction({ id: p.id, action: 'toggle_vault' })} style={{ background: p.is_vault ? '#ff00ff' : '#222', color: p.is_vault ? '#fff' : '#444', border: 'none', padding: '6px 8px', borderRadius: '4px', fontSize: '8px', fontWeight: 'bold' }}>VAULT</button>
                                                <button onClick={() => runAction({ id: selectedPersonaId, type: 'persona', assetUrl: p.content_url })} style={{ background: '#00f0ff', color: '#000', border: 'none', padding: '6px 8px', borderRadius: '4px', fontSize: '8px', fontWeight: 'bold' }}>HERO</button>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '9px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.caption || 'No caption'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                )}

                {/* ── LOST SCAN / ASSET PICKER ── */}
                {view === 'lost' && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ width: '100%', position: 'sticky', top: '130px', zIndex: 10 }}>
                           <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter Search..." style={{ width: '100%', background: '#111', border: '1px solid #333', color: '#fff', padding: '15px', borderRadius: '15px', outline: 'none' }} />
                        </div>
                        {displayAssets.slice(0, limit).map((a: any) => (
                            <div key={a.key} style={{ width: 'calc(50% - 5px)', background: birthUrl === a.url ? '#0d1a0d' : '#0a0a0a', borderRadius: '15px', border: birthUrl === a.url ? '1px solid #00ff00' : '1px solid #111', overflow: 'hidden' }}>
                                <img src={a.url} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} loading="lazy" />
                                <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {selectedPersonaId ? (
                                        <>
                                            <button onClick={() => runAction({ id: selectedPersonaId, type: 'persona', assetUrl: a.url })} style={{ background: '#00f0ff', color: '#000', border: 'none', borderRadius: '6px', padding: '8px', fontWeight: 'bold', fontSize: '8px' }}>SET AS HERO</button>
                                            <button onClick={() => runAction({ personaId: selectedPersonaId, assetUrl: a.url, action: 'create_gallery' })} style={{ background: '#ffea00', color: '#000', border: 'none', borderRadius: '6px', padding: '8px', fontWeight: 'bold', fontSize: '8px' }}>+ GALLERY</button>
                                            <button onClick={() => runAction({ personaId: selectedPersonaId, assetUrl: a.url, action: 'create_vault' })} style={{ background: '#ff00ff', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px', fontWeight: 'bold', fontSize: '8px' }}>+ VAULT</button>
                                        </>
                                    ) : (
                                        <button onClick={() => setBirthUrl(a.url)} style={{ background: birthUrl === a.url ? '#00ff00' : '#fff', color: '#000', border: 'none', borderRadius: '6px', padding: '10px', fontWeight: 'bold', fontSize: '9px' }}>
                                            {birthUrl === a.url ? '★ STAGED' : 'BIRTH PERSONA'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {/* BIRTH FORM - Shows when an image is staged */}
                        {birthUrl && !selectedPersonaId && (
                            <div style={{ width: '100%', background: '#0d1a0d', border: '1px solid #00ff00', borderRadius: '15px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <p style={{ margin: 0, color: '#00ff00', fontWeight: 'bold' }}>BIRTH PROTOCOL // NAME THE NODE</p>
                                <input value={birthName} onChange={e => setBirthName(e.target.value)} placeholder="Enter sovereign name..." style={{ background: '#111', border: '1px solid #00ff00', color: '#fff', padding: '12px', borderRadius: '10px', outline: 'none' }} />
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={birthPersona} style={{ flex: 1, background: '#00ff00', color: '#000', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: 'bold' }}>★ BIRTH</button>
                                    <button onClick={() => { setBirthUrl(''); setBirthName(''); }} style={{ background: '#222', color: '#888', border: 'none', borderRadius: '10px', padding: '12px' }}>CANCEL</button>
                                </div>
                            </div>
                        )}
                        {limit < displayAssets.length && (
                            <button onClick={() => setLimit(l => l + 30)} style={{ width: '100%', padding: '20px', background: '#111', border: 'none', borderRadius: '15px', color: '#00f0ff', fontWeight: 'bold' }}>SCAN MORE NODES</button>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
