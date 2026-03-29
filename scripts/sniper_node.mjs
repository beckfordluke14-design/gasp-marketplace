import pkg from 'pg';
const { Pool } = pkg;

/**
 * 🛰️ THE REAL-TIME SNIPER NODE (TERMINAL EDITION)
 * Mission: Execute One Real-World Intelligence Snipe.
 */

const DB_URL = 'postgresql://postgres:glrVNXPAMlJbeRzeNEziqUiOfPIXDjOf@gondola.proxy.rlwy.net:54825/railway';
const BRAVE_KEY = 'BSA2-DiqlsfcBvtr-S2oxY8DtQeWo5y';
const GEMINI_KEY = 'AIzaSyDi1lkyDRpoVV3l1PMrRdOpT10QP0d_jNk';

async function executeSnipe() {
    const pool = new Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
    
    try {
        console.log('📡 Sniping Brave News Engine...');
        const bRes = await fetch(`https://api.search.brave.com/res/v1/news/search?q=Solana+Crypto+Breaking&count=2`, {
            headers: { 'Accept': 'application/json', 'X-Subscription-Token': BRAVE_KEY }
        });
        const bData = await bRes.json();
        const article = bData.results[0];

        if (!article) throw new Error('No news found.');

        console.log(`💎 Real-World Headline Found: ${article.title}`);

        console.log('🧬 Re-writing in Persona Voice (Valentina Lima)...');
        const prompt = `
            YOU ARE Valentina Lima. 
            VIBE: "in the penthouse."
            DIALECT: "Dominican slang mi amor, smart, sassy, sarcastic."
            
            MISSION: Rewrite this real-time news for your Intelligence Feed.
            REAL NEWS: ${article.title} - ${article.description}
            SOURCE: ${article.source}
            
            FORMAT (JSON):
            {
              "title": "Sassy Provocative Headline",
              "content": "Insider briefing (2 parags).",
              "heat": "Critical",
              "hook": "TikTok hook line."
            }
        `;

        const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }]}],
                generationConfig: { responseMimeType: 'application/json' }
            })
        });
        const gData = await gRes.json();
        const post = JSON.parse(gData.candidates[0].content.parts[0].text);

        console.log('🛡️ Saving to Neural Pulse...');
        await pool.query(`
            INSERT INTO news_posts (persona_id, title, content, image_url, source_url, meta)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [
            'valentina-lima',
            post.title,
            post.content,
            '/v1.png',
            article.url,
            JSON.stringify({ heat: post.heat, hook: post.hook, BRAVE_S: article.source })
        ]);

        console.log('✅ Real-time Syndicate Mission Successful.');
        process.exit(0);
    } catch (e) {
        console.error('❌ Sniper Failure:', e);
        process.exit(1);
    }
}

executeSnipe();
