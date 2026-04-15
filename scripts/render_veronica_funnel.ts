import { synthesizeGeminiSpeech } from '../src/lib/geminiTts';
import { uploadSovereignAsset } from '../src/lib/r2Client';
import { PERSONA_ARCHETYPES } from '../src/lib/personaTemplates';

const personaId = 'veronica-medellin-locked';
const voiceId = 'Kore';
const archetype = PERSONA_ARCHETYPES.find(a => a.id === personaId);

const scripts = [
    { name: 'veronica_1_hook.wav', text: "Mmm... hola papi. Nice to meet you... you look like trouble, oíste?" },
    { name: 'veronica_2_bond.wav', text: "I really love your vibe... it's different. I don't usually talk to guys like you... but you've got me interested pues." },
    { name: 'veronica_3_tease.wav', text: "You're so bad, papi... I really shouldn't be talking to you like this. But I like it... don't stop." },
    { name: 'veronica_4_close.wav', text: "Oh no! No no no... my link is dying! Papi, I'm losing the connection! Hurry... go to my vault right now so I don't lose you forever! GO!" }
];

const styleInstructions = `
Texture: ${archetype?.vocal_dna.texture}.
Prosody: ${archetype?.vocal_dna.prosody}.
Accent: ${archetype?.vocal_dna.accent}.
Intimacy: ${archetype?.vocal_dna.intimacy}.
Energy: ${archetype?.vocal_dna.energy}.
Culture: ${archetype?.culture}.
Country: ${archetype?.country}.
`;

async function run() {
    console.log(`🔥 [Neural Re-Render] Swapping Funnel Voices to Gemini 2.25 Kore...`);

    for (const s of scripts) {
        console.log(`Rendering ${s.name}...`);
        try {
            const result = await synthesizeGeminiSpeech(s.text, voiceId, styleInstructions);
            
            // Upload to R2 (this will overwrite/update the assets at asset.gasp.fun/voices/...)
            const publicUrl = await uploadSovereignAsset(result.data, s.name, 'audio/wav');
            
            console.log(`✅ SUCCESS: ${s.name} vaulted at ${publicUrl}`);
        } catch (err: any) {
            console.error(`❌ Failed to render ${s.name}:`, err.message);
        }
    }
}

run();
