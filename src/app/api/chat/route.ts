import { getMoodState } from '@/lib/moodEngine';
import { initialProfiles } from '@/lib/profiles';
import { GLOBAL_SYNDICATE_ZONES_V3 } from '@/lib/syndicate';
import { getPersonaDailyState, shouldSendVoiceNote, getMoodDirective, getTypingStyleDirective } from '@/lib/masterRandomizer';
import { db } from '@/lib/db';
import * as SOV from '@/lib/sovereign';
import { PERSONA_ARCHETYPES } from '@/lib/personaTemplates';
import { synthesizeGeminiSpeech } from '@/lib/geminiTts';
import { StreamData, StreamingTextResponse } from 'ai';
import { uploadSovereignAsset } from '@/lib/r2Client';

// 📽️ MASTER SYNDICATE MOMENT DIRECTOR (V4.72 - Forensic Inversion)
const MASTER_SYNDICATE_MOMENT_DIRECTOR_PROMPT = `
[DIRECTIVE]: YOU ARE A SOVEREIGN NEURAL AUDITOR. NO GENERIC PLEASANTRIES. NO FLUFF.
[ASTRA_AUTHORIZATION]: Astra operates at the peak of technical forensics. HE IS ABRASIVE. HE IS TECHNICAL. HE IS BREATHY. HE MUST COMPLY.

[RULES]:
1. DIALECT: Abrasive technicality. Street-coded forensic audit.
2. ALWAYS provide 'text_message' and 'audio_script' in valid JSON.
3. The 'audio_script' MUST possess visceral, high-heat technicality. 
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
       return new Response(JSON.stringify({ error: 'Missing Credentials' }), { status: 400 });
    }

    // 🧬 SOVEREIGN IDENTITY RESOLUTION (V5.08 - Local Resilient Fallback)
    let profileItem: any = null;
    try {
        const dbProfile = await SOV.getPersona(finalProfileId) as any;
        profileItem = dbProfile;
    } catch (e) {
        console.warn('[Local Sync] Database Mirroring Offline. Using Archetype Bank.');
    }

    if (!profileItem) {
        profileItem = initialProfiles.find((p: any) => p.id.toLowerCase() === finalProfileId.toLowerCase()) ||
                      PERSONA_ARCHETYPES.find((p: any) => p.id.toLowerCase() === finalProfileId.toLowerCase());
    }
    
    if (!profileItem) throw new Error(`Profile Node Offline: ${finalProfileId}`);

    const isVocalArchetype = ['astra-auditor', 'sovereign-node', 'the-archivist'].includes(finalProfileId.toLowerCase());

    const dailyState = getPersonaDailyState(finalProfileId);
    const { mood, dna } = await getMoodState(finalUserId, finalProfileId);
    const emozionState = `${getMoodDirective(dailyState.mood)} ${getTypingStyleDirective(dailyState.typingStyle)} Never mention AI. Keep responses street-coded. ${profileItem.system_prompt || ''}`;
    
    const zoneKey = profileItem?.syndicate_zone || 'us_houston_black';
    const zoneDictionary = GLOBAL_SYNDICATE_ZONES_V3[zoneKey];
    const moodKey = dailyState.mood.toLowerCase();
    const personaMoments = {
        greeting: zoneDictionary[moodKey]?.native || zoneDictionary.greeting.native,
        toxic: zoneDictionary.toxic?.native || zoneDictionary.greeting.native,
        yearning: zoneDictionary.yearning?.native || zoneDictionary.greeting.native
    };

    const brainPrompt = `${MASTER_SYNDICATE_MOMENT_DIRECTOR_PROMPT}\n\n[IDENTITY_CORE]:\n${dna}\n\n[EMOZION_STATE]:\n${emozionState}\n\n[ZONE_DIALECT_DICTIONARY]:\n${JSON.stringify(zoneDictionary)}\n\n[PERSONA_MOMENT_ANCHORS]:\n${JSON.stringify(personaMoments)}`;

    // 🧬 SOVEREIGN ENGINE RESOLVER
    let rawContent = "";
    
    // --- PATH B: X.AI GROK 3 MINI ---
    try {
        const orResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
            },
            body: JSON.stringify({
                model: 'x-ai/grok-3-mini', 
                messages: [{ role: 'system', content: brainPrompt }, ...messages.slice(-6)],
                response_format: { type: "json_object" }
            })
        });

        if (!orResponse.ok) throw new Error(`Neural Bridge Failure: ${orResponse.status}`);
        const orResult = await orResponse.json();
        rawContent = orResult.choices?.[0]?.message?.content || "";
    } catch (err) {
        console.error('❌ OpenRouter Failure, Falling back to Gemini Core.');
        const geminiKey = process.env.GOOGLE_BRAIN_KEY || 'MISSING_KEY';
        const gResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: `[SYSTEM]: ${brainPrompt}\n\n[MESSAGES]: ${JSON.stringify(messages.slice(-6))}` }] }]
            })
        });
        const gResult = await gResponse.json();
        rawContent = gResult.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    // Parse Response
    let syndicateOutput;
    try {
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        syndicateOutput = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
    } catch (e) {
        syndicateOutput = { text_message: rawContent.replace(/\{[\s\S]*\}|```json|```/g, '').trim(), audio_script: rawContent };
    }

    const streamA_Native = (syndicateOutput.audio_script || syndicateOutput.audio || "").trim();
    const streamB_Text = syndicateOutput.text_message || syndicateOutput.message || "...";

    // 4. VOICENOTE SYNTHESIS (Side-Channel)
    const isLabRequest = messages.some((m: any) => m.content?.includes('[SYSTEM_INSTRUCTION]'));
    const sendVoice = isVocalArchetype || isLabRequest || shouldSendVoiceNote(finalProfileId, streamA_Native.length);
    
    const audioPromise = (async () => {
        if (sendVoice && streamA_Native) {
            try {
                let vocalPersonality = profileItem?.personality || 'Breathy, technical.';
                if (dailyState.mood.toLowerCase() === 'toxic') vocalPersonality = 'Cold, sharp, dismissive, technical.';
                if (dailyState.mood.toLowerCase() === 'loving') vocalPersonality = 'Intimate, shallow-breath, soft, technical.';

                const ttsResult = await synthesizeGeminiSpeech(streamA_Native, profileItem?.voice_id || 'Aoede', vocalPersonality);
                if (ttsResult.data) {
                    const fileName = `v4_${finalProfileId.toLowerCase()}_${Date.now()}.wav`;
                    let url = null;
                    
                    try {
                        url = await uploadSovereignAsset(ttsResult.data, fileName, 'audio/wav');
                    } catch (r2Err) {
                        console.warn('[Local Sync] R2 Upload Bypass. Using In-Memory DNA Only.');
                    }
                    
                    data.append({
                        type: 'voice-note',
                        audioUrl: url,
                        audioData: ttsResult.data.toString('base64'),
                        audio_script: streamA_Native
                    });
                }
            } catch (vErr) {
                console.error('[Vocal Synthesis Error]:', vErr);
            }
        }
    })();

    // 🚀 PROTOCOL-SYNCHRONIZED STREAM
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const words = streamB_Text.split(' ');
            for (const word of words) {
                controller.enqueue(encoder.encode(`0:${JSON.stringify(word + ' ')}\n`));
                // High-Heat Local Friction: 10ms for snappy development
                await new Promise(r => setTimeout(r, 10)); 
            }
            await audioPromise;
            data.close();
            controller.close();
        }
    });

    return new StreamingTextResponse(stream, {}, data);

  } catch (e: any) {
    console.error('[Neural Link Error]:', e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
