
async function test() {
    console.log('--- REPROBING OPENROUTER ---');
    const key = process.env.OPENROUTER_API_KEY;
    console.log('Key Sample:', key?.slice(0, 5) + '...');
    
    try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
                model: 'google/gemini-flash-1.5',
                messages: [{ role: 'user', content: 'hi' }]
            })
        });

        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Data:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
    }
}
test();

