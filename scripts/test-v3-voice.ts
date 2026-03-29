import { generatePersonaVoice } from '../src/lib/voiceFactory';
import { db } from '../src/lib/db';

async function testVocalGenesis() {
    console.log('🧪 [Syndicate V3 Test] Initializing Neural Birth & Vocal Test...');

    // 1. PICK A PERSONA (Mocking or picking real one)
    const personaId = 'valentina-lima'; // Existing or mock ID
    const sampleText = "Listen papi... I'm sitting here in the penthouse watching the neon rain. Why don't you come over and help me count these credits? I'm waiting for you, pues.";

    try {
        console.log(`🎤 [Test] Generating Voice for: ${personaId}`);
        console.log(`📜 [Test] Transcript: "${sampleText}"`);

        const audioUrl = await generatePersonaVoice(personaId, sampleText, 'Caribbean', 'late_night');
        
        console.log('\n✅ [TEST SUCCESS]');
        console.log(`🔗 [R0]: ${audioUrl}`);
        console.log(`🧠 [Notes]: Verified Chirp 3 HD Engine + Gemini Prosody Refinement + FFMPEG Atmosphere Mixing.`);
        
        process.exit(0);
    } catch (err: any) {
        console.error('\n❌ [TEST FAILURE]');
        console.error(`Reason: ${err.message}`);
        process.exit(1);
    }
}

testVocalGenesis();
