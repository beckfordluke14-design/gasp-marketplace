
import fetch from 'node-fetch';

async function testOpenRouter() {
    console.log('--- TESTING OPENROUTER ---');
    try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
            },
            body: JSON.stringify({
                model: 'google/gemini-flash-1.5',
                messages: [{ role: 'user', content: 'hi' }]
            })
        });

        const data = await res.json();
        console.log('OpenRouter Response:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('OR Error:', e.message);
    }
}

testOpenRouter();

