import { synthesizeGeminiSpeech } from '../src/lib/geminiTts';
import { uploadSovereignAsset } from '../src/lib/r2Client';
import { PERSONA_ARCHETYPES } from '../src/lib/personaTemplates';

const personaId = 'veronica-medellin-locked';
const voiceId = 'Kore';
const archetype = PERSONA_ARCHETYPES.find(a => a.id === personaId);

const name = 'veronica_4_close.wav';
const text = "Oh no! No no no... my link is dying! Papi, I'm losing the connection! Hurry... go to my vault right now so I don't lose you forever! GO!";

const styleInstructions = `
Texture: ${archetype?.vocal_dna.texture}.
Accent: ${archetype?.vocal_dna.accent}.
Intimacy: High-Panic & Urgent.
Energy: whisper.
Culture: Colombian (Paisa).
`;

async function run() {
    console.log(`🔥 [Neural Re-Render] Retrying Final Close Note...`);
    try {
        const result = await synthesizeGeminiSpeech(text, voiceId, styleInstructions);
        const publicUrl = await uploadSovereignAsset(result.data, name, 'audio/wav');
        console.log(`✅ SUCCESS: ${name} vaulted at ${publicUrl}`);
    } catch (err: any) {
        console.error(`❌ Failed to render ${name}:`, err.message);
    }
}

run();
