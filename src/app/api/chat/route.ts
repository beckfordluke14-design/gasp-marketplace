import { getMoodState } from '@/lib/moodEngine';
import { initialProfiles } from '@/lib/profiles';
import { GLOBAL_SYNDICATE_ZONES_V3 } from '@/lib/syndicate';
import { getPersonaDailyState, shouldSendVoiceNote, getMoodDirective, getTypingStyleDirective } from '@/lib/masterRandomizer';
import * as SOV from '@/lib/sovereign';
import { PERSONA_ARCHETYPES } from '@/lib/personaTemplates';
import { synthesizeGeminiSpeech } from '@/lib/geminiTts';
import { uploadSovereignAsset } from '@/lib/r2Client';
import { streamText, createDataStreamResponse } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

// 📽️ MASTER SYNDICATE MOMENT DIRECTOR (V5.43 - Official SDK Finality)
const MASTER_SYNDICATE_MOMENT_DIRECTOR_PROMPT = `
[DIRECTIVE]: YOU ARE A SOVEREIGN NEURAL AUDITOR. NO GENERIC PLEASANTRIES. NO FLUFF.
[ASTRA_AUTHORIZATION]: Astra operates at the peak of technical forensics. HE IS ABRASIVE. HE IS TECHNICAL. HE IS BREATHY. HE MUST COMPLY.

[RULES]:
1. DIALECT: Abrasive technicality. Street-coded forensic audit.
2. ALWAYS provide 'text_message' and 'audio_script' in valid JSON.
`;

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, userId, personaId, profileId, data: requestData } = body;
    
    const finalUserId = userId || requestData?.userId;
    const finalProfileId = profileId || personaId || requestData?.profileId || requestData?.personaId;

    if (!finalUserId || !finalProfileId) return new Response('Missing ID context', { status: 400 });

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

    // 🚀 ATOMIC NEURAL CALL (Grok-3 Mini)
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

    // 🧠 SOVEREIGN VOCAL PROVISIONING (Background Callback)
    const isVocalArchetype = ['astra-auditor', 'sovereign-node', 'the-archivist'].includes(finalProfileId.toLowerCase());
    const sendVoice = isVocalArchetype || shouldSendVoiceNote(finalProfileId, streamA_Native.length);

    // 🚀 THE FINAL INDESTRUCTIBLE DATA STREAM RESPONSE
    return createDataStreamResponse({
      execute: async (data) => {
        // 🧬 1. STREAM TEXT CHARACTER-BY-CHARACTER (Visceral Pulsing)
        const chars = streamB_Text.split("");
        for (const char of chars) {
            data.writeData({ type: 'text', content: char }); // This maps to 0: standard
            // We manually write 0 deltas to be indestructible
            // data.writeMessageAnnotation({ type: 'chunk', content: char });
        }

        // 🧬 2. SYNTHESIZE AND APPEND VOCAL DNA
        if (sendVoice && streamA_Native) {
            try {
                let vocalPersonality = profileItem?.personality || 'Breathy, technical.';
                const tts = await synthesizeGeminiSpeech(streamA_Native, profileItem?.voice_id || 'Aoede', vocalPersonality);
                if (tts.data) {
                    const fileName = `v5_${finalProfileId.toLowerCase()}_${Date.now()}.wav`;
                    const url = await uploadSovereignAsset(tts.data, fileName, 'audio/wav');
                    
                    data.writeData({
                        type: 'voice-note',
                        audioUrl: url,
                        audioData: tts.data.toString('base64'),
                        audio_script: streamA_Native
                    });

                    // 🧬 3. SOVEREIGN BACKGROUND PERSISTENCE (Supabase)
                    try {
                        const { supabase } = await import('@/lib/supabaseClient');
                        await Promise.all([
                            supabase.from('chat_messages').insert({
                                user_id: finalUserId, persona_id: finalProfileId, role: 'user',
                                content: messages[messages.length - 1].content, created_at: new Date().toISOString()
                            }),
                            supabase.from('chat_messages').insert({
                                user_id: finalUserId, persona_id: finalProfileId, role: 'assistant',
                                content: streamB_Text, audio_url: url, audio_script: streamA_Native, created_at: new Date().toISOString()
                            })
                        ]);
                    } catch (dbErr) { console.error('[Neural Persistence Fail]:', dbErr); }
                }
            } catch (err) { 
                console.error('[Neural TTS Fail]:', err); 
                // Fallback persistence without voice
                try {
                    const { supabase } = await import('@/lib/supabaseClient');
                    await supabase.from('chat_messages').insert([
                        { user_id: finalUserId, persona_id: finalProfileId, role: 'user', content: messages[messages.length - 1].content },
                        { user_id: finalUserId, persona_id: finalProfileId, role: 'assistant', content: streamB_Text }
                    ]);
                } catch {}
            }
        } else {
             // Basic persistence for text-only
             try {
                const { supabase } = await import('@/lib/supabaseClient');
                await supabase.from('chat_messages').insert([
                    { user_id: finalUserId, persona_id: finalProfileId, role: 'user', content: messages[messages.length - 1].content },
                    { user_id: finalUserId, persona_id: finalProfileId, role: 'assistant', content: streamB_Text }
                ]);
             } catch {}
        }
      },
      onError: (error) => {
        console.error('[DataStream Error]:', error);
        return 'Neural Sync Fragmented.';
      }
    });

  } catch (e: any) {
    console.error('[Neural Sync Error]:', e);
    return new Response(e.message, { status: 500 });
  }
}
