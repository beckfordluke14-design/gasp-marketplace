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
            if (response.statusCode !== 200) {
                reject(new Error(`Download failed with status: ${response.statusCode}`));
                return;
            }
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
        if (!task) throw new Error("Null response from Command Bridge");
    } catch (err) {
        if (err.response) {
            console.error(`❌ Link Failure Status: ${err.response.status}`);
            console.error(`❌ Error Detail:`, JSON.stringify(err.response.data));
        } else {
            console.error(`❌ Link Failure: ${err.message || 'Unknown Network Error'}`);
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
                if (task.imageUrl && task.imageUrl.trim() !== '') {
                    tempFile = path.join(__dirname, `temp_${task.id}.jpg`);
                    console.log(`📥 Downloading assets: ${task.imageUrl}`);
                    try {
                        await downloadFile(task.imageUrl, tempFile);
                        
                        // 🎨 WATERMARKING PROTOCOL (v11.0) - VIBRANT SYNDICATE BURN
                        try {
                            const sharp = require('sharp');
                            console.log("💎 Applying High-Visibility Neural Burn...");
                            
                            const inputBuffer = fs.readFileSync(tempFile);
                            const metadata = await sharp(inputBuffer).metadata();
                            const w = metadata.width || 800;
                            const h = metadata.height || 800;
                            
                            const text = "CHAT ON GASP.FUN";
                            const fontSize = Math.floor(w / 15);
                            
                            const svgImage = `
                                <svg width="${w}" height="${h}">
                                    <style>
                                        .text { fill: #ff00ff; stroke: black; stroke-width: ${Math.max(1, fontSize / 25)}px; font-size: ${fontSize}px; font-weight: 900; font-family: sans-serif; font-style: italic; paint-order: stroke; }
                                    </style>
                                    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" class="text">${text}</text>
                                </svg>
                            `;

                            const outputTemp = tempFile.replace('.jpg', '_branded.jpg');
                            await sharp(inputBuffer)
                                .composite([{ input: Buffer.from(svgImage), blend: 'over' }])
                                .toFile(outputTemp);

                            fs.unlinkSync(tempFile);
                            fs.renameSync(outputTemp, tempFile);
                            console.log("✅ Asset Branded (High-Visibility Complete).");
                        } catch (sharpErr) {
                            console.warn("⚠️ Watermark Failed (Non-blocking):", sharpErr.message);
                        }
                    } catch (dlErr) {
                        console.warn("⚠️ Media Download Failed (Defaulting to Text-Only):", dlErr.message);
                        tempFile = null;
                    }
                }

                // 2. Connect to the Manual Chrome Instance
                console.log("🛰️ Connecting to Neural Bridge (CDP/9222)...");
                try {
                    browser = await chromium.connectOverCDP('http://localhost:9222', {
                        timeout: 30000 
                    });
                } catch (cdpErr) {
                    throw new Error(`CDP Connection Refused: Ensure START_CHROME.bat is running. (${cdpErr.message})`);
                }

                const context = browser.contexts()[0];
                const page = await context.newPage();

                // ✍️ Human-Mimic Dispatch
                console.log("🛰️ Navigating to X Dispatch Center...");
                await page.goto('https://x.com/compose/post', { 
                   timeout: 60000, 
                   waitUntil: 'domcontentloaded' 
                });
                
                console.log("✍️ Locating Neural Input...");
                const tweetBox = await page.waitForSelector('[data-testid="tweetTextarea_0"]', { 
                   visible: true,
                   timeout: 30000 
                });
                
                // 🖼️ Inject Media FIRST (Higher engagement)
                if (tempFile && fs.existsSync(tempFile)) {
                    console.log("🎨 Injecting Visual Signal...");
                    const fileInput = await page.waitForSelector('input[data-testid="fileInput"]', { state: 'attached' });
                    await fileInput.setInputFiles(tempFile);
                    await page.waitForTimeout(2000); 
                }

                console.log("✍️ Injecting Neural Copy...");
                await tweetBox.click();
                await page.keyboard.type(task.payload, { delay: 120 });
                
                console.log("🚀 Launching Alpha...");
                const postButton = await page.locator('[data-testid="tweetButton"]');
                await postButton.first().click({ force: true, delay: 500 });
                
                // 🛰️ SUCCESS VERIFICATION
                try {
                    await page.waitForSelector('[data-testid="tweetTextarea_0"]', { state: 'hidden', timeout: 15000 });
                    console.log("✅ HIJACK SUCCESSFUL: Digital Archive projection live.");
                } catch (timeoutErr) {
                    console.warn("⚠️ Interface Stalled. Attempting secondary dispatch...");
                    await page.keyboard.press('Control+Enter');
                    await page.waitForTimeout(5000);
                    console.log("✅ Backup Dispatch Executed.");
                }
                
                await page.close();
            } catch (innerErr) {
                console.error("❌ Neural Dispatch Error:", innerErr.message);
            } finally {
                // Cleanup temp assets
                if (tempFile && fs.existsSync(tempFile)) {
                    try { fs.unlinkSync(tempFile); } catch(e) {}
                }
                if (browser) try { await browser.close(); } catch(e) {}
            }

            // Confirm back to the Syndicate
            console.log("📢 Syncing Task Completion...");
            await axios.post(SYNDICATE_URL, { id: task.id }).catch(e => console.error("⚠️ Completion Sync Failed:", e.message));
        } else {
            console.log("💤 Standby: Dashboard is clear.");
        }
    } catch (e) {
        console.error("❌ High-Level Link Failure:", e.message || "Unknown Runtime Crash", e.stack);
    }
}

// 5 Minute Rhythm (More aggressive than 10)
setInterval(pulse, 300000);
pulse();
