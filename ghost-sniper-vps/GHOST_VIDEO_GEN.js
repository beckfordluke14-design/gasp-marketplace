const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { execSync } = require('child_process');

// 🧬 NEURAL BRIDGE: Check for static binary
try {
    const ffmpegPath = require('ffmpeg-static');
    ffmpeg.setFfmpegPath(ffmpegPath);
    console.log("💎 Static Neural Bridge Detected.");
} catch (e) {
    console.log("⚠️ System FFmpeg path assumed.");
}

// 🛰️ SYNDICATE CONFIG
const SYNDICATE_URL = "https://gasp.fun/api/news/command-bridge?key=gasp_sovereign_intelligence";
const OUTPUT_DIR = path.join(__dirname, 'reels');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

/**
 * 🎨 NEURAL GLITCH ENGINE v1.0
 * Purpose: Turns static persona assets into high-heat 7s vertical reels.
 */
async function generateReel() {
    console.log(`[${new Date().toLocaleTimeString()}] 🧪 Initializing Neural Reel Generation...`);

    try {
        // 1. Fetch Latest High-Status Metadata
        const res = await axios.get(SYNDICATE_URL);
        const task = res.data;

        if (!task || !task.imageUrl) {
            console.log("💤 Standby: No high-value assets in queue.");
            return;
        }

        const personaName = task.personaName || 'Syndicate Agent';
        const imagePath = path.join(__dirname, `temp_asset_${task.id}.jpg`);
        const videoPath = path.join(OUTPUT_DIR, `reel_${task.id}.mp4`);

        // 2. Extract Asset
        console.log(`📥 Extracting asset for ${personaName}...`);
        const response = await axios({ url: task.imageUrl, responseType: 'stream' });
        const writer = fs.createWriteStream(imagePath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        // 3. Transform via FFmpeg (ELITE SYNDICATE BURN v2.0)
        console.log("⚡ Initiating Elite Neural Render (Chroma + Motion Blur)...");
        
        ffmpeg(imagePath)
            .inputOptions(['-loop 1'])
            .outputOptions([
                '-t 7', 
                '-vf', `
                   scale=1080:1920:force_original_aspect_ratio=increase,
                   crop=1080:1920,
                   zoompan=z='min(zoom+0.0015,1.25)':d=125:s=1080x1920,
                   drawbox=y=ih-450:w=iw:h=350:color=black:t=fill,
                   drawtext=text='ACCESS THE ARCHIVE':fontcolor=white:fontsize=70:fontfile='C\:\\\\Windows\\\\Fonts\\\\arialbd.ttf':x=(w-text_w)/2:y=h-380,
                   drawtext=text='GASP.FUN':fontcolor=magenta:fontsize=120:fontfile='C\:\\\\Windows\\\\Fonts\\\\arialbd.ttf':x=(w-text_w)/2:y=h-260,
                   noise=alls=10:allf=t+u
                `,
                '-c:v libx264',
                '-preset medium',
                '-crf 18',
                '-pix_fmt yuv420p',
                '-r 30'
            ])
            .on('start', (cmd) => console.log("🚀 FFmpeg Launching Alpha..."))
            .on('error', (err) => console.error("❌ Neural Rendering Failed:", err.message))
            .on('end', () => {
                console.log(`✅ REEL COMPLETED: ${videoPath}`);
                // Cleanup
                fs.unlinkSync(imagePath);
                // Confirm back to syndicate
                axios.post(SYNDICATE_URL, { id: task.id, type: 'VIDEO_COMPLETE' })
                  .catch(e => console.warn("⚠️ Completion Sync Failed:", e.message));
            })
            .save(videoPath);

    } catch (e) {
        console.error("❌ High-Level Factory Failure:", e.message);
    }
}

// Check every 10 minutes
setInterval(generateReel, 600000);
generateReel();
