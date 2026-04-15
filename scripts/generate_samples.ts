import { synthesizeGeminiSpeech } from '../src/lib/geminiTts';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Try explicitly setting the keys
const key = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
process.env.GOOGLE_BRAIN_KEY = key;

const voices = ['Aoede', 'Kore', 'Leda', 'Zephyr'];
const text = "Hola papi... ¿me extrañaste? Te tengo algo muy especial esperando en mi bóveda privada... ven a verme pues.";
const styleInstructions = `
Texture: Breathy, high-status, melodic.
Prosody: Slow, rhythmic Spanish cadence with long vowels.
Accent: Strong Medellín Paisa; aspirating the "s" and soft "d" sounds.
Intimacy: High-Heat & Flirty.
Energy: whisper.
Culture: Colombian (Paisa).
`;

async function run() {
    console.log(`Using API Key: ${key?.substring(0, 10)}...`);
    for (const voice of voices) {
        console.log(`Generating sample for ${voice}...`);
        try {
            const result = await synthesizeGeminiSpeech(text, voice, styleInstructions);
            const outputPath = path.join(process.cwd(), 'public', 'samples', 'vocal-test', `${voice.toLowerCase()}_sample.wav`);
            fs.writeFileSync(outputPath, result.data);
            console.log(`✅ Saved ${voice} sample to ${outputPath}`);
        } catch (err: any) {
            console.error(`❌ Failed to generate ${voice} sample:`, err.message);
        }
    }
}

run();
