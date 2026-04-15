const fetch = require('node-fetch');

async function verify() {
    const key = 'xai-1ZhEieKrboSKXnJJL4SrePGDnsR6QXW8g34nwcXtoYWw00rwJrpmZWeR4Qc27jN6Ra6WdZqabTiOnSW0';
    console.log('🛰️ [Diagnostic] Probing official xAI API...');

    try {
        const res = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
                model: 'grok-2-mini',
                messages: [
                    { role: 'system', content: 'You are a test node.' },
                    { role: 'user', content: 'Respond with "LINK ACTIVE"' }
                ]
            })
        });

        const data = await res.json();
        if (data.choices && data.choices[0]) {
            console.log('✅ [STATUS]: SUCCESS');
            console.log('[REPLY]:', data.choices[0].message.content);
        } else {
            console.error('❌ [STATUS]: FAILED');
            console.log('[ERROR]:', JSON.stringify(data));
        }
    } catch (e) {
        console.error('❌ [CRITICAL FAIL]:', e.message);
    }
}

verify();
