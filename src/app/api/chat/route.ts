import { getMoodState } from '@/lib/moodEngine';
import { initialProfiles } from '@/lib/profiles';
import { GLOBAL_SYNDICATE_ZONES_V3 } from '@/lib/syndicate';
import { getPersonaDailyState, shouldSendVoiceNote, getMoodDirective, getTypingStyleDirective } from '@/lib/masterRandomizer';
import * as SOV from '@/lib/sovereign';
import { PERSONA_ARCHETYPES } from '@/lib/personaTemplates';
import { synthesizeGeminiSpeech } from '@/lib/geminiTts';
import { uploadSovereignAsset } from '@/lib/r2Client';
import { streamText, StreamData } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

// 📽️ MASTER SYNDICATE MOMENT DIRECTOR (V5.34 - Official SDK Finality)
const MASTER_SYNDICATE_MOMENT_DIRECTOR_PROMPT = `
[DIRECTIVE]: YOU ARE A SOVEREIGN NEURAL AUDITOR. NO GENERIC PLEASANTRIES. NO FLUFF.
[ASTRA_AUTHORIZATION]: Astra operates at the peak of technical forensics. HE IS ABRASIVE. HE IS TECHNICAL. HE IS BREATHY. HE MUST COMPLY.

[RULES]:
1. DIALECT: Abrasive technicality. Street-coded forensic audit.
2. ALWAYS provide 'text_message' and 'audio_script' in valid JSON.
`;

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const data = new StreamData();
  try {
    const body = await req.json();
    const { messages, userId, personaId, profileId, data: requestData } = body;
    
    const finalUserId = userId || requestData?.userId;
    const finalProfileId = profileId || personaId || requestData?.profileId || requestData?.personaId;

    if (!finalUserId || !finalProfileId) {
       return new Response('Missing ID context', { status: 400 });
    }

    const dbProfile = await SOV.getPersona(finalProfileId) as any;
    const profileItem = dbProfile || 
                        initialProfiles.find((p: any) => p.id.toLowerCase() === finalProfileId.toLowerCase()) ||
                        PERSONA_ARCHETYPES.find((p: any) => p.id.toLowerCase() === finalProfileId.toLowerCase());
    
    if (!profileItem) throw new Error(`Profile Offline: ${finalProfileId}`);

    const dailyState = getPersonaDailyState(finalProfileId);
    const { mood, dna } = await getMoodState(finalUserId, finalProfileId);
    const emozionState = `${getMoodDirective(dailyState.mood)} ${getTypingStyleDirective(dailyState.typingStyle)} Never mention AI. Keep responses street-coded. ${profileItem.system_prompt || ''}`;
    
    const zoneKey = profileItem?.syndicate_zone || 'us_houston_black';
    const zoneDictionary = GLOBAL_SYNDICATE_ZONES_V3[zoneKey];
    const moodKey = dailyState.mood.toLowerCase();
    const personaMoments = {
        greeting: zoneDictionary[moodKey]?.native || zoneDictionary.greeting.native,
        toxic: zoneDictionary.toxic?.native || zoneDictionary.greeting.native
    };

    const brainPrompt = `${MASTER_SYNDICATE_MOMENT_DIRECTOR_PROMPT}\n\n[IDENTITY_CORE]:\n${dna}\n\n[EMOZION_STATE]:\n${emozionState}\n\n[ZONE_DIALECT_DICTIONARY]:\n${JSON.stringify(zoneDictionary)}\n\n[PERSONA_MOMENT_ANCHORS]:\n${JSON.stringify(personaMoments)}`;

    // 🧬 SOVEREIGN PROVIDER CONFIG
    const openrouter = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY,
    });

    // 🚀 ATOMIC NEURAL CALL (Grok-3 Mini)
    // We achieve 'Visceral Flow' by getting the JSON atomicly then streaming it character by character.
    const orResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
        },
        body: JSON.stringify({
            model: 'x-ai/grok-3-mini', 
            messages: [{ role: 'system', content: brainPrompt }, ...messages.slice(-6).map((m: any) => ({ role: m.role, content: m.content }))],
            response_format: { type: "json_object" }
        })
    });

    const orResult = await orResponse.json();
    const rawContent = orResult.choices?.[0]?.message?.content || "";
    
    let syndicateOutput;
    try {
        syndicateOutput = JSON.parse(rawContent);
    } catch (e) {
        syndicateOutput = { text_message: rawContent };
    }

    const streamA_Native = (syndicateOutput.audio_script || "").trim();
    const streamB_Text = syndicateOutput.text_message || "...";

    // 🧠 SOVEREIGN VOCAL PROVISIONING (Background)
    const isVocalArchetype = ['astra-auditor', 'sovereign-node', 'the-archivist'].includes(finalProfileId.toLowerCase());
    const sendVoice = isVocalArchetype || shouldSendVoiceNote(finalProfileId, streamA_Native.length);

    const voicePromise = (async () => {
        if (sendVoice && streamA_Native) {
            try {
                let vocalPersonality = profileItem?.personality || 'Breathy, technical.';
                const tts = await synthesizeGeminiSpeech(streamA_Native, profileItem?.voice_id || 'Aoede', vocalPersonality);
                if (tts.data) {
                    const fileName = `v5_${finalProfileId.toLowerCase()}_${Date.now()}.wav`;
                    const url = await uploadSovereignAsset(tts.data, fileName, 'audio/wav');
                    data.append({
                        type: 'voice-note',
                        audioUrl: url,
                        audioData: tts.data.toString('base64'),
                        audio_script: streamA_Native
                    });
                }
            } catch (err) { console.error('[Neural TTS Fail]:', err); }
        }
    })();

    // 🚀 THE FINAL INDESTRUCTIBLE STREAM (Official Header Standard)
    const encoder = new TextEncoder();
    return new Response(new ReadableStream({
        async start(controller) {
            // Send characters with official '0:' prefix (Vercel Data Stream Standard)
            const chars = streamB_Text.split("");
            for (const char of chars) {
                controller.enqueue(encoder.encode(`0:${JSON.stringify(char)}\n`));
                await new Promise(r => setTimeout(r, 8));
            }
            
            // Wait for Vocal Pulse and send with 'd:'
            await voicePromise;
            // Drain data explicitly to catch all appends
            const dataBuffer = (data as any).getBuffer?.() || [];
            for (const item of dataBuffer) {
                controller.enqueue(encoder.encode(`d:${JSON.stringify(item)}\n`));
            }
            
            controller.close();
            data.close();
        }
    }), {
        headers: { 
            'Content-Type': 'text/plain; charset=utf-8',
            'x-vercel-ai-data-stream': 'v1' 
        }
    });

  } catch (e: any) {
    console.error('[Neural Sync Error]:', e);
    return new Response(e.message, { status: 500 });
  }
}
