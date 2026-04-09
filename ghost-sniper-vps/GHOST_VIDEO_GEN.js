const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');

const HISTORY_FILE = path.join(__dirname, 'rendered_history.json');
let history = [];
if (fs.existsSync(HISTORY_FILE)) {
    try { history = JSON.parse(fs.readFileSync(HISTORY_FILE)); } catch (e) { history = []; }
}

/**
 * 🛰️ GHOST SNIPER: SOVEREIGN VIDEO FACTORY v5.0
 * Purpose: Direct DB access rendering with Psychological Hooks
 */

// 1. HARDCODED UPLINK (PUBLIC)
const pool = new Pool({
    connectionString: "postgresql://postgres:glrVNXPAMlJbeRzeNEziqUiOfPIXDjOf@gondola.proxy.rlwy.net:54825/railway",
    ssl: { rejectUnauthorized: false }
});

// 🧬 NEURAL BRIDGE: FFmpeg Discovery
try {
    const ffmpegPath = require('ffmpeg-static');
    ffmpeg.setFfmpegPath(ffmpegPath);
} catch (e) {
    console.log("⚠️ Using system FFmpeg path.");
}

const OUTPUT_DIR = path.join(__dirname, 'reels');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

async function generateReel() {
    console.log(`[${new Date().toLocaleTimeString()}] 🧪 Scanning Registry for high-heat assets...`);

    try {
        // 1. Query Database directly for latest active personas
        const { rows: allPersonas } = await pool.query(`
            SELECT id, name, seed_image_url 
            FROM personas 
            WHERE is_active = true 
            ORDER BY created_at DESC 
            LIMIT 50
        `);

        // Filter out recently used ones
        const personas = allPersonas.filter(p => !history.includes(p.id));

        if (personas.length === 0) {
            console.log("💤 Standby: No fresh personas found. Clearing history to reset cycle.");
            history = [];
            fs.writeFileSync(HISTORY_FILE, JSON.stringify(history));
            return;
        }

        // Pick one at random from the "fresh" list
        const task = personas[Math.floor(Math.random() * personas.length)];
        const personaName = task.name;
        const imageUrl = task.seed_image_url;
        
        // Update History to avoid duplicate
        history.push(task.id);
        if (history.length > 20) history.shift(); // Keep history lean
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history));
        const taskId = `vps_${Date.now()}`;
        
        const imagePath = path.join(__dirname, `temp_${taskId}.jpg`);
        const videoPath = path.join(OUTPUT_DIR, `reel_${taskId}.mp4`);

        // 2. Download Image
        console.log(`📥 Downloading asset: ${personaName}...`);
        const response = await axios({ url: imageUrl, responseType: 'stream' });
        const writer = fs.createWriteStream(imagePath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        // 3. Selection of Psychological "Hooks"
        const hooks = ["UNFILTERED ACCESS", "ACCESS DENIED", "THE VAULT IS OPEN", "PRIVATE ARCHIVE"];
        const selectedHook = hooks[Math.floor(Math.random() * hooks.length)];

        // 4. Render via FFmpeg
        console.log(`⚡ Rendering Neural Burn: ${selectedHook}...`);

        ffmpeg(imagePath)
            .inputOptions(['-loop 1'])
            .outputOptions([
                '-t 7', 
                '-vf', `
                   scale=1080:1920:force_original_aspect_ratio=increase,
                   crop=1080:1920,
                   zoompan=z='min(zoom+0.0015,1.25)':d=125:s=1080x1920,
                   drawbox=y=ih-450:w=iw:h=350:color=black@0.7:t=fill,
                   drawtext=text='${selectedHook}':fontcolor=white:fontsize=80:fontfile='C\:\\\\Windows\\\\Fonts\\\\arialbd.ttf':x=(w-text_w)/2:y=h-520,
                   drawtext=text='GASP.FUN':fontcolor=magenta:fontsize=130:fontfile='C\:\\\\Windows\\\\Fonts\\\\arialbd.ttf':x=(w-text_w)/2:y=h-400,
                   noise=alls=5:allf=t+u
                `,
                '-c:v libx264',
                '-preset medium',
                '-crf 18',
                '-pix_fmt yuv420p',
                '-r 30'
            ])
            .on('start', () => console.log("🚀 Render Initiated..."))
            .on('error', (err) => console.error("❌ Render Failed:", err.message))
            .on('end', () => {
                console.log(`✅ DISPATCH READY: ${videoPath}`);
                if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
            })
            .save(videoPath);

    } catch (e) {
        console.error("❌ Registry Uplink Failure:", e.message);
    }
}

// 🔁 Factory Loop: Generate a new reel every 15 minutes
setInterval(generateReel, 900000);
generateReel();
