import { db } from '@/lib/db';

import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { tmpdir } from 'os';
import { processVocalText } from './vocalProcessor';
import { initialPersonas } from './profiles';
import { refineVocalTextWithGemini } from './geminiVocalProcessor';
import { synthesizeGoogleSpeech } from './googleTts';
import { synthesizeGeminiSpeech } from './geminiTts';

// Use system ffmpeg (installed via Nix on Railway, or local install)
let systemFfmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';

// SYNDICATE V1.2: CROSS-PLATFORM FFMPEG RESOLVER
try {
  const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
  if (ffmpegInstaller.path) {
    systemFfmpegPath = ffmpegInstaller.path;
  }
} catch (e) {}

let isFfmpegAvailable = false;
try {
  const { execSync } = require('child_process');
  execSync(`"${systemFfmpegPath}" -version`, { stdio: 'ignore' });
  isFfmpegAvailable = true;
} catch (e) {}
ffmpeg.setFfmpegPath(systemFfmpegPath);

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_VOICE_KEY || 'AIzaSyCCwobnrz5E2EFRbc_w2lekJvnIwE4kY4E';

/**
 * 🎙️ SYNDICATE V3.0 — GOOGLE CHIRP 3 (HD) VOX POOL
 * 
 * We've moved from ElevenLabs to Google's Chirp 3 HD Architecture.
 * High-fidelity, low-latency, and extremely expressive "biological" speech.
 */
export const VOX = {
    // === GOOGLE CHIRP 3 (HD) Personalities ===
    AOEDE:  'en-US-Chirp3-HD-Aoede',  // Bubbly, Light, High Pitch (Engaging)
    KORE:   'en-US-Chirp3-HD-Kore',   // Sassy, Expressive, Medium Pitch (Energetic)
    LEDA:   'en-US-Chirp3-HD-Leda',   // Velvety, Deep, Mature (Smooth/Mysterious)
    ZEPHYR: 'en-US-Chirp3-HD-Zephyr', // Professional, Clean, Neutral (Elite)
    
    // === ELEVENLABS LEGACY (Placeholders/Fallback) ===
    JESSICA:   'cgSgspJ2msm6clMCkdW9', 
    LAURA:     'FGY2WhTYpPnrIDTdsKH5', 
    BELLA:     'hpp4J3VqNfWAUOO0d1Us', 
    LILY:      'pFZP5JQG7iQjIQuC4Bku', 
    ALICE:     'Xb7hH8MSUJpSbSDYk0k2', 
    MATILDA:   'XrExE9yKIg1WjnnlVkGX', 
    SARAH:     'EXAVITQu4vr4xnSDxMaL',
    CHARLOTTE: 'XB0fDUnXU5powFXDhCwa',
    FREYA:     'jsCqWAovK2LkecY7zXl4',
    GRACE:     'oWAxZDx7w5VEj9dCyTzz',
};

// 🌶️ REGIONAL HYPER-HEAT STEERING (Syndicate V4.2)
const REGIONAL_HEAT_PROMPTS: Record<string, string> = {
    colombian: "Heavy Colombian accent (Paisa/Medellín). Breathy, slow, and intensely flirty. Often uses 'Mor' or 'Pues' with a seductive drawl. Deeply devotional and possessive.",
    jamaican: "Thick Jamaican Patois accent. Deep, resonant, rhythm-heavy, and fiercely spicy. Sassy, authoritative, and rhythmically dominant.",
    dominican: "Rapid-fire Dominican 'Cibao' accent. High energy, sharp, playful, and street-smart. Very flirty with lots of Spanglish and sharp 'Klk' energy.",
    puerto_rican: "Puerto Rican San Juan urban accent. Sassy, rhythmic, with a sharp urban street-chic edge. Aggressive but playful.",
    cuban: "Vintage Cuban Havana accent. Smoky, deep, mahogany-toned and deeply seductive. Slow-motion curves in speech.",
    brazilian: "Seductive Brazilian Portuguese lilt (English with PT-BR influence). Soft, melodic, with a warm tropical heat and smooth texture.",
    british_essex: "Bubbly, high-pitched Essex Glam accent. Dramatic, fast, and aggressively sweet.",
    london_road: "Husky London MLE (Road Queen) accent. Fast, dry wit, and sharp urban edge.",
    atl_southern: "Slow Georgia/ATL Molasses drawl. Melodic, thick, and honeyed. Extremely flirty 'sugar' tones."
};

