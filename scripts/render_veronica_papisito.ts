import { synthesizeGeminiSpeech } from '../src/lib/geminiTts';
import { uploadSovereignAsset } from '../src/lib/r2Client';
import { PERSONA_ARCHETYPES } from '../src/lib/personaTemplates';

const personaId = 'veronica-medellin-locked';
const voiceId = 'Kore';
const archetype = PERSONA_ARCHETYPES.find(a => a.id === personaId);

const name = 'veronica_3_tease.wav';
const text = "You're so bad, papisito... I really shouldn't be talking to you like this. But I like it... don't stop, oíste?";

const styleInstructions = `
Texture: ${archetype?.vocal_dna.texture}.
Prosody: ${archetype?.vocal_dna.prosody}.
Accent: ${archetype?.vocal_dna.accent}.
Intimacy: High-Heat & Suggestive.
Energy: whisper.
Culture: Colombian (Paisa).
`;

async function run() {
    console.log(`🔥 [Neural Re-Render] Injecting 'Papisito' into Tease Note...`);
    try {
        const result = await synthesizeGeminiSpeech(text, voiceId, styleInstructions);
        const publicUrl = await uploadSovereignAsset(result.data, name, 'audio/wav');
        console.log(`✅ SUCCESS: ${name} vaulted at ${publicUrl}`);
    } catch (err: any) {
        console.error(`❌ Failed to render ${name}:`, err.message);
    }
}

run();
