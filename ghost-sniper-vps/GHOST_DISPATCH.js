const { chromium } = require('playwright');
const axios = require('axios');

// 🛰️ SYNDICATE COMMAND CENTER URL
const SYNDICATE_URL = "https://gasp.fun/api/news/command-bridge?key=gasp_sovereign_intelligence";

async function pulse() {
    console.log(`[${new Date().toLocaleTimeString()}] 🔍 Scanning Syndicate ledger for tactical signals...`);
    
    try {
        const res = await axios.get(SYNDICATE_URL);
        const task = res.data;

        if (task.type === 'POST_ARTICLE') {
            console.log(`🎯 SIGNAL DETECTED: Dispatching Article #${task.id}`);

            let browser;
            try {
                // 🛡️ Connect to the Manual Chrome Instance
                browser = await chromium.connectOverCDP('http://localhost:9222');
                const context = browser.contexts()[0];
                const page = await context.newPage();

                // ✍️ Human-Mimic Dispatch with Heavy Timeout
                console.log("🛰️ Navigating to X Dispatch Center...");
                await page.goto('https://x.com/compose/post', { timeout: 120000 });
                
                console.log("✍️ Locating Neural Input...");
                await page.waitForSelector('[data-testid="tweetTextarea_0"]', { timeout: 60000 });
                
                // Jittered typing to fool bot detection
                await page.type('[data-testid="tweetTextarea_0"]', task.payload, { delay: 120 });
                
                console.log("🚀 Launching Alpha...");
                await page.click('[data-testid="tweetButton"]');
                
                // Wait for the box to disappear (success indicator)
                await page.waitForSelector('[data-testid="tweetTextarea_0"]', { state: 'hidden', timeout: 30000 });
                
                console.log("✅ HIJACK SUCCESSFUL: Twitter update live.");
                await page.close();
            } finally {
                if (browser) await browser.disconnect();
            }

            // Confirm back to the Syndicate
            await axios.post(SYNDICATE_URL, { id: task.id });
        }
 else {
            console.log("💤 Standby: Dashboard is clear.");
        }
    } catch (e) {
        console.error("❌ Link Failure:", e.message);
    }
}

// 600,000ms = 10 Minute Rhythm
setInterval(pulse, 600000);
pulse();
