import { config } from 'dotenv';
config({ path: '.env.local' });

async function seed() {
    console.log('[Syndicate] Triggering Neural Pulse (Brave News)...');
    try {
        const res = await fetch('http://localhost:3000/api/news/curate');
        const data = await res.json();
        console.log('[Syndicate] Curation Results:', JSON.stringify(data, null, 2));
        process.exit(0);
    } catch (e) {
        console.error('[Syndicate] Failed to reach curation endpoint. Make sure dev server is on port 3000.');
        process.exit(1);
    }
}

seed();
