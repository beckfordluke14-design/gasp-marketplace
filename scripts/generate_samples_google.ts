import { synthesizeGoogleSpeech } from '../src/lib/googleTts';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const voices = ['Aoede', 'Kore', 'Leda', 'Zephyr'];
const text = "Hey daddy... did you miss me? I have something very special waiting in my private vault... come see me pues.";

async function run() {
    console.log(`Using Google TTS (Chirp 3 HD)...`);
    for (const voice of voices) {
        console.log(`Generating sample for ${voice}...`);
        try {
            // Note: googleTts.ts automatically prepends 'en-US-Chirp3-HD-' if not present
            const result = await synthesizeGoogleSpeech(text, voice, 'en-US');
            const outputPath = path.join(process.cwd(), 'public', 'samples', 'vocal-test', `chirp3_${voice.toLowerCase()}_sample.mp3`);
            fs.writeFileSync(outputPath, result);
            console.log(`✅ Saved ${voice} sample to ${outputPath}`);
        } catch (err: any) {
            console.error(`❌ Failed to generate ${voice} sample:`, err.message);
        }
    }
}

run();
