const { chromium } = require('playwright');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const https = require('https');

// 🛰️ SYNDICATE COMMAND CENTER URL
const SYNDICATE_URL = "https://gasp.fun/api/news/command-bridge?key=gasp_sovereign_intelligence";

/** 📥 NEURAL DOWNLOAD: Buffer media locally for injection */
async function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

async function pulse() {
    console.log(`[${new Date().toLocaleTimeString()}] 🔍 Scanning Syndicate ledger for tactical signals...`);
    
    let task;
    try {
        const res = await axios.get(SYNDICATE_URL);
        task = res.data;
    } catch (err) {
        if (err.response) {
            console.error(`❌ Link Failure Status: ${err.response.status}`);
            console.error(`❌ Error Detail:`, JSON.stringify(err.response.data));
        } else {
            console.error(`❌ Link Failure: ${err.message}`);
        }
        return;
    }

    try {
        if (task.type === 'POST_ARTICLE') {
            console.log(`🎯 SIGNAL DETECTED: Dispatching Article #${task.id}`);

            let browser;
            let tempFile = null;

            try {
                // 1. Prepare Media if available
                if (task.imageUrl) {
                    tempFile = path.join(__dirname, `temp_${task.id}.jpg`);
                    console.log(`📥 Downloading persona assets: ${task.imageUrl}`);
                    await downloadFile(task.imageUrl, tempFile);
                }

                // 2. Connect to the Manual Chrome Instance
                browser = await chromium.connectOverCDP('http://localhost:9222');
                const context = browser.contexts()[0];
                const page = await context.newPage();

                // ✍️ Human-Mimic Dispatch
                console.log("🛰️ Navigating to X Dispatch Center...");
                await page.goto('https://x.com/compose/post', { 
                   timeout: 120000, 
                   waitUntil: 'domcontentloaded' 
                });
                
                console.log("✍️ Locating Neural Input...");
                const tweetBox = await page.waitForSelector('[data-testid="tweetTextarea_0"]', { 
                   visible: true,
                   timeout: 60000 
                });
                
                // 🖼️ Inject Media FIRST (Higher engagement)
                if (tempFile && fs.existsSync(tempFile)) {
                    console.log("🎨 Injecting Visual Signal...");
                    const fileInput = await page.waitForSelector('input[data-testid="fileInput"]', { state: 'attached' });
                    await fileInput.setInputFiles(tempFile);
                    await page.waitForTimeout(2000); // Wait for upload to bake
                }

                console.log("✍️ Injecting Neural Copy...");
                await tweetBox.click();
                await page.keyboard.type(task.payload, { delay: 120 });
                
                console.log("🚀 Launching Alpha...");
                await page.click('[data-testid="tweetButton"]');
                
                // Wait for the box to disappear (success indicator)
                await page.waitForSelector('[data-testid="tweetTextarea_0"]', { state: 'hidden', timeout: 30000 });
                
                console.log("✅ HIJACK SUCCESSFUL: Digital Archive projection live.");
                await page.close();
            } finally {
                // Cleanup temp assets
                if (tempFile && fs.existsSync(tempFile)) {
                    fs.unlinkSync(tempFile);
                }
                if (browser) try { await browser.close(); } catch(e) {}
            }

            // Confirm back to the Syndicate
            await axios.post(SYNDICATE_URL, { id: task.id });
        } else {
            console.log("💤 Standby: Dashboard is clear.");
        }
    } catch (e) {
        console.error("❌ Link Failure:", e.message);
    }
}

// 600,000ms = 10 Minute Rhythm
setInterval(pulse, 600000);
pulse();