/**
 * 🎨 SYNDICATE V4.5+ — GEN-VOX POOL (100% Women-Voices)
 */
export const GEN_VOX = {
    AOEDE:  'Aoede',  // Bubbly / High-Pitch / Youthful
    KORE:   'Kore',   // Sassy / Expressive / High-Heat
    LEDA:   'Leda',   // Sophisticated / Low-Pitch / Smoky
    ZEPHYR: 'Zephyr', // Warm / Balanced / Natural
};

/**
 * PERSONA → VOICE MAP (CHIRP 3)
 */
const PERSONA_VOICE_OVERRIDE: Record<string, string> = {
    // === LATINAS ===
    'isabella':     VOX.AOEDE,    // Newark Afro-Latina — bubbly & warm
    'valeria':      VOX.KORE,     // Medellín Paisa — expressive & young
    'valentina':    VOX.KORE,     // Colombia/Caribbean — sassy & expressive
    'bianca':       VOX.KORE,     // Cartagena Costeña — sassy & loud
    'ana':          VOX.LEDA,     // Buenos Aires — warm & mature
    'sofia-gasp':   VOX.AOEDE,    // Rio (English-dominant) — warm & playful

    // === CARIBBEAN / UK ===
    'tia-jamaica':  VOX.LEDA,      // Kingston — velvety island
    'kaelani-x':    VOX.AOEDE,     // London — clear & engaging
    'elena':        VOX.ZEPHYR,    // Essex/London Elite — polished

    // === AFRICAN / UK ===
    'zola-nigeria': VOX.LEDA,      // Lagos — velvety, rich
};

