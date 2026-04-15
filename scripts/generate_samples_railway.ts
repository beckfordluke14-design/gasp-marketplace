import { synthesizeGeminiSpeech } from '../src/lib/geminiTts';
import { uploadSovereignAsset } from '../src/lib/r2Client';
import fs from 'fs';
import path from 'path';

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
    console.log(`🚀 [Railway Engine] Booting Gemini 2.5 Pro Pro Synthesis...`);
    for (const voice of voices) {
        console.log(`Generating sample for ${voice}...`);
        try {
            const result = await synthesizeGeminiSpeech(text, voice, styleInstructions);
            const fileName = `v225_${voice.toLowerCase()}_sample.wav`;
            
            // Upload directly to R2 using production credentials from Railway
            const publicUrl = await uploadSovereignAsset(result.data, fileName, 'audio/wav');
            
            console.log(`✅ SUCCESS: ${voice} vaulted at ${publicUrl}`);
        } catch (err: any) {
            console.error(`❌ Failed to generate ${voice} sample:`, err.message);
        }
    }
}

run();
