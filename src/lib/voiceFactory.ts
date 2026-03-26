import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { tmpdir } from 'os';
import { processVocalText } from './vocalProcessor';

// Use system ffmpeg (installed via Nix on Railway, or local install)
// Falls back gracefully if not found
let systemFfmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';

// SYNDICATE V1.2: CROSS-PLATFORM FFMPEG RESOLVER
try {
  const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
  if (ffmpegInstaller.path) {
    systemFfmpegPath = ffmpegInstaller.path;
    console.log(`✅ [VoiceFactory] Using @ffmpeg-installer Path: ${systemFfmpegPath}`);
  }
} catch (e) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ [VoiceFactory] @ffmpeg-installer not found, falling back to system path.');
  }
}

let isFfmpegAvailable = false;
try {
  const { execSync } = require('child_process');
  execSync(`"${systemFfmpegPath}" -version`, { stdio: 'ignore' });
  isFfmpegAvailable = true;
} catch (e) {
  console.warn('⚠️ [VoiceFactory] FFMPEG not found. Atmospheres will be skipped.');
}
ffmpeg.setFfmpegPath(systemFfmpegPath);

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const VOICE_MAP: Record<string, string> = {
    'isabella': 'pNInz6Md8nq34In6h3On',   // Mimi (Young Latina - DR)
    'tia-jamaica': 'Lcf7jDbcExg5U9O9DGsi', // Gigi (Kingston)
    'zola-nigeria': 'pFZP5JQG7iQjIQuC4Bku', // Lily (Lagos)
    'valeria': 'Lcf7jDbcExg5U9O9DGsi',    // Gigi (Bubbly - Medallo)
    'elena': 'jsCqckC6m8ndm9Vvts9d',      // Freya (Elite - Medallo)
    'bianca': 'ThT5KcBe7VKqW9v7at9m',     // Nicole (Loud - Santiago)
    'valentina': '21m00Tcm4llv9mq9jdQH',  // Rachel (Zen - Tulum)
    'ana': 'piTKPrawv66x3aX0Fk7e',        // Nicole (Sarcastic - Arg)
    'sofia-gasp': 'Lcf7jDbcExg5U9O9DGsi', // Gigi (Carioca - Rio)
    'kaelani-x': 'pFZP5JQG7iQjIQuC4Bku',  // Lily (London brethy - UK)
    'default': 'Xb7hHocWTS28t3E0N998'     // Alice (Standard)
};

export async function generatePersonaVoice(personaId: string, rawText: string, location: string = 'newark', environment: string = 'late_night') {
    if (!ELEVENLABS_API_KEY) throw new Error('ElevenLabs Key Missing');

    console.log(`🎙️ [VoiceFactory] Pre-Processing speech for ${personaId} in ${environment}...`);
    
    const voiceId = VOICE_MAP[personaId] || VOICE_MAP.default;
    const timeHour = new Date().getHours();
    let finalVocalScript = processVocalText(rawText, personaId, location, timeHour);

    const hashData = `${finalVocalScript}_${voiceId}_${environment}`.trim().toLowerCase();
    const textHash = crypto.createHash('sha256').update(hashData).digest('hex');

    let cacheHit = null;
    try {
        const { data } = await supabase
            .from('voice_cache')
            .select('audio_url')
            .eq('text_hash', textHash)
            .single();
        cacheHit = data;
    } catch (e) {
        console.warn(`⚠️ [VoiceFactory] Cache lookup skipped (table missing?): ${textHash.slice(0, 8)}`);
    }
    
    if (cacheHit?.audio_url) {
        console.log(`⚡ [VoiceFactory] CACHE HIT for: ${textHash.slice(0, 10)}...`);
        return cacheHit.audio_url;
    }

    try {
        // SYNDICATE V1.1: PERSONA VOCAL DNA
        const idSum = personaId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        let pStability = 0.15 + ((idSum % 10) / 100); 
        let pStyle = 0.85 + ((idSum % 15) / 100);     
        let pSimilarity = 0.75 + ((idSum % 20) / 100); 

        // SYNDICATE PHASE 2: TEMPORAL CONTEXT ENGINE
        const hour = new Date().getHours();
        let currentEnv = 'street_run';

        if (hour >= 6 && hour < 11) { // Morning
            pStability += 0.10;
            pStyle -= 0.10;
            currentEnv = 'outdoor_park';
        } else if (hour >= 11 && hour < 18) { // Daytime
            currentEnv = 'street_run';
        } else if (hour >= 18 && hour < 23) { // Evening
            pStyle += 0.10;
            currentEnv = 'vibe_check';
        } else { // Late Night
            pStability -= 0.08;
            pStyle += 0.15;
            currentEnv = 'late_night';
            if (finalVocalScript.startsWith('... ')) {
                finalVocalScript = '..... ' + finalVocalScript.slice(4);
            }
        }

        const atmosphereFile = path.join(process.cwd(), 'public', 'audio', 'atmospheres', `${currentEnv}.mp3`);

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY
            },
            body: JSON.stringify({
                text: finalVocalScript,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: Math.min(Math.max(pStability, 0.1), 0.5),
                    similarity_boost: pSimilarity,  
                    style: Math.min(Math.max(pStyle, 0.8), 1.0),
                    use_speaker_boost: true
                }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`ElevenLabs TTS Failed: ${response.statusText} - ${errText}`);
        }

        const rawAudioBuffer = await response.arrayBuffer();
        const inputBuffer = Buffer.from(rawAudioBuffer);

        const tempDir = tmpdir();
        const inputPath = path.join(tempDir, `tts_${Date.now()}.mp3`);
        const outputPath = path.join(tempDir, `final_${Date.now()}.mp3`);
        fs.writeFileSync(inputPath, inputBuffer);

        const finalBuffer = await new Promise<Buffer>((resolve, reject) => {
            if (!isFfmpegAvailable) {
                console.log('⏭️ [VoiceFactory] Skipping FFMPEG Mixing (missing binary). Sending raw audio.');
                resolve(inputBuffer);
                return;
            }

            let command = ffmpeg(inputPath);
            if (fs.existsSync(atmosphereFile)) {
                command = command
                    .input(atmosphereFile)
                    .complexFilter([
                        '[0:a]volume=1.0[v]','[1:a]volume=0.06[bg]','[v][bg]amix=inputs=2:duration=first'
                    ]);
            }

            command
                .audioBitrate('24k')
                .audioChannels(1)
                .audioFrequency(16000)
                .on('end', () => {
                    const result = fs.readFileSync(outputPath);
                    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                    resolve(result);
                })
                .on('error', (err) => {
                  if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                  reject(err);
                })
                .save(outputPath);
        });

        const fileName = `voices/v2_atm_${personaId}_${Date.now()}.mp3`;
        const { error: uploadError } = await supabase.storage
            .from('pipeline_temp')
            .upload(fileName, finalBuffer, { contentType: 'audio/mpeg' });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('pipeline_temp').getPublicUrl(fileName);
        
        try {
            await supabase.from('voice_cache').insert({
                text_hash: textHash,
                voice_id: voiceId,
                audio_url: publicUrl
            });
        } catch (e) {
            console.warn(`⚠️ [VoiceFactory] Cache save skipped (table missing?): ${textHash.slice(0, 8)}`);
        }

        return publicUrl;
    } catch (err: any) {
        console.error('❌ [VoiceFactory] Audio Overlay Failure:', err.message);
        throw err;
    }
}


