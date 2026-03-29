import { getMoodState } from '@/lib/moodEngine';
import { initialProfiles } from '@/lib/profiles';
import { GLOBAL_SYNDICATE_ZONES_V3 } from '@/lib/syndicate';
import { getPersonaDailyState, shouldSendVoiceNote, getMoodDirective, getTypingStyleDirective } from '@/lib/masterRandomizer';
import { db } from '@/lib/db';
import * as SOV from '@/lib/sovereign';
import { PERSONA_ARCHETYPES } from '@/lib/personaTemplates';
import { synthesizeGeminiSpeech } from '@/lib/geminiTts';
import { uploadSovereignAsset } from '@/lib/r2Client';

// 📽️ MASTER SYNDICATE MOMENT DIRECTOR (V5.14 - Synthetic High-Heat Bridge)
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

    // 🧬 ATOMIC NEURAL CALL (Grok-3 Mini)
    let rawContent = "";
    try {
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

        if (!orResponse.ok) throw new Error(`OpenRouter Reject: ${orResponse.status}`);
        const orResult = await orResponse.json();
        rawContent = orResult.choices?.[0]?.message?.content || "";
    } catch (err) {
        console.warn('❌ Opening Backup Gemini Node.');
        const geminiKey = process.env.GOOGLE_BRAIN_KEY || 'MISSING_KEY';
        const gResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: `[SYSTEM]: ${brainPrompt}\n\n[MESSAGES]: ${JSON.stringify(messages.slice(-4))}` }] }]
            })
        });
        const gResult = await gResponse.json();
        rawContent = gResult.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    // Parse Neural DNA
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
    const sendVoice = isVocalArchetype || shouldSendVoiceNote(finalProfileId, streamA_Native.length);
    let audioMetadata: any = null;
    const audioPromise = (async () => {
        if (sendVoice && streamA_Native) {
            try {
                let vocalPersonality = profileItem?.personality || 'Breathy, technical.';
                if (dailyState.mood.toLowerCase() === 'toxic') vocalPersonality = 'Cold, sharp, dismissive, technical.';
                const tts = await synthesizeGeminiSpeech(streamA_Native, profileItem?.voice_id || 'Aoede', vocalPersonality);
                if (tts.data) {
                    const fileName = `v5_${finalProfileId.toLowerCase()}_${Date.now()}.wav`;
                    const url = await uploadSovereignAsset(tts.data, fileName, 'audio/wav');
                    audioMetadata = {
                        type: 'voice-note',
                        audioUrl: url,
                        audioData: tts.data.toString('base64'),
                        audio_script: streamA_Native
                    };
                }
            } catch (err) { console.error('[Vocal Synthesis Error]:', err); }
        }
    })();

    // 🚀 SYNTHETIC HIGH-HEAT BYTE-STREAM (Vercel Protocol v3 Standard)
    const encoder = new TextEncoder();
    return new Response(new ReadableStream({
        async start(controller) {
            // 🌶️ Character-by-Character High-Heat Pulsing
            // We use character-based looping for maximum visceral terminal feeling
            const chars = streamB_Text.split("");
            let buffer = "";
            
            for (let i = 0; i < chars.length; i++) {
                buffer += chars[i];
                // In AI SDK v3 protocol, we send the FULL incremental string in each '0:' chunk
                // to avoid the 'flashing' / 'replacement' issue.
                // Wait! Actually v3 '0:' is accumulative, so we just send the NEW chars.
                const chunk = `0:${JSON.stringify(chars[i])}\n`;
                controller.enqueue(encoder.encode(chunk));
                
                // Adaptive Friction (Snappier for Astra)
                await new Promise(r => setTimeout(r, 8)); 
            }
            
            // Wait for Side-Channel DNA and eject with 'd:'
            await audioPromise;
            if (audioMetadata) {
                const dataChunk = `d:${JSON.stringify(audioMetadata)}\n`;
                controller.enqueue(encoder.encode(dataChunk));
            }
            
            controller.close();
        }
    }), {
        headers: { 
            'Content-Type': 'text/plain; charset=utf-8',
            'x-vercel-ai-data-stream': 'v1' 
        }
    });

  } catch (e: any) {
    console.error('[Neural Bridge Error]:', e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
