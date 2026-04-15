const fetch = require('node-fetch');

async function probe() {
    console.log('🛰️ [Diagnostic] Starting Funnel API Probe...');
    try {
        const res = await fetch('http://localhost:3000/api/chat/funnel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'hello' }],
                userId: 'DEBUG_NODE',
                userName: 'Admin'
            })
        });

        console.log(`[Status]: ${res.status} ${res.statusText}`);
        const text = await res.text();
        console.log('[Raw Response]:', text);
    } catch (e) {
        console.error('[Probe Failed]:', e.message);
    }
}

probe();
