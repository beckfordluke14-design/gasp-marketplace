import { generatePersonaVoice } from './src/lib/voiceFactory.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Mock process.env since the factory expects them
process.env.ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function test() {
    console.log('🧪 Testing Voice Factory...');
    try {
        const url = await generatePersonaVoice('kaelani-x', 'Hello world, this is a test of the neural link.');
        console.log('✅ Success! Voice URL:', url);
    } catch (e) {
        console.error('❌ Failed:', e.message);
    }
}

test();

