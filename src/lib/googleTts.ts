import fs from 'fs';
import path from 'path';
import { tmpdir } from 'os';

const GOOGLE_API_KEY = process.env.GOOGLE_VOICE_KEY || 'AIzaSyCCwobnrz5E2EFRbc_w2lekJvnIwE4kY4E';

export async function synthesizeGoogleSpeech(text: string, voiceName: string, languageCode: string = 'en-US') {
    console.log(`🎙️ [GoogleTTS] Synthesizing "${text.slice(0, 30)}..." with ${voiceName} [${languageCode}]`);

    const apiUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`;
    
    // Chirp 3 HD naming convention: [language_code]-Chirp3-HD-[voice_name]
    // Example: en-US-Chirp3-HD-Aoede
    const fullVoiceName = voiceName.includes('Chirp3') ? voiceName : `${languageCode}-Chirp3-HD-${voiceName}`;

    const requestBody = {
        input: { text },
        voice: {
            name: fullVoiceName,
            languageCode: languageCode
        },
        audioConfig: {
            audioEncoding: 'MP3',
            pitch: 0,
            speakingRate: 1.0,
            // Google Chirp 3 doesn't typically need fine-tuning via SSML or 
            // volume/pitch for HD voices, as they are pre-tuned for high fidelity.
        }
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Google TTS API Failed [${response.status}]: ${errText}`);
        }

        const data = await response.json();
        const audioContent = data.audioContent;

        if (!audioContent) {
            throw new Error('Google TTS: No audio content returned');
        }

        // Return the binary buffer
        return Buffer.from(audioContent, 'base64');
    } catch (err: any) {
        console.error('❌ [GoogleTTS] Failure:', err.message);
        throw err;
    }
}
