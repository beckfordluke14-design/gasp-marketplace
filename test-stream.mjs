
async function testStream() {
    console.log('--- STARTING NEURAL PROBE ---');
    try {
        const res = await fetch('https://gasp.fun/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'hello' }],
                userId: 'guest-probe-' + Date.now(),
                personaId: 'isabella'
            })
        });

        console.log('Status:', res.status);
        if (!res.body) {
            console.log('No Body Available');
            return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            console.log('CHUNK:', JSON.stringify(chunk));
        }
    } catch (e) {
        console.error('Probe Error:', e.message);
    }
}

testStream();

