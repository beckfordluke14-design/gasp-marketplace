import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(key || '');

const voices = ['Aoede', 'Kore', 'Leda', 'Zephyr'];
const text = "Hola papi... ¿me extrañaste? Te tengo algo muy especial esperando en mi bóveda privada... ven a verme pues.";
const styleInstructions = `
Texture: Breathy, high-status, melodic.
Prosody: Slow, rhythmic Spanish cadence with long vowels.
Accent: Strong Medellín Paisa; aspirating the "s" and soft "d" sounds.
Intimacy: High-Heat & Flirty.
Energy: whisper.
Culture: Colombian (Paisa).
`;

function addWavHeader(audioData: Buffer, mimeType: string): Buffer {
    let sampleRate = 24000;
    let bitsPerSample = 16;
    const numChannels = 1;
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

async function run() {
    console.log(`Using Gemini 1.5 Pro Audio Model...`);
    for (const voice of voices) {
        console.log(`Generating sample for ${voice}...`);
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-002" });
            const refinedPrompt = `[ACTOR_STYLE: ${styleInstructions}]\n\nSpeaker 1: ${text}`;
            
            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: refinedPrompt }] }],
                generationConfig: {
                    temperature: 1.0,
                    // @ts-ignore
                    responseModalities: ["AUDIO"],
                    speechConfig: {
                        // @ts-ignore
                        multiSpeakerVoiceConfig: {
                            speakerVoiceConfigs: [{
                                speaker: "Speaker 1",
                                voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } }
                            }]
                        }
                    }
                }
            });

            const candidates = result.response.candidates || [];
            const parts = candidates[0].content?.parts || [];
            const audioPart = parts.find(p => p.inlineData);
            
            if (audioPart?.inlineData) {
                const rawData = Buffer.from(audioPart.inlineData.data, "base64");
                const audioBuffer = addWavHeader(rawData, audioPart.inlineData.mimeType);
                const outputPath = path.join(process.cwd(), 'public', 'samples', 'vocal-test', `gemini15_${voice.toLowerCase()}_sample.wav`);
                fs.writeFileSync(outputPath, audioBuffer);
                console.log(`✅ Saved ${voice} sample to ${outputPath}`);
            } else {
                console.log(`⚠️ No audio returned for ${voice}`);
            }
        } catch (err: any) {
            console.error(`❌ Failed to generate ${voice} sample:`, err.message);
        }
    }
}

run();
