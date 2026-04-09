const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

/**
 * 🛰️ GHOST SNIPER: TikTok Auto-Uploader (HQ Protocol) v2.0
 * Purpose: Mass-broadcast the Syndicate pipeline to the For You Page.
 */

async function uploadToTikTok() {
    console.log(`[${new Date().toLocaleTimeString()}] 🧪 Scanning for TikTok Payload...`);
    
    // 1. Target the freshest reel
    const reelsDir = path.join(__dirname, 'reels');
    const postedDir = path.join(__dirname, 'posted');
    if (!fs.existsSync(postedDir)) fs.mkdirSync(postedDir);

    const files = fs.readdirSync(reelsDir).filter(f => {
        const isVideo = f.endsWith('.mp4');
        const isPosted = fs.existsSync(path.join(reelsDir, f + '.tiktok'));
        return isVideo && !isPosted;
    });
    
    if (files.length === 0) {
        console.log('❌ No unposted reels found. Standby.');
        return;
    }

    const videoFile = files[0];
    const videoPath = path.join(reelsDir, videoFile);
    console.log(`🚀 Target Locked: ${videoFile}`);

    const hooks = ["UNFILTERED ACCESS", "SIGNAL RESTORED", "THE VAULT IS OPEN", "PRIVATE ARCHIVE"];
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
        console.log('🏗️ Navigating to TikTok Studio...');
        await page.goto('https://www.tiktok.com/creator-center/upload?from=upload', { waitUntil: 'networkidle2' });

        // 2. Clear initial Popups
        await new Promise(r => setTimeout(r, 5000));
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const dismiss = btns.find(b => b.textContent.includes('Discard') || b.textContent.includes('Dismiss'));
            if (dismiss) dismiss.click();
        });

        // 3. Inject Video (UNIFIED UI SUPPORT)
        console.log('📂 Injecting Video Asset...');
        let container = page;
        
        const fileInput = await page.$('input[type="file"]');
        if (!fileInput) {
            const iframeElement = await page.$('iframe[src*="tiktok.com"]');
            if (iframeElement) {
                container = await iframeElement.contentFrame();
                const innerInput = await container.waitForSelector('input[type="file"]');
                await innerInput.uploadFile(videoPath);
            }
        } else {
            await fileInput.uploadFile(videoPath);
        }

        // 4. Metadata Sync
        console.log('✍️ Syncing Intelligence Metadata...');
        await new Promise(r => setTimeout(r, 6000)); // Wait for render
        
        // Handle "Content Checks" Popup
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const turnOn = btns.find(b => b.textContent.includes('Turn on'));
            if (turnOn) turnOn.click();
        });

        const captionBox = await container.waitForSelector('.public-DraftEditor-content, [contenteditable="true"]', { timeout: 30000 });
        
        // Human-Mimicry: Triple-click to select all existing filename text
        await captionBox.click({ clickCount: 3 });
        await new Promise(r => setTimeout(r, 1000));
        await page.keyboard.press('Backspace');
        await new Promise(r => setTimeout(r, 1000));
        
        console.log(`✍️ Injecting Signal: ${caption}`);
        await page.keyboard.type(caption, { delay: 50 });

        // 5. Final Dispatch
        console.log('⏳ Finalizing Signal Integrity...');
        await new Promise(r => setTimeout(r, 8000)); // Extra wait for rendering

        // FIND AND CLICK POST BUTTON (Physical Calibration)
        const postDetected = await page.evaluate(async () => {
            const btns = Array.from(document.querySelectorAll('button'));
            const p = btns.find(b => b.textContent === 'Post' || b.textContent.includes('Post') || b.textContent.includes('Publish'));
            if (p) {
                p.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return true;
            }
            return false;
        });

        if (postDetected) {
            console.log('⏳ Aligning viewport for final dispatch...');
            await new Promise(r => setTimeout(r, 4000)); // Wait for scroll alignment
            
            const coordinates = await page.evaluate(() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const p = btns.find(b => b.textContent === 'Post' || b.textContent.includes('Post') || b.textContent.includes('Publish'));
                if (p) {
                    const rect = p.getBoundingClientRect();
                    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
                }
                return null;
            });

            if (coordinates) {
                console.log(`🚀 Clicking Post at calibrated coordinates: ${coordinates.x}, ${coordinates.y}`);
                await page.mouse.click(coordinates.x, coordinates.y);
                await new Promise(r => setTimeout(r, 30000)); // Standard upload wait
                console.log('✅ TIKTOK SIGNAL BROADCAST COMPLETE.');
            }
        } else {
            throw new Error('Could not find Post button on screen.');
        }

        // 🛡️ DUAL-SYNC PROTOCOL: Mark as TikTok-Posted
        fs.writeFileSync(`${videoPath}.tiktok`, 'done');
        
        // Check if YouTube also posted it (Hydra-Sweep)
        if (fs.existsSync(`${videoPath}.youtube`)) {
            fs.renameSync(videoPath, path.join(postedDir, videoFile));
            fs.unlinkSync(`${videoPath}.tiktok`);
            fs.unlinkSync(`${videoPath}.youtube`);
            console.log(`📦 HYDRA SWEEP: Both platforms synced. Archived to posted/`);
        } else {
            console.log(`⏳ HYDRA SYNC: Waiting for YouTube cycle tomorrow.`);
        }

        await page.close();
        await browser.disconnect();

    } catch (e) {
        console.error('❌ TIKTOK FAILURE:', e);
        if (browser) await browser.disconnect();
    }
}

// 🔁 Auto-Cycle: Run every 60 minutes for HQ longevity
setInterval(uploadToTikTok, 60 * 60 * 1000);
uploadToTikTok();
