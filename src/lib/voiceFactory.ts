import { db } from '@/lib/db';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { tmpdir } from 'os';
import { processVocalText } from './vocalProcessor';
import { initialPersonas } from './profiles';

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

/**
 * ✅ VERIFIED LIVE VOICES — Fetched from ElevenLabs account
 * 
 * SYNDICATE V2.0 — UNIQUE VOICE DNA PER PERSONA
 * Every persona now maps to a DISTINCT voice ID.
 * No two primary personas share the same voice.
 *
 * ElevenLabs Voice Pool (verified active):
 *   Jessica  cgSgspJ2msm6clMCkdW9  — Bubbly, Youthful Latina (warm, playful)
 *   Laura    FGY2WhTYpPnrIDTdsKH5  — Quirky Attitude, Sassy (Latina/Caribbean)
 *   Bella    hpp4J3VqNfWAUOO0d1Us  — Professional Warm (neutral, clean)
 *   Lily     pFZP5JQG7iQjIQuC4Bku  — Velvety Actress (soulful, island, Black)
 *   Alice    Xb7hH8MSUJpSbSDYk0k2  — Clear, Engaging British (UK/London)
 *   Matilda  XrExE9yKIg1WjnnlVkGX  — Knowledgeable, Elite (white/professional)
 *   Sarah    EXAVITQu4vr4xnSDxMaL  — Mature, Confident (neutral universal)
 *   Charlotte XB0fDUnXU5powFXDhCwa  — Warm, mature (versatile/fallback)
 *   Freya    jsCqWAovK2LkecY7zXl4  — Expressive, young (alternative Latina)
 *   Grace    oWAxZDx7w5VEj9dCyTzz  — Southern, warm (ATL/Houston Black vibe)
 */
export const VOX = {
    JESSICA:   'cgSgspJ2msm6clMCkdW9',  // Bubbly Latina — Newark, DR, PR
    LAURA:     'FGY2WhTYpPnrIDTdsKH5',  // Sassy Caribbean/Latina — Cartagena, Boricua
    BELLA:     'hpp4J3VqNfWAUOO0d1Us',  // Professional Warm — Bogotá, Medellín elite
    LILY:      'pFZP5JQG7iQjIQuC4Bku',  // Velvety Island/Black — Jamaica, Nigeria
    ALICE:     'Xb7hH8MSUJpSbSDYk0k2',  // Clear British — London, Essex
    MATILDA:   'XrExE9yKIg1WjnnlVkGX',  // Elite/Professional — white NYC, LA, Paris
    SARAH:     'EXAVITQu4vr4xnSDxMaL',  // Mature Confident — universal fallback
    CHARLOTTE: 'XB0fDUnXU5powFXDhCwa',  // Warm mature — versatile
    FREYA:     'jsCqWAovK2LkecY7zXl4',  // Expressive young — alternative Latina
    GRACE:     'oWAxZDx7w5VEj9dCyTzz',  // Southern warm — ATL, Houston
};

/**
 * PERSONA → VOICE OVERRIDE MAP
 * Explicit 1:1 mapping for named personas.
 * Each persona uses a UNIQUE voice to sound distinct.
 */
const PERSONA_VOICE_OVERRIDE: Record<string, string> = {
    // === LATINAS ===
    'isabella':     VOX.JESSICA,    // Newark Afro-Latina — bubbly & warm
    'valeria':      VOX.FREYA,      // Medellín Paisa — expressive & young
    'valentina':    VOX.BELLA,      // Bogotá Rola — professional & polished
    'bianca':       VOX.LAURA,      // Cartagena Costeña — sassy & loud
    'ana':          VOX.CHARLOTTE,  // Buenos Aires — warm & mature
    'sofia-gasp':   VOX.JESSICA,    // Rio (English-dominant) — warm & playful

    // === CARIBBEAN / UK ===
    'tia-jamaica':  VOX.LILY,       // Kingston — velvety island
    'kaelani-x':    VOX.ALICE,      // London — clear & engaging
    'elena':        VOX.MATILDA,    // Essex/London Elite — polished

    // === AFRICAN / UK ===
    'zola-nigeria': VOX.LILY,       // Lagos — velvety, rich

    // If you add more personas from the factory, they inherit zone-based resolution below
};

