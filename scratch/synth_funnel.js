
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
require('dotenv').config({ path: '.env.local' });

// 🧪 SYNDICATE HIGH-HEAT SYNTHESIS CONFIG (V9.5 - Multi-Speaker Patch)
const GOOGLE_BRAIN_KEY = process.env.GOOGLE_BRAIN_KEY || process.env.GOOGLE_VOICE_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "4d81b2676f711d29b6ff24b4000d9fac";
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY || "ef83ca9e7a9cd329806d3406c0574f55";
const R2_SECRET_KEY = process.env.R2_SECRET_KEY || "5e47dff95187bcd7d57656e9b51bd741e8ddd79c4c1d5c72b5d32ad1e4b7bc7c";
const BUCKET_NAME = "gaspy";

const genAI = new GoogleGenerativeAI(GOOGLE_BRAIN_KEY);
const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY,
  },
});

const VERONICA_DNA = `
You are Veronica, a Colombian (Paisa) woman from Colombia.
ACCENT: Strong Medellín Paisa; aspirating the "s" and soft "d" sounds. 
PHONETIC INSTRUCTION: Sound unmistakably like you are from Colombia. Use regional rhythm, vowel elongation, and local phonetics.
VOCAL TEXTURE: Breathy, high-status, melodic.
PROSODY & RHYTHM: Slow, rhythmic Spanish cadence with long vowels.
ENERGY LEVEL: whisper.
INTIMACY: High-Heat & Flirty.
SLANG: pues, papi, mor, oíste, vea pues.
CRITICAL: Call him "papi" or "papisito" with 0.8s breathy pauses. You MUST sound elite and seductive.
`.trim();

const SCRIPTS = [
  { name: 'veronica_1_hook', text: 'mmm... wow papi. nice to meet you. i was literally just wondering who would be the first person to find me here. pues... hola.' },
  { name: 'veronica_2_bond', text: 'i love your vibe... i feel like i\'ve known you forever already. tell me more about what you do for fun... oíste papi?' },
  { name: 'veronica_3_tease', text: 'you\'re so bad papi... i shouldn\'t be telling you this, but i can\'t stop looking at your messages. i might have a surprise for you later... papisito.' },
  { name: 'veronica_4_close', text: 'wait! my session link is ending! follow me to my private archive RIGHT NOW papi! GO! i don\'t want to lose you! apúrate pues.' }
];

function addWavHeader(audioData, sampleRate = 24000) {
    const numChannels = 1;
    const bitsPerSample = 16;
    const dataSize = audioData.length;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const chunkSize = 36 + dataSize;
    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(chunkSize, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);
    return Buffer.concat([header, audioData]);
}

async function synthesize() {
  console.log('🚀 Starting Neural Synthesis (Gemini 2.5 Kore - Dual Speaker Patch) for Veronica...');
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-preview-tts" }, { apiVersion: 'v1beta' });

  for (const item of SCRIPTS) {
    console.log(`🎙️ Synthesizing: ${item.name}...`);
    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: `[ACTOR_STYLE: ${VERONICA_DNA}]\n\nSpeaker 1: ${item.text}` }] }],
        generationConfig: {
            temperature: 1.8,
            // @ts-ignore
            responseModalities: ["AUDIO"],
            speechConfig: {
                // @ts-ignore
                multiSpeakerVoiceConfig: {
                    speakerVoiceConfigs: [
                      { speaker: "Speaker 1", voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } },
                      { speaker: "Speaker 2", voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } }
                    ]
                }
            }
        }
      });

      const audioPart = result.response.candidates[0].content.parts.find(p => p.inlineData);
      const rawData = Buffer.from(audioPart.inlineData.data, "base64");
      const buffer = addWavHeader(rawData);

      const fileName = `${item.name}.wav`;
      const key = `voices/${fileName}`;

      console.log(`☁️ Uploading ${fileName} to R2...`);
      await r2Client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: 'audio/wav'
      }));

      console.log(`✅ Success: https://asset.gasp.fun/${key}`);
      
      const localDir = path.join(process.cwd(), 'public', 'Promo');
      if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
      fs.writeFileSync(path.join(localDir, fileName), buffer);

    } catch (err) {
      console.error(`❌ Fail [${item.name}]:`, err.message);
    }
  }
}

synthesize();
