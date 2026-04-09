const { Client } = require('pg');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

/**
 * 🛰️ GHOST SNIPER: X (Twitter) News Dispatcher
 * Purpose: Automatically broadcast new database stories to X to drive traffic.
 */

const dbConfig = {
    connectionString: "postgresql://postgres:postgres@localhost:5432/postgres", // Update with your actual VPS DB string
    ssl: false
};

async function broadcastNews() {
    console.log(`[${new Date().toLocaleTimeString()}] 🗞️ Scanning Database for new Intelligence...`);
    const client = new Client(dbConfig);
    
    try {
        await client.connect();

        // 1. Fetch the latest news story that hasn't been tweeted (using a local tracking file)
        const tweetedFile = path.join(__dirname, 'tweeted_stories.json');
        if (!fs.existsSync(tweetedFile)) fs.writeFileSync(tweetedFile, JSON.stringify([]));
        const tweetedIds = JSON.parse(fs.readFileSync(tweetedFile));

        const query = `
            SELECT p.id, p.caption as title, p.metadata->>'content' as content, pers.name as persona_name, pers.seed_image_url as image
            FROM posts p
            JOIN personas pers ON p.persona_id = pers.id
            ORDER BY p.created_at DESC
            LIMIT 10
        `;
        const res = await client.query(query);
        const newStory = res.rows.find(row => !tweetedIds.includes(row.id));

        if (!newStory) {
            console.log('❌ No new intelligence found in DB. Standby.');
            await client.end();
            return;
        }

        console.log(`🚀 New Signal Detected: ${newStory.title}`);
        const articleUrl = `https://gasp.fun/archive/${newStory.id}`;
        const tweetText = `Intelligence Dispatch from ${newStory.persona_name}: \n\n"${newStory.title}"\n\nFull Briefing: ${articleUrl} \n\n#AI #Syndicate #Crypto`;

        // 2. Connect to Chrome
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });

        const page = await browser.newPage();
        console.log('🏗️ Navigating to X Compose...');
        await page.goto('https://x.com/compose/post', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 5000));

        // 3. Inject Metadata
        console.log('✍️ Syncing Intelligence Metadata...');
        const editor = await page.waitForSelector('.public-DraftEditor-content');
        await editor.click();
        await page.keyboard.type(tweetText);

        // 4. Final Dispatch
        console.log('🚀 Final Dispatch...');
        const postBtn = await page.waitForSelector('[data-testid="tweetButton"]');
        await postBtn.click();
        
        await new Promise(r => setTimeout(r, 10000)); // Ensure it registers

        // 5. Success Tracking
        tweetedIds.push(newStory.id);
        fs.writeFileSync(tweetedFile, JSON.stringify(tweetedIds.slice(-100))); // Keep last 100
        console.log('✅ X NEWS BROADCAST COMPLETE.');

        await page.close();
        await browser.disconnect();
        await client.end();

    } catch (e) {
        console.error('❌ X NEWS FAILURE:', e);
        if (client) await client.end();
    }
}

// 🔁 Auto-Cycle: Run every 30 minutes to check for new site content
setInterval(broadcastNews, 30 * 60 * 1000);
broadcastNews();
