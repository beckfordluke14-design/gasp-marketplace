'use client';

import { useState, useEffect } from 'react';

/**
 * 🏟️ SOVEREIGN INTELLIGENCE HUB v8.3
 * The Complete Identity Overhaul Suite.
 * Integrated Soft-Delete, Inter-Persona Move, and Birth from Post.
 */

export default function AssetAdmin() {
    const [ready, setReady] = useState(false);
    const [view, setView] = useState('global');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('Standby');
    const [search, setSearch] = useState('');
    
    // Core Data
    const [personas, setPersonas] = useState<any[]>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [lost, setLost] = useState<any[]>([]);
    const [vault, setVault] = useState<any[]>([]);
    
    // Interaction State
    const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
    const [msg, setMsg] = useState('');
    const [limit, setLimit] = useState(30);
    const [birthName, setBirthName] = useState('');
    const [birthUrl, setBirthUrl] = useState('');
    const [actionId, setActionId] = useState<string | null>(null); // To toggle post action menu

    useEffect(() => {
        setReady(true);
        loadData();
    }, []);

    const isDead = (u: any) => !u || u.trim() === '' || u.includes('null');

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
        // Guard: hero/gallery/vault actions all require a persona target
        const needsPersona = ['create_gallery', 'create_vault'].includes(payload.action || '') || (payload.type === 'persona');
        if (needsPersona && !payload.id && !payload.personaId) {
            setMsg('✗ SELECT A PERSONA FIRST');
            return;
        }
        setMsg('COMMITTING...');
        const k = localStorage.getItem('admin_gasp_key') || '';
        try {
            const res = await fetch('/api/admin/assets', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': k },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                setMsg('✓ SUCCESS — ' + (payload.action || payload.type || 'DONE').toUpperCase());
                setActionId(null);
                setTimeout(loadData, 500);
            } else { setMsg('✗ ' + (data.error || 'FAILED')); }
        } catch (err: any) { setMsg('✗ ERR: ' + err.message); }
    };

    const birthFromPost = async (url: string) => {
        setBirthUrl(url);
        setBirthName('');
        setMsg('★ BIRTH COMMAND STAGED');
    };

    const birthSubmit = async () => {
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
                setBirthUrl('');
                setBirthName('');
                loadData();
            }
        } catch { setMsg('✗ ERR'); }
    };

    if (!ready) return null;

    const selectedPersona = personas.find(p => p.id === selectedPersonaId);
    const personaPosts = posts.filter(p => p.persona_id === selectedPersonaId && !p.caption?.includes('DELETED'));
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
                        <h1 style={{ margin: 0, fontSize: '14px', fontWeight: 'black', color: '#fff' }}>SOVEREIGN HUB <span style={{ color: '#00f0ff' }}>v8.3</span></h1>
                        <p style={{ margin: '2px 0 0', fontSize: '9px', color: '#444' }}>{status} // {msg}</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    <button onClick={() => { setView('global'); setSelectedPersonaId(null); }} style={{ background: view === 'global' && !selectedPersonaId ? '#00f0ff' : '#111', color: view === 'global' && !selectedPersonaId ? '#000' : '#888', border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold' }}>GLOBAL</button>
                    <button onClick={() => setView('lost')} style={{ background: view === 'lost' ? '#ff00ff' : '#111', color: view === 'lost' ? '#fff' : '#888', border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold' }}>SCAN LOST</button>
                    {selectedPersonaId && <button style={{ background: '#333', color: '#00f0ff', border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold' }}>EDIT: {selectedPersona?.name}</button>}
                </div>
            </div>

            <div style={{ flex: 1, padding: '15px' }}>

                {/* ── GLOBAL ROSTER VIEW ── */}
                {view === 'global' && !selectedPersonaId && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                        {personas.map(p => (
                            <div key={p.id} onClick={() => setSelectedPersonaId(p.id)} style={{ background: '#0a0a0a', borderRadius: '12px', border: '1px solid #111', overflow: 'hidden' }}>
                                <img src={p.seed_image_url} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} loading="lazy" />
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
                        <div style={{ display: 'flex', gap: '15px', background: '#111', padding: '15px', borderRadius: '20px', alignItems: 'center' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '15px', overflow: 'hidden', border: '1px solid #00f0ff' }}>
                                <img src={selectedPersona?.seed_image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div>
                                <h2 style={{ color: '#fff', fontSize: '16px', margin: 0 }}>{selectedPersona?.name}</h2>
                                <button onClick={() => setSelectedPersonaId(null)} style={{ background: '#222', color: '#888', border: 'none', padding: '6px 12px', borderRadius: '5px', fontSize: '10px', marginTop: '10px' }}>BACK TO FLEET</button>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #111', paddingTop: '15px' }}>
                            <h3 style={{ fontSize: '12px', fontWeight: 'black', color: '#fff', marginBottom: '15px' }}>NODAL INVENTORY</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {personaPosts.filter(p => !isDead(p.content_url) && p.content_type !== 'text').map(p => (
                                    <div key={p.id} style={{ background: '#080808', padding: '12px', borderRadius: '15px', border: actionId === p.id ? '1px solid #00f0ff' : '1px solid #111' }}>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <div style={{ width: '60px', height: '60px', background: '#111', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
                                                <img src={p.content_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                                    <button onClick={() => runAction({ id: p.id, action: 'toggle_gallery' })} style={{ background: p.is_gallery ? '#ffea00' : '#111', color: p.is_gallery ? '#000' : '#444', border: 'none', padding: '6px' }}>GALLERY</button>
                                                    <button onClick={() => runAction({ id: p.id, action: 'toggle_vault' })} style={{ background: p.is_vault ? '#ff00ff' : '#111', color: p.is_vault ? '#fff' : '#444', border: 'none', padding: '6px' }}>VAULT</button>
                                                    <button onClick={() => runAction({ id: selectedPersonaId, type: 'persona', assetUrl: p.content_url })} style={{ background: '#00f0ff', color: '#000', border: 'none', padding: '6px' }}>HERO</button>
                                                    <button onClick={() => setActionId(actionId === p.id ? null : p.id)} style={{ background: '#222', color: '#888', border: 'none', padding: '6px' }}>☰ CMD</button>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* EXPANDED CMD MENU */}
                                        {actionId === p.id && (
                                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #222', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                                <button onClick={() => runAction({ id: p.id, action: 'hide_post' })} style={{ background: '#400', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px' }}>✘ HIDE (SOFT DELETE)</button>
                                                <button onClick={() => birthFromPost(p.content_url)} style={{ background: '#fff', color: '#000', border: 'none', padding: '8px', borderRadius: '6px' }}>★ BIRTH NEW PERSONA</button>
                                                <div style={{ gridColumn: '1/-1', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '9px', color: '#444' }}>TRANSFER:</span>
                                                    <select onChange={(e) => runAction({ id: p.id, targetPersonaId: e.target.value, action: 'move_to_persona' })} style={{ flex: 1, background: '#111', border: '1px solid #333', color: '#888', padding: '6px' }}>
                                                        <option value="">Choose Target...</option>
                                                        {personas.filter(ps => ps.id !== selectedPersonaId).map(ps => <option key={ps.id} value={ps.id}>{ps.name}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── LOST SCAN / FORM VIEW ── */}
                {view === 'lost' && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        
                        {/* 🛡️ PERSONA TARGET SELECTOR — Required for SET AS HERO to work */}
                        <div style={{ width: '100%', background: '#0a1a0a', border: `2px solid ${selectedPersonaId ? '#00f0ff' : '#ff4444'}`, borderRadius: '15px', padding: '12px 15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '9px', color: selectedPersonaId ? '#00f0ff' : '#ff4444', fontWeight: 'bold', whiteSpace: 'nowrap' }}>TARGET PERSONA:</span>
                            <select 
                                value={selectedPersonaId || ''} 
                                onChange={e => setSelectedPersonaId(e.target.value || null)}
                                style={{ flex: 1, background: '#111', border: '1px solid #333', color: '#fff', padding: '8px', borderRadius: '8px', fontSize: '11px' }}
                            >
                                <option value="">── Select who to assign images to ──</option>
                                {personas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            {selectedPersonaId && <span style={{ fontSize: '9px', color: '#00f0ff', whiteSpace: 'nowrap' }}>✓ READY</span>}
                        </div>

                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter by filename..." style={{ width: '100%', background: '#111', border: '1px solid #333', color: '#fff', padding: '15px', borderRadius: '15px' }} />
                        {displayAssets.slice(0, limit).map((a: any) => (
                            <div key={a.key} style={{ width: 'calc(50% - 5px)', background: birthUrl === a.url ? '#0d1a0d' : '#0a0a0a', borderRadius: '15px', border: birthUrl === a.url ? '1px solid #00ff00' : '1px solid #111' }}>
                                <img src={a.url} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} loading="lazy" />
                                <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {selectedPersonaId ? (
                                        <>
                                            <button onClick={() => runAction({ id: selectedPersonaId, type: 'persona', assetUrl: a.url })} style={{ background: '#00f0ff', color: '#000', border: 'none', borderRadius: '6px', padding: '8px' }}>SET AS HERO</button>
                                            <button onClick={() => runAction({ personaId: selectedPersonaId, assetUrl: a.url, action: 'create_gallery' })} style={{ background: '#ffea00', color: '#000', border: 'none', borderRadius: '6px', padding: '8px' }}>+ GALLERY</button>
                                            <button onClick={() => runAction({ personaId: selectedPersonaId, assetUrl: a.url, action: 'create_vault' })} style={{ background: '#ff00ff', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px' }}>+ VAULT</button>
                                        </>
                                    ) : (
                                        <button onClick={() => setBirthUrl(a.url)} style={{ background: birthUrl === a.url ? '#00ff00' : '#fff', color: '#000', border: 'none', borderRadius: '6px', padding: '10px' }}>{birthUrl === a.url ? '★ STAGED' : 'BIRTH PERSONA'}</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* BIRTH OVERLAY */}
                {birthUrl && (
                    <div style={{ position: 'fixed', bottom: '20px', left: '20px', right: '20px', background: '#0d1a0d', border: '1px solid #00ff00', borderRadius: '20px', padding: '20px', zIndex: 1000 }}>
                        <p style={{ margin: 0, color: '#00ff00', fontWeight: 'bold', marginBottom: '10px' }}>BIRTH PROTOCOL // NAME THE NODE</p>
                        <input value={birthName} onChange={e => setBirthName(e.target.value)} placeholder="Persona name..." style={{ width: '100%', background: '#111', border: '1px solid #00ff00', color: '#fff', padding: '15px', borderRadius: '15px', marginBottom: '10px' }} />
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={birthSubmit} style={{ flex: 1, background: '#00ff00', color: '#000', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: 'bold' }}>★ BIRTH</button>
                            <button onClick={() => { setBirthUrl(''); setBirthName(''); }} style={{ background: '#222', color: '#888', border: 'none', borderRadius: '10px', padding: '12px' }}>CANCEL</button>
                        </div>
                    </div>
                )}

                {view === 'lost' && limit < displayAssets.length && (
                    <button onClick={() => setLimit(l => l + 30)} style={{ width: '100%', padding: '20px', background: '#111', border: 'none', color: '#00f0ff', fontWeight: 'bold', borderRadius: '15px', marginTop: '10px' }}>SCAN MORE NODES</button>
                )}

            </div>
            {msg && <div style={{ position: 'fixed', top: '130px', left: '50%', transform: 'translateX(-50%)', background: '#00f0ff', color: '#000', padding: '5px 15px', borderRadius: '10px', fontWeight: 'black', zIndex: 1000 }}>{msg}</div>}
        </div>
    );
}
