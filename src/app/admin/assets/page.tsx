'use client';

import { useState, useEffect } from 'react';

/**
 * 🛰️ ASSET TERMINAL STAGE 2 DIAGNOSTIC
 * Adding State and Effect + Single sequential fetch.
 */

export default function AssetAdmin() {
    const [ready, setReady] = useState(false);
    const [personas, setPersonas] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('Standby');

    useEffect(() => {
        setReady(true);
        loadPersonas();
    }, []);

    const loadPersonas = async () => {
        setLoading(true);
        setStatus('Initializing Link...');
        try {
            const key = localStorage.getItem('admin_gasp_key') || '';
            const res = await fetch('/api/admin/persona', { 
                headers: { 'x-admin-key': key } 
            });
            const data = await res.json();
            
            if (Array.isArray(data)) {
                setPersonas(data);
                setStatus('Telemetry Received: ' + data.length + ' nodes');
            } else {
                setStatus('Signal Reject: ' + JSON.stringify(data));
            }
        } catch (e: any) {
            setStatus('Bridge Pulse Fail: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    if (!ready) return null;

    return (
        <div style={{ background: '#000', minHeight: '100vh', color: '#fff', padding: '40px', fontFamily: 'monospace' }}>
            <h1 style={{ color: '#00f0ff', marginBottom: '20px' }}>TERMINAL STAGE 2 // PERSONA_SYNC</h1>
            
            <div style={{ padding: '20px', border: '1px solid #333', background: '#111', borderRadius: '15px', marginBottom: '20px' }}>
                <p style={{ color: '#ffea00' }}>STATUS: {status}</p>
                <p style={{ fontSize: '10px', color: '#555' }}>Syncing Personas collection only.</p>
            </div>

            {loading ? (
                <p style={{ color: '#00f0ff' }}>Synchronizing...</p>
            ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {personas && personas.length > 0 ? personas.map((p: any) => (
                        <div key={p.id} style={{ padding: '10px', background: '#222', borderRadius: '10px', fontSize: '10px' }}>
                            {p.name || 'Unknown'}
                        </div>
                    )) : <p style={{ color: '#333' }}>No Data</p>}
                </div>
            )}
        </div>
    );
}