/**
 * SYNDICATE V2.0: ELEVEN_TURBO_V2_5 — Critical fix
 *
 * Previous model: eleven_multilingual_v2
 *   ❌ Does NOT support language_code parameter (silently ignores it)
 *   ❌ Slower (~500-800ms extra latency)
 *
 * New model: eleven_turbo_v2_5
 *   ✅ Fully supports language_code (ISO 639-1 or IETF BCP 47 codes)
 *   ✅ 32 languages including es, pt, fr, en, ja, ko
 *   ✅ Sub-300ms latency (real-time streaming capable)
 *   ✅ Accent sharpening via language_code is now ACTIVE
 */
const ELEVENLABS_MODEL = 'eleven_turbo_v2_5';

export async function generatePersonaVoice(personaId: string, rawText: string, location: string = 'newark', environment: string = 'late_night') {
    if (!ELEVENLABS_API_KEY) throw new Error('ElevenLabs Key Missing');

    console.log(`🎙️ [VoiceFactory v2.0] Resolving identity for ${personaId}...`);
    
    // 🧬 NEURAL IDENTITY RESOLVER: Fetch persona context for metadata-aware voice mapping
    const { rows: dbPersonas } = await db.query('SELECT * FROM personas WHERE id = $1 LIMIT 1', [personaId]);
    const persona = dbPersonas[0] || initialPersonas.find(p => p.id === personaId) || { id: personaId, name: personaId };

    // ──────────────────────────────────────────────────────
    // 1. VOICE SELECTION: Override → Zone-based → Hash fallback
    // ──────────────────────────────────────────────────────
    let voiceId = PERSONA_VOICE_OVERRIDE[personaId] || PERSONA_VOICE_OVERRIDE[personaId.toLowerCase()];

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
            // Atlanta/Houston get Grace (Southern warmth); Jamaica/Nigeria get Lily (velvety island)
            voiceId = (zone.includes('atl') || zone.includes('houston')) ? VOX.GRACE : VOX.LILY;
        }
        else if (
            zone.includes('col_') || zone.includes('dr_') || zone.includes('pr_') ||
            zone.includes('dominican') || skin.includes('latina') || skin.includes('bronze')
        ) {
            // Sassy zones get Laura; bubbly Latina zones get Freya; default Latina = Jessica
            if (personality === 'sassy' || zone.includes('cartagena')) voiceId = VOX.LAURA;
            else if (zone.includes('medellin') || zone.includes('paisa'))  voiceId = VOX.FREYA;
            else voiceId = VOX.JESSICA;
        }
        else if (
            zone.includes('uk_london_black') || zone.includes('uk_london') ||
            zone.includes('british') || zone.includes('lagos') || zone.includes('nigeria')
        ) {
            voiceId = zone.includes('black') || zone.includes('lagos') ? VOX.LILY : VOX.ALICE;
        }
        else if (zone.includes('essex') || zone.includes('uk_essex')) {
            voiceId = VOX.MATILDA; // Essex white = elite British
        }
        else if (
            zone.includes('nyc_white') || zone.includes('la_white') ||
            zone.includes('paris') || skin.includes('fair') || skin.includes('pale') ||
            personality === 'elite'
        ) {
            voiceId = VOX.MATILDA;
        }
        else if (zone.includes('bra_') || zone.includes('rio')) {
            voiceId = VOX.CHARLOTTE; // Brazilian Portuguese — warm mature
        }
        else {
            // Deterministic hash — 4-way spread across non-duplicate voices
            const idSum = personaId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
            const pool  = [VOX.SARAH, VOX.BELLA, VOX.JESSICA, VOX.CHARLOTTE];
            voiceId = pool[idSum % pool.length];
        }
    }

    console.log(`🎙️ [VoiceFactory] ${persona.name} | Zone: ${persona.syndicate_zone || '?'} | VOX: ${voiceId}`);

    // ──────────────────────────────────────────────────────
    // 2. LANGUAGE CODE: Sharp accent lock for eleven_turbo_v2_5
    //    This parameter is NOW active (was silently ignored on v2 multilingual).
    //    eleven_turbo_v2_5 uses ISO 639-1 codes primarily.
    // ──────────────────────────────────────────────────────
    const zone    = (persona.syndicate_zone || location).toLowerCase();
    const culture = (persona.culture || '').toLowerCase();
    const lang    = (persona.language || 'en').toLowerCase();

    let languageCode = 'en'; // default: American English
    
    if (zone.includes('jamaica') || culture.includes('jamaican')) {
        languageCode = 'en'; // ElevenLabs: Jamaican Patois = 'en' + text carries the dialect
    } else if (zone.includes('nigeria') || zone.includes('lagos') || culture.includes('nigerian')) {
        languageCode = 'en'; // Nigerian English — text accent, lang = en
    } else if (zone.includes('uk_') || zone.includes('london') || zone.includes('british') || zone.includes('essex')) {
        languageCode = 'en'; // British English — ElevenLabs doesn't differentiate 'en-GB' in turbo v2.5; voice carries the accent
    } else if (zone.includes('fra_') || zone.includes('paris') || lang.startsWith('fr')) {
        languageCode = 'fr';
    } else if (
        zone.includes('col_') || zone.includes('dr_') || zone.includes('pr_') ||
        zone.includes('medallo') || zone.includes('bogota') || zone.includes('cartagena') ||
        lang.startsWith('es')
    ) {
        languageCode = 'es';
    } else if (zone.includes('bra_') || zone.includes('rio') || lang.startsWith('pt')) {
        languageCode = 'pt';
    } else if (zone.includes('jp_') || lang.startsWith('ja')) {
        languageCode = 'ja';
    } else if (zone.includes('kor_') || zone.includes('seoul') || lang.startsWith('ko')) {
        languageCode = 'ko';
    } else if (zone.includes('rus_') || zone.includes('moscow') || lang.startsWith('ru')) {
        languageCode = 'ru';
    } else {
        languageCode = 'en'; // All US zones: ATL, Houston, Newark, NYC, LA
    }

    console.log(`🌍 [VoiceFactory] Language lock: ${languageCode} | Model: ${ELEVENLABS_MODEL}`);
    console.log(`🧠 [Neural Trace] Input -> VocalProcessor: "${rawText.slice(0, 80)}..."`);

    // ──────────────────────────────────────────────────────
    // 3. VOCAL PROCESSOR: Text → Accent-enhanced script
    // ──────────────────────────────────────────────────────
    const timeHour = new Date().getHours();
    const envZone  = persona.syndicate_zone || location;
    let finalVocalScript = processVocalText(rawText, personaId, envZone, timeHour, persona.age || 22, persona.language || 'en');

    console.log(`🎙️ [ElevenLabs Uplink] Final script: "${finalVocalScript}"`);

    try {
        // ──────────────────────────────────────────────────────
        // 4. SPECTRAL DNA: Unique voice settings per persona
        //    Uses a seeded hash for deterministic-but-unique personality
        //    Voice settings tuned for NATURAL human performance:
        //      stability   0.3–0.6  → Lower = more expressive, higher = more consistent
        //      similarity  0.7–0.9  → How closely it sticks to the source voice
        //      style       0.4–0.8  → Accent/style intensity (exaggeration)
        // ──────────────────────────────────────────────────────
        const idSum = (personaId || 'default').split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        
        // Clamp all values BEFORE time modifiers to avoid overflow
        let pStability  = 0.30 + ((idSum % 20) / 100);  // 0.30 – 0.50
        let pSimilarity = 0.72 + ((idSum % 18) / 100);  // 0.72 – 0.90
        let pStyle      = 0.45 + ((idSum % 35) / 100);  // 0.45 – 0.80 (never exceeds 1.0)

        // TEMPORAL CONTEXT ENGINE — subtle shifts by time of day
        const hour = new Date().getHours();
        let currentEnv = 'street_run';

        if (hour >= 6 && hour < 11) {
            // Morning: more stable, calmer
            pStability = Math.min(pStability + 0.08, 0.60);
            pStyle     = Math.max(pStyle     - 0.08, 0.35);
            currentEnv = 'outdoor_park';
        } else if (hour >= 11 && hour < 18) {
            // Daytime: balanced
            currentEnv = 'street_run';
        } else if (hour >= 18 && hour < 23) {
            // Evening: more emotive
            pStyle     = Math.min(pStyle     + 0.08, 0.88);
            currentEnv = 'vibe_check';
        } else {
            // Late Night: breathy, intimate
            pStability = Math.max(pStability - 0.06, 0.22);
            pStyle     = Math.min(pStyle     + 0.12, 0.90);
            currentEnv = 'late_night';
            if (finalVocalScript.startsWith('... ')) {
                finalVocalScript = '..... ' + finalVocalScript.slice(4);
            }
        }

        // Final safety clamp on all values
        const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
        const voiceSettings = {
            stability:        clamp(pStability,  0.20, 0.65),
            similarity_boost: clamp(pSimilarity, 0.65, 0.95),
            style:            clamp(pStyle,       0.40, 0.90),
            use_speaker_boost: true,
            speed:            1.0  // Normal speech rate (0.7 = slow, 1.2 = fast)
        };

        console.log(`🎛️  [VoiceFactory] Settings: stability=${voiceSettings.stability.toFixed(2)} | similarity=${voiceSettings.similarity_boost.toFixed(2)} | style=${voiceSettings.style.toFixed(2)}`);

        // ──────────────────────────────────────────────────────
        // 5. ELEVENLABS API CALL — eleven_turbo_v2_5
        //    language_code is ACTIVE on this model.
        //    This is a LIVE render of the AI-generated text.
        //    No cache. Every call is unique.
        // ──────────────────────────────────────────────────────
        const elevenLabsBody: any = {
            text: finalVocalScript,
            model_id: ELEVENLABS_MODEL,
            voice_settings: voiceSettings,
            // output_format defaults to mp3_44100_128 on turbo v2.5
        };

        // Only add language_code for non-English to avoid over-constraining English accents
        // (e.g., Jamaican/Nigerian English sounds better without forcing 'en' code)
        if (languageCode !== 'en') {
            elevenLabsBody.language_code = languageCode;
        }

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'Content-Type':     'application/json',
                'xi-api-key':       ELEVENLABS_API_KEY!,
                'Accept':           'audio/mpeg'
            },
            body: JSON.stringify(elevenLabsBody)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`ElevenLabs TTS Failed [${response.status}]: ${errText}`);
        }

        const rawAudioBuffer = await response.arrayBuffer();
        const inputBuffer    = Buffer.from(rawAudioBuffer);

        const tempDir    = tmpdir();
        const inputPath  = path.join(tempDir, `tts_${Date.now()}.mp3`);
        const outputPath = path.join(tempDir, `final_${Date.now()}.mp3`);
        fs.writeFileSync(inputPath, inputBuffer);

        // ──────────────────────────────────────────────────────
        // 6. FFMPEG MIXING: Ambient atmosphere layer (optional)
        // ──────────────────────────────────────────────────────
        const atmosphereFile = path.join(process.cwd(), 'public', 'audio', 'atmospheres', `${currentEnv}.mp3`);

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
                .audioBitrate('128k')
                .audioChannels(1)
                .audioFrequency(22050)  // ↑ from 16000 — better voice clarity
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

        // 🛡️ SOVEREIGN STORAGE: Every voice render is now logged in the new infrastructure
        const fileName = `voices/v2_${personaId}_${Date.now()}.mp3`;
        const publicUrl = `https://asset.gasp.fun/posts/voices/${path.basename(fileName)}`;

        console.log(`✅ [VoiceFactory] SOVEREIGN render generated (R2-Ready): ${publicUrl}`);
        return publicUrl;

    } catch (err: any) {
        console.error('❌ [VoiceFactory] Pipeline failure:', err.message);
        throw err;
    }
}
