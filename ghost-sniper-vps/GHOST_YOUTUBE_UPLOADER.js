const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

/**
 * 🛰️ GHOST SNIPER: YouTube Shorts Auto-Uploader (Dual-Sync Hydra)
 * Purpose: Mass-broadcast the Syndicate pipeline to YouTube.
 */

async function uploadToYouTube() {
    console.log(`[${new Date().toLocaleTimeString()}] 🔍 Scanning for YouTube Payload...`);
    
    // 1. Target the freshest reel that hasn't been YouTube-posted
    const reelsDir = path.join(__dirname, 'reels');
    const postedDir = path.join(__dirname, 'posted');
    if (!fs.existsSync(postedDir)) fs.mkdirSync(postedDir);

    const files = fs.readdirSync(reelsDir).filter(f => {
        const isVideo = f.endsWith('.mp4');
        const isPosted = fs.existsSync(path.join(reelsDir, f + '.youtube'));
        return isVideo && !isPosted;
    });

    if (files.length === 0) {
        console.log('❌ No unposted YouTube reels found. Standby.');
        return;
    }

    const videoFile = files[0];
    const videoPath = path.join(reelsDir, videoFile);
    console.log(`🚀 Target Locked: ${videoFile}`);

    const hooks = ["UNFILTERED ACCESS", "ACCESS DENIED", "THE VAULT IS OPEN", "SIGNAL RESTORED"];
    const selectedHook = hooks[Math.floor(Math.random() * hooks.length)];
    const caption = `${selectedHook} #shorts #ai #gasp #fyp`;

    let browser;
    try {
        console.log('🔗 Connecting to Sovereign Chrome Port (9222)...');
        browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });

        const page = await browser.newPage();
        console.log('🏗️ Negotiating Studio Ingress...');
        await page.goto('https://studio.youtube.com', { waitUntil: 'networkidle2' });

        // Dismiss common popups
        await new Promise(r => setTimeout(r, 5000));
        await page.evaluate(() => {
            const dimissBtns = Array.from(document.querySelectorAll('ytcp-button')).filter(b => b.innerText.includes('DISMISS') || b.innerText.includes('CLOSE'));
            dimissBtns.forEach(btn => btn.click());
        });

        // 2. Click Create -> Upload (Dual Path Support)
        const quickUpload = await page.$('[test-id="upload-icon-url"], #upload-icon');
        if (quickUpload) {
            console.log('⚡ Using Fast-Uplink (Quick Actions)...');
            await quickUpload.click();
        } else {
            console.log('🏗️ Using Standard Menu Uplink...');
            await page.waitForSelector('#create-icon', { timeout: 10000 });
            await page.click('#create-icon');
            await page.waitForSelector('#text-item-0');
            await page.click('#text-item-0');
        }

        // 3. Select Video
        console.log('📂 Injecting Video Asset...');
        const inputUpload = await page.waitForSelector('input[type="file"]');
        await inputUpload.uploadFile(videoPath);

        // 4. Fill Details
        console.log('✍️ Syncing Intelligence Metadata...');
        await page.waitForSelector('#textbox[contenteditable="true"]');
        
        // Clear default filename and type caption
        await page.click('#textbox[contenteditable="true"]');
        await page.keyboard.down('Control');
        await page.keyboard.press('A');
        await page.keyboard.up('Control');
        await page.keyboard.press('Backspace');
        await page.keyboard.type(caption);

        // 5. Handle Audience
        console.log('⚡ Handling Audience Protocol...');
        await page.evaluate(() => {
            const labels = Array.from(document.querySelectorAll('tp-yt-paper-radio-button'));
            const noKids = labels.find(l => l.innerText.includes("No, it's not made for kids"));
            if (noKids) noKids.click();
        });

        // 6. Navigate to Visibility
        for(let i=0; i<3; i++) {
            await page.click('#next-button');
            await new Promise(r => setTimeout(r, 2000));
        }

        // 7. Set to Public
        console.log('🌐 Broadcasting to Global Node (Public)...');
        await page.evaluate(() => {
            const radios = Array.from(document.querySelectorAll('tp-yt-paper-radio-button'));
            const pub = radios.find(r => r.innerText.includes('Public'));
            if (pub) pub.click();
        });

        // Check for daily limit (Hard Shield)
        const limitReached = await page.evaluate(() => {
            return document.body.innerText.includes("daily upload limit reached");
        });

        if (limitReached) {
            console.log('🛡️ DAILY LIMIT REACHED. Pausing YouTube Node for 12 hours.');
            await page.close();
            await browser.disconnect();
            setTimeout(uploadToYouTube, 12 * 60 * 60 * 1000);
            return;
        }

        // 8. Final Publish
        console.log('🚀 Final Dispatch...');
        await page.click('#done-button');
        await new Promise(r => setTimeout(r, 10000));

        console.log('✅ YOUTUBE SIGNAL BROADCAST COMPLETE.');
        
        // 🛡️ DUAL-SYNC PROTOCOL: Mark as YouTube-Posted
        fs.writeFileSync(`${videoPath}.youtube`, 'done');
        
        // Check if TikTok also posted it (Hydra-Sweep)
        if (fs.existsSync(`${videoPath}.tiktok`)) {
            fs.renameSync(videoPath, path.join(postedDir, videoFile));
            fs.unlinkSync(`${videoPath}.tiktok`);
            fs.unlinkSync(`${videoPath}.youtube`);
            console.log(`📦 HYDRA SWEEP: Both platforms synced. Archived to posted/`);
        } else {
            console.log(`⏳ HYDRA SYNC: Waiting for TikTok cycle.`);
        }

        await page.close();
        await browser.disconnect();

    } catch (e) {
        console.error('❌ YOUTUBE FAILURE:', e);
        if (browser) await browser.disconnect();
    }
}

// 🔁 Auto-Cycle: Run every 60 minutes
setInterval(uploadToYouTube, 60 * 60 * 1000);
uploadToYouTube();