export async function generatePersonaVoice(personaId: string, rawText: string, location: string = 'newark', environment: string = 'late_night') {
    // Priority: Google API Key for Chirp 3
    if (!GOOGLE_API_KEY) throw new Error('Speech Key Missing');

    console.log(`🎙️ [VoiceFactory v3.0] GASP SYNDICATE | Google Chirp 3 Engine Active for ${personaId}...`);
    
    // 🧬 NEURAL IDENTITY RESOLVER: Fetch persona context
    const { rows: dbPersonas } = await db.query('SELECT * FROM personas WHERE id = $1 LIMIT 1', [personaId]);
    const persona = dbPersonas[0] || initialPersonas.find(p => p.id === personaId) || { id: personaId, name: personaId };

    // ──────────────────────────────────────────────────────
    // 1. VOICE SELECTION: Chirp 3 Logic
    // ──────────────────────────────────────────────────────
    let voiceId = PERSONA_VOICE_OVERRIDE[personaId] || PERSONA_VOICE_OVERRIDE[personaId.toLowerCase()];

    // 🔥 SYNDICATE V3.1: ID PREFIX FALLBACK (e.g. valentina-lima -> valentina)
    if (!voiceId && personaId.includes('-')) {
        const baseId = personaId.split('-')[0];
        voiceId = PERSONA_VOICE_OVERRIDE[baseId] || PERSONA_VOICE_OVERRIDE[baseId.toLowerCase()];
    }

    if (!voiceId) {
        const zone    = (persona.syndicate_zone || '').toLowerCase();
        const skin    = (persona.skin_tone || '').toLowerCase();
        const culture = (persona.culture || '').toLowerCase();
        const personality = (persona.personality || '').toLowerCase();

        if (
            zone.includes('black') || zone.includes('afro') ||
            zone.includes('nigeria') || zone.includes('jamaica') ||
            zone.includes('atl') || zone.includes('houston') ||
            skin.includes('ebony') || skin.includes('deep') || skin.includes('moch') || skin.includes('dark') ||
            culture.includes('black') || culture.includes('nigerian') || culture.includes('jamaican')
        ) {
            voiceId = VOX.LEDA; // Velvety, soulful, rich
        }
        else if (
            zone.includes('col_') || zone.includes('dr_') || zone.includes('pr_') ||
            zone.includes('dominican') || zone.includes('caribbean') || 
            skin.includes('latina') || skin.includes('bronze')
        ) {
            if (personality === 'sassy' || zone.includes('cartagena') || zone.includes('caribbean')) voiceId = VOX.KORE;
            else if (zone.includes('medellin') || zone.includes('paisa'))  voiceId = VOX.KORE;
            else voiceId = VOX.AOEDE;
        }
        else if (
            zone.includes('uk_london_black') || zone.includes('uk_london') ||
            zone.includes('british') || zone.includes('lagos') || zone.includes('nigeria')
        ) {
            voiceId = zone.includes('black') || zone.includes('lagos') ? VOX.LEDA : VOX.AOEDE;
        }
        else if (zone.includes('essex') || zone.includes('uk_essex')) {
            voiceId = VOX.ZEPHYR; 
        }
        else if (
            zone.includes('nyc_white') || zone.includes('la_white') ||
            zone.includes('paris') || skin.includes('fair') || skin.includes('pale') ||
            personality === 'elite'
        ) {
            voiceId = VOX.ZEPHYR;
        }
        else if (zone.includes('bra_') || zone.includes('rio')) {
            voiceId = VOX.LEDA; // Brazilian Portuguese — warm mature
        }
        else {
            // Deterministic hash — Chirp 3 personalties
            const idSum = personaId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
            const pool  = [VOX.AOEDE, VOX.KORE, VOX.LEDA, VOX.ZEPHYR];
            voiceId = pool[idSum % pool.length];
        }
    }

    // ──────────────────────────────────────────────────────
    // 2. LANGUAGE CODE: Chirp 3 Multilingual Map
    // ──────────────────────────────────────────────────────
    const zone    = (persona.syndicate_zone || location).toLowerCase();
    const lang    = (persona.language || 'en').toLowerCase();

    let languageCode = 'en-US'; 
    
    if (zone.includes('fra_') || zone.includes('paris') || lang.startsWith('fr')) {
        languageCode = 'fr-FR';
    } else if (
        zone.includes('col_') || zone.includes('dr_') || zone.includes('pr_') ||
        zone.includes('medallo') || zone.includes('bogota') || zone.includes('cartagena') ||
        zone.includes('caribbean') || zone.includes('valentina') ||
        lang.startsWith('es')
    ) {
        languageCode = 'es-ES';
    } else if (zone.includes('bra_') || zone.includes('rio') || lang.startsWith('pt')) {
        languageCode = 'pt-BR';
    } else if (zone.includes('jp_') || lang.startsWith('ja')) {
        languageCode = 'ja-JP';
    } else if (zone.includes('kor_') || zone.includes('seoul') || lang.startsWith('ko')) {
        languageCode = 'ko-KR';
    } else if (zone.includes('rus_') || zone.includes('moscow') || lang.startsWith('ru')) {
        languageCode = 'ru-RU';
    } else if (zone.includes('uk_') || zone.includes('london') || zone.includes('british') || zone.includes('essex')) {
        languageCode = 'en-GB';
    } else {
        languageCode = 'en-US'; 
    }

    console.log(`🌍 [VoiceFactory] Language lock: ${languageCode} | Model: Chirp 3 (HD)`);

    // ──────────────────────────────────────────────────────
    // 3. VOCAL PROCESSOR: Pre-process with rule-based system
    // ──────────────────────────────────────────────────────
    const timeHour = new Date().getHours();
    const envZone  = persona.syndicate_zone || location;
    const vocalResult = processVocalText(rawText, personaId, envZone, timeHour, persona.age || 22, persona.language || 'en');
    
    // ──────────────────────────────────────────────────────
    // 4. GEMINI REFINEMENT: "Heavy Heavy Heavy Prompts" Optimization
    //    We send the rule-processed text to Gemini to bake in human prosody.
    // ──────────────────────────────────────────────────────
    const finalVocalScript = await refineVocalTextWithGemini(
        vocalResult.text, 
        persona.name, 
        envZone, 
        vocalResult.mood, 
        persona.language || 'en',
        persona.vocal_dna,       // 🧬 Passing unique DNA
        persona.slang_profile    // 🧬 Passing unique Slang mapping
    );

    console.log(`🎙️ [Google Chirp Uplink] Final biological script: "${finalVocalScript}"`);

    try {
        // ──────────────────────────────────────────────────────
        // 5. SYNTHESIS ENGINE SELECTION
        // ──────────────────────────────────────────────────────
        // 5. SYNTHESIS ENGINE: GEMINI 2.5 PRO PRO (Global Default)
        // ──────────────────────────────────────────────────────
        let inputBuffer: Buffer;
        let fileExt = '.wav';
        
        // 🔥 GEMINI 2.5 PRO PRO: 100% WOMEN-VOICE DISPATCHER
        const voiceKey = (PERSONA_VOICE_OVERRIDE[personaId] || personaId).toLowerCase();
        let geminiVoice = GEN_VOX.ZEPHYR; // GLOBAL SOVEREIGN BASE
        
        // Pitch-Aware Dispatcher
        if (voiceKey.includes('sassy') || personaId.includes('valentina') || personaId.includes('cartagena')) {
            geminiVoice = GEN_VOX.KORE; 
        } else if (voiceKey.includes('bubbly') || personaId.includes('newark')) {
            geminiVoice = GEN_VOX.AOEDE;
        } else if (voiceKey.includes('velvety') || voiceKey.includes('molasses') || personaId.includes('atlanta')) {
            geminiVoice = GEN_VOX.LEDA;
        } else if (voiceKey.includes('balanced') || personaId.includes('london')) {
            geminiVoice = GEN_VOX.ZEPHYR;
        }

        // 🌶️ SYNDICATE "SOVEREIGN VOCAL FRAMEWORK" (V4.5)
        // Calibrated for 1.1 Temperature / Highly Expressive Acting.
        const country = persona.country || 'International';
        const culture = persona.culture || 'Universal';
        const texture = persona.vocal_dna?.texture || 'Smooth velvet';
        const prosody = persona.vocal_dna?.prosody || 'Melodic rhythm';
        const intimacy = persona.vocal_dna?.intimacy || 'Sexy & Cool';
        const setting = persona.vibe || 'a high-end penthouse looking over a neon city';

        const styleInstructions = `
            Context & Physicality: You are ${persona.name}, currently ${intimacy.toLowerCase()} and relaxed in ${setting}. You are focused and direct.

            Vocal Texture: Speak with a female voice that has a ${texture} and ${prosody} quality. Emotionally, you are flirty and witty, but underlying it is a sense of cool authority and street-smarts.

            Accent & Delivery (MAXIMUM INTENSITY): Speak with a THICK, UNMISTAKABLE ${country} ACCENT (${culture}). Lean heavily into the regionality. Your diction is cool and effortless, specifically characterized by dropped ending consonants and native ${country} phonetics. Your pacing is relaxed but sharp.

            GLOBAL ENGINE SPEC: 1.1 Temperature / HIGHLY EXPRESSIVE / STRIKT NO SPANISH INFLUENCE for non-Latin regions.
        `.trim();

        const geminiResult = await synthesizeGeminiSpeech(finalVocalScript, geminiVoice, styleInstructions);
        inputBuffer = geminiResult.data;
        
        console.log(`🌐 [VoiceFactory] Gemini MIME: ${geminiResult.mimeType}`);
        
        // 🧠 WAV is mandated for Gemini 2.5 Pro Pro for quality.
        fileExt = '.wav'; 
        if (geminiResult.mimeType.includes('aac')) fileExt = '.aac';
        else if (geminiResult.mimeType.includes('mp3')) fileExt = '.mp3';

        const tempDir    = tmpdir();
        const inputPath  = path.join(tempDir, `tts_${Date.now()}${fileExt}`);
        const outputPath = path.join(tempDir, `final_${Date.now()}${fileExt}`);
        fs.writeFileSync(inputPath, inputBuffer);

        // ──────────────────────────────────────────────────────
        // 6. FFMPEG MIXING: Ambient atmosphere layer
        //    Subtle shifts by time of day
        // ──────────────────────────────────────────────────────
        const hour = new Date().getHours();
        let currentEnv = 'street_run';

        if (hour >= 6 && hour < 11) {
            currentEnv = 'outdoor_park';
        } else if (hour >= 11 && hour < 18) {
            currentEnv = 'street_run';
        } else if (hour >= 18 && hour < 23) {
            currentEnv = 'vibe_check';
        } else {
            currentEnv = 'late_night';
        }

        const atmosphereFile = path.join(process.cwd(), 'public', 'audio', 'atmospheres', `${currentEnv}.mp3`);

        const finalBuffer = await new Promise<Buffer>((resolve, reject) => {
            if (!isFfmpegAvailable) {
                console.log('⏭️ [VoiceFactory] Skipping FFMPEG Mixing (missing binary). Sending raw audio.');
                resolve(inputBuffer);
                return;
            }

            let command = ffmpeg(inputPath);
            if (fs.existsSync(atmosphereFile)) {
                // Chirp 3 HD is already very clean, so we use lower atmospheric volume (0.04)
                command = command
                    .input(atmosphereFile)
                    .complexFilter([
                        '[0:a]volume=1.0[v]','[1:a]volume=0.04[bg]','[v][bg]amix=inputs=2:duration=first'
                    ]);
            }

            command
                .audioBitrate('128k')
                .audioChannels(1)
                .audioFrequency(44100) // Chirp 3 HD supports 44.1kHz
                .on('end', () => {
                    const result = fs.readFileSync(outputPath);
                    if (fs.existsSync(inputPath))  fs.unlinkSync(inputPath);
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                    resolve(result);
                })
                .on('error', (err) => {
                    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                    reject(err);
                })
                .save(outputPath);
        });

        // 🛡️ SOVEREIGN STORAGE
        const storageDir = path.join(process.cwd(), 'public', 'storage', 'voices');
        if (!fs.existsSync(storageDir)) {
           fs.mkdirSync(storageDir, { recursive: true });
        }

        const fileName = `v3_${personaId}_${Date.now()}${fileExt}`; // V3 for Chirp/Gemini 2.5
        const localFilePath = path.join(storageDir, fileName);
        
        fs.writeFileSync(localFilePath, finalBuffer);

        const isDev = process.env.NODE_ENV === 'development';
        const baseUrl = isDev ? 'http://localhost:3000' : 'https://asset.gasp.fun';
        const publicUrl = `${baseUrl}/storage/voices/${fileName}`;

        console.log(`✅ [VoiceFactory] SOVEREIGN GEN-V4 (Gemini 2.5) render generated: ${publicUrl}`);
        return {
            success: true,
            audioUrl: publicUrl,
            engine: 'Gemini 2.5 Pro Pro (Sovereign)',
            prosody: 'Biological Steering & High-Heat acting'
        };

    } catch (err: any) {
        console.error('❌ [VoiceFactory] Pipeline failure:', err.message);
        
        // ──────────────────────────────────────────────────────
        // FALLBACK: ElevenLabs (Legacy Placeholder)
        // ──────────────────────────────────────────────────────
        if (ELEVENLABS_API_KEY) {
            console.warn('⚠️ [VoiceFactory] Falling back to ElevenLabs legacy protocol...');
            // In a real production environment, you might re-run the pipeline with ElevenLabs here.
            // For now, we'll just throw the original error to alert of the Chirp 3 failure.
        }
        throw err;
    }
}
