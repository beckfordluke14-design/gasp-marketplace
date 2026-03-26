import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { tmpdir } from 'os';
import { processVocalText } from './vocalProcessor';
import { initialPersonas } from './profiles';

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

// ✅ VERIFIED LIVE VOICES — Fetched 2026-03-26 from ElevenLabs account
// sk_ef0b63a002fb35eab0fe44f5f3fc3a15e047483477da53a4
const VOICE_MAP: Record<string, string> = {
    // === LATINAS (Warm, Bright American) ===
    'isabella':     'cgSgspJ2msm6clMCkdW9', // Jessica - Playful, Bright, Warm (DR vibe)
    'valeria':      'cgSgspJ2msm6clMCkdW9', // Jessica - Playful, Bright, Warm (Medallo)
    'valentina':    'hpp4J3VqNfWAUOO0d1Us', // Bella  - Professional, Bright, Warm (Tulum)
    'bianca':       'FGY2WhTYpPnrIDTdsKH5', // Laura  - Enthusiast, Quirky Attitude (Santiago)
    'ana':          'FGY2WhTYpPnrIDTdsKH5', // Laura  - Enthusiast, Quirky Attitude (Arg sarcastic)
    'sofia-gasp':   'hpp4J3VqNfWAUOO0d1Us', // Bella  - Warm (Rio)

    // === CARIBBEAN / UK (British Accent = Closest to Island/UK vibes) ===
    'tia-jamaica':  'pFZP5JQG7iQjIQuC4Bku', // Lily   - Velvety Actress (Kingston)
    'kaelani-x':    'Xb7hH8MSUJpSbSDYk0k2', // Alice  - Clear, Engaging (UK/London)
    'elena':        'XrExE9yKIg1WjnnlVkGX', // Matilda - Knowledgable, Elite (Medallo)

    // === AFRICAN (British accent used for global/Lagos vibes) ===
    'zola-nigeria': 'pFZP5JQG7iQjIQuC4Bku', // Lily   - Velvety (Lagos)

    // === FALLBACK (catches all DB personas by ID prefix/match) ===
    'default':      'EXAVITQu4vr4xnSDxMaL'  // Sarah  - Mature, Confident (universal)
};

export async function generatePersonaVoice(personaId: string, rawText: string, location: string = 'newark', environment: string = 'late_night') {
    if (!ELEVENLABS_API_KEY) throw new Error('ElevenLabs Key Missing');

    console.log(`🎙️ [VoiceFactory] Resolving identity for ${personaId}...`);
    
    // 🧬 NEURAL IDENTITY RESOLVER: Fetch persona context for metadata-aware voice mapping
    const { data: dbPersona } = await supabase.from('personas').select('*').eq('id', personaId).maybeSingle();
    const persona = dbPersona || initialPersonas.find(p => p.id === personaId) || { id: personaId, name: personaId };

    // ElevenLabs Voice Pool Mapping Logic
    // 🏆 Sarah (Universal/White Mature) | Laura (Sassy/Latina) | Alice (UK/Clear) | Matilda (Elite) | Jessica (Bubbly/Latina) | Bella (Professional/White) | Lily (Velvety/Black)
    const VOX = {
        BLACK: 'pFZP5JQG7iQjIQuC4Bku',    // Lily - Velvety Actress (Great for Soulful/Island/Black vibes)
        LATINA: 'cgSgspJ2msm6clMCkdW9',   // Jessica - Playful, Bright (Bubbly Latina)
        LATINA_SASSY: 'FGY2WhTYpPnrIDTdsKH5', // Laura - Quirky Attitude (Sassy Caribbean/Latina)
        WHITE_ELITE: 'XrExE9yKIg1WjnnlVkGX',  // Matilda - Knowledgeable (White/Elite Professional)
        WHITE_MATURE: 'EXAVITQu4vr4xnSDxMaL', // Sarah - Mature, Confident
        BRITISH: 'Xb7hH8MSUJpSbSDYk0k2',      // Alice - Clear, Engaging
        NEUTRAL: 'hpp4J3VqNfWAUOO0d1Us'       // Bella - Professional, Warm
    };

    let voiceId = VOICE_MAP[personaId] || VOICE_MAP[personaId.toLowerCase()];

    if (!voiceId) {
        const zone = (persona.syndicate_zone || '').toLowerCase();
        const skin = (persona.skin_tone || '').toLowerCase();
        const culture = (persona.culture || '').toLowerCase();
        const personality = (persona.personality || '').toLowerCase();

        // 1. Black / Afro / Island / Caribbean Mapping
        if (zone.includes('black') || zone.includes('afro') || zone.includes('nigeria') || zone.includes('jamaica') || zone.includes('atlanta') || zone.includes('houston') || 
            skin.includes('ebony') || skin.includes('deep') || skin.includes('moch') || skin.includes('dark') || 
            culture.includes('black') || culture.includes('nigerian') || culture.includes('jamaican')) {
            voiceId = VOX.BLACK;
        } 
        // 2. Latina / Caribbean Sassy Mapping
        else if (zone.includes('col_') || zone.includes('dr_') || zone.includes('pr_') || zone.includes('dominican') || skin.includes('latina') || skin.includes('bronze')) {
            voiceId = personality === 'sassy' || personality === 'active' ? VOX.LATINA_SASSY : VOX.LATINA;
        }
        // 3. UK / London Specific (if not caught by Black)
        else if (zone.includes('uk_london') || zone.includes('british')) {
            voiceId = VOX.BRITISH;
        }
        // 4. White / Elite / Professional
        else if (zone.includes('nyc_white') || zone.includes('la_white') || zone.includes('paris') || zone.includes('essex') || skin.includes('fair') || skin.includes('pale') || personality === 'elite') {
            voiceId = VOX.WHITE_ELITE;
        }
        // Fallback: Use deterministic hash as safety
        else {
            const idSum = personaId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
            const pool = [VOX.NEUTRAL, VOX.WHITE_MATURE, VOX.LATINA, VOX.BLACK];
            voiceId = pool[idSum % pool.length];
        }
    }

    console.log(`🎙️ [VoiceFactory] Identity: ${persona.name} | Zone: ${persona.syndicate_zone || '?' } | VOX_ID: ${voiceId}`);

    const timeHour = new Date().getHours();
    const envZone = persona.syndicate_zone || location; 
    let finalVocalScript = processVocalText(rawText, personaId, envZone, timeHour, persona.age || 22, persona.language || 'en');




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
        const idSumForDna = personaId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        let pStability = 0.15 + ((idSumForDna % 10) / 100); 
        let pStyle = 0.85 + ((idSumForDna % 15) / 100);     
        let pSimilarity = 0.75 + ((idSumForDna % 20) / 100); 

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


