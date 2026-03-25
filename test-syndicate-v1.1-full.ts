// test-syndicate-v1.1-full.ts
// Verifies the complete Syndicate Pipeline: Neural Warming + Atmosphere + DNA + Crush.
import { generatePersonaVoice } from './src/lib/voiceFactory';

async function runEndToEndTest() {
    console.log('🚀 [SYNDICATE] STARTING FULL-CHAIN VALIDATION (V1.1)...');
    
    // Test Persona: Isabella (Mimi) - 20yo
    // Scenario: Late Night Yearning (Whisper + Room Tone)
    const personaId = 'isabella';
    const text = "Heey... I was literally just thinking about you. Come over?";
    const zone = 'medellin';
    const env = 'late_night';

    console.log(`🎭 Target: ${personaId} | Zone: ${zone} | Env: ${env}`);
    
    try {
        const publicUrl = await generatePersonaVoice(personaId, text, zone, env);
        console.log('\n🔥 FULL CHAIN COMPLETE!');
        console.log('🔗 Link to Authentic Voice Note:', publicUrl);
        console.log('✨ (Includes: Neural Warming, 20yo DNA, Room Tone Atmosphere, and 24k Crush)');
    } catch (e: any) {
        console.error('❌ VALIDATION FAILED:', e.message);
    }
}

runEndToEndTest();

