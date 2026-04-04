'use client';

export default function AssetAdmin() {
    return (
        <div style={{ background: '#000', minHeight: '100vh', color: '#fff', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '40px', textAlign: 'center' }}>
            <h1 style={{ color: '#00f0ff', fontSize: '24px', fontWeight: 900 }}>ASSET TERMINAL</h1>
            <p style={{ color: '#555', fontSize: '12px' }}>Static render test — no hooks, no API calls.</p>
            <p style={{ color: '#55ff55', fontSize: '12px' }}>✓ If you see this, the page itself is not crashing. The error is in the data-loading code.</p>
            <p style={{ color: '#ff5555', fontSize: '12px' }}>✗ If you see the Application Error, the crash is at the module or provider level.</p>
        </div>
    );
}
