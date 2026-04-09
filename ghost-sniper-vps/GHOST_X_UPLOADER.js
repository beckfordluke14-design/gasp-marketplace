const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

/**
 * 🛰️ GHOST SNIPER: X (Twitter) Auto-Uploader (Hydra-Sync)
 * Purpose: Mass-broadcast the Syndicate pipeline to the High-Intent X audience.
 */

async function uploadToX() {
    console.log(`[${new Date().toLocaleTimeString()}] 🐦 Scanning for X Payload...`);
    
    // 1. Target the freshest reel
    const reelsDir = path.join(__dirname, 'reels');
    const postedDir = path.join(__dirname, 'posted');
    if (!fs.existsSync(postedDir)) fs.mkdirSync(postedDir);

    const files = fs.readdirSync(reelsDir).filter(f => {
        const isVideo = f.endsWith('.mp4');
        const isPosted = fs.existsSync(path.join(reelsDir, f + '.x'));
        return isVideo && !isPosted;
    });
    
    if (files.length === 0) {
        console.log('❌ No unposted X reels found. Standby.');
        return;
    }

    const videoFile = files[0];
    const videoPath = path.join(reelsDir, videoFile);
    console.log(`🚀 Target Locked: ${videoFile}`);

    const hooks = [
        "Intelligence Dispatch: RECOVERED SIGNAL.",
        "The Vault is leaking. Access restricted.",
        "Syndicate Archive // Tier 1 Access Required.",
        "UNFILTERED intelligence restored.",
        "ACCESS GRANTED. Intelligence dispatch incoming."
    ];
    const selectedHook = hooks[Math.floor(Math.random() * hooks.length)];
    const caption = `${selectedHook} \n\nDirect Node: https://gasp.fun #AI #Crypto #Syndicate`;

    let browser;
    try {
        console.log('🔗 Connecting to Sovereign Chrome Port (9222)...');
        browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });

        const page = await browser.newPage();
        console.log('🏗️ Navigating to X Compose...');
        await page.goto('https://x.com/compose/post', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 5000));

        // 2. Clear initial Popups
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('div[role="button"]'));
            const dismiss = btns.find(b => b.textContent.includes('Discard') || b.textContent.includes('Got it'));
            if (dismiss) dismiss.click();
        });

        // 3. Inject Video
        console.log('📂 Injecting Video Asset...');
        const fileInput = await page.waitForSelector('input[type="file"][data-testid="fileInput"]');
        await fileInput.uploadFile(videoPath);

        // 4. Metadata Sync
        console.log('✍️ Syncing Intelligence Metadata...');
        const editor = await page.waitForSelector('.public-DraftEditor-content');
        await editor.click();
        await page.keyboard.type(caption);

        // 5. Final Dispatch
        console.log('⏳ Finalizing Signal Integrity...');
        await new Promise(r => setTimeout(r, 10000)); // Wait for video upload to finish

        console.log('🚀 Final Dispatch...');
        const postBtn = await page.waitForSelector('[data-testid="tweetButton"]');
        await postBtn.click();
        
        await new Promise(r => setTimeout(r, 10000)); // Ensure it registers

        console.log('✅ X SIGNAL BROADCAST COMPLETE.');
        
        // 🛡️ DUAL-SYNC PROTOCOL: Mark as X-Posted
        fs.writeFileSync(`${videoPath}.x`, 'done');
        
        // Check if TikTok and YouTube also posted it (The Great Sweep)
        if (fs.existsSync(`${videoPath}.tiktok`) && fs.existsSync(`${videoPath}.youtube`)) {
            fs.renameSync(videoPath, path.join(postedDir, videoFile));
            fs.unlinkSync(`${videoPath}.tiktok`);
            fs.unlinkSync(`${videoPath}.youtube`);
            fs.unlinkSync(`${videoPath}.x`);
            console.log(`📦 TRI-PLATFORM SWEEP: All platforms synced. Archived to posted/`);
        } else {
            console.log(`⏳ HYDRA SYNC: Waiting for other platform cycles.`);
        }

        await page.close();
        await browser.disconnect();

    } catch (e) {
        console.error('❌ X FAILURE:', e);
        if (browser) await browser.disconnect();
    }
}

// 🔁 Auto-Cycle: Run every 60 minutes
setInterval(uploadToX, 60 * 60 * 1000);
uploadToX();
