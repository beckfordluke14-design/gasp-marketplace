import { GoogleGenerativeAI } from "@google/generative-ai";

const GOOGLE_BRAIN_KEY = process.env.GOOGLE_BRAIN_KEY;
if (!GOOGLE_BRAIN_KEY) {
    console.error('❌ [Gemini TTS] CRITICAL: GOOGLE_BRAIN_KEY environment variable is missing.');
}
const genAI = new GoogleGenerativeAI(GOOGLE_BRAIN_KEY || 'MISSING_KEY');

/**
 * 🎙️ SYNDICATE V4.3 — GEMINI 2.5 PRO PRO PREVIEW TTS
 * 
 * Optimized for High-Heat Generative Audio with Multi-Speaker Steerability.
 */
export async function synthesizeGeminiSpeech(text: string, voiceName: string, styleInstructions: string) {
    console.log(`🧠 [Gemini 2.5 TTS] Performing High-Heat Synthesis (Temp: 1.7) | Voice: ${voiceName}...`);
    
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-preview-tts" }, { apiVersion: 'v1beta' });

        // 🌶️ MULTI-SPEAKER WRAPPER: Wrapping the text to ensure the model uses the specified speaker identity.
        // This often results in more "steerable" and expressive output in the 2.5 Pro Pro model.
        const multiSpeakerText = `Speaker 1: ${text}`;
        const refinedPrompt = `[ACTOR_STYLE: ${styleInstructions}]\n\n${multiSpeakerText}`;

        const result = await model.generateContent({
            contents: [{ 
                role: "user", 
                parts: [{ text: refinedPrompt }] 
            }],
            generationConfig: {
                temperature: 1.8, // Calibrated High-Heat Synthesis
                // @ts-ignore
                responseModalities: ["AUDIO"],
                speechConfig: {
                    // @ts-ignore - Multi-speaker config provides superior personality steering
                    multiSpeakerVoiceConfig: {
                        speakerVoiceConfigs: [
                            {
                                speaker: "Speaker 1",
                                voiceConfig: {
                                    prebuiltVoiceConfig: {
                                        voiceName: voiceName
                                    }
                                }
                            },
                            {
                                speaker: "Speaker 2", // 🛡️ 100% Women-Voice Compliance
                                voiceConfig: {
                                    prebuiltVoiceConfig: {
                                        voiceName: "Aoede"
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        });

        const candidates = result.response.candidates || [];
        if (candidates.length === 0) {
            throw new Error("Gemini 2.5 TTS: Empty response");
        }

        const parts = candidates[0].content?.parts || [];
        const audioPart = parts.find(p => p.inlineData);
        
        if (!audioPart || !audioPart.inlineData) {
            throw new Error("Gemini 2.5 TTS: No audio content in response");
        }

        const rawData = Buffer.from(audioPart.inlineData.data, "base64");
        const mimeType = audioPart.inlineData.mimeType;
        
        // 🚨 WAV Header Injection for L16 RAW PCM
        const audioBuffer = addWavHeader(rawData, mimeType);

        return {
            data: audioBuffer,
            mimeType: "audio/wav"
        };
    } catch (err: any) {
        console.error('❌ [Gemini 2.5 TTS] Failure:', err.message);
        throw err;
    }
}

/**
 * 🛠️ WAV Header Generator (RIFF/WAVE 44-byte Header)
 * Ensures raw L16 PCM data is playable in all browsers.
 */
function addWavHeader(audioData: Buffer, mimeType: string): Buffer {
    let sampleRate = 24000;
    if (mimeType.includes('rate=')) {
        const rateMatch = mimeType.match(/rate=(\d+)/);
        if (rateMatch) sampleRate = parseInt(rateMatch[1]);
    }
    
    let bitsPerSample = 16;
    if (mimeType.includes('L')) {
        const bitMatch = mimeType.match(/L(\d+)/);
        if (bitMatch) bitsPerSample = parseInt(bitMatch[1]);
    }

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
