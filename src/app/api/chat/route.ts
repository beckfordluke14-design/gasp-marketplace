import { getMoodState } from '@/lib/moodEngine';
import { initialProfiles } from '@/lib/profiles';
import { GLOBAL_SYNDICATE_ZONES_V3 } from '@/lib/syndicate';
import { getPersonaDailyState, shouldSendVoiceNote, getMoodDirective, getTypingStyleDirective } from '@/lib/masterRandomizer';
import * as SOV from '@/lib/sovereign';
import { PERSONA_ARCHETYPES } from '@/lib/personaTemplates';
import { synthesizeGeminiSpeech } from '@/lib/geminiTts';
import { uploadSovereignAsset } from '@/lib/r2Client';
import { db } from '@/lib/db'; // 🛡️ RAILWAY DATABASE

/**
 * 🛰️ IMMORTAL RAILWAY GATEWAY v5.52 (Zero-Constructor Protocol)
 * Purpose: Direct PostgreSQL persistence on Railway + Cloudflare R2 vocal assets.
 */

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

    const brainPrompt = `[IDENTITY_CORE]:\n${dna}\n\n[EMOZION_STATE]:\n${emozionState}\n\n[ZONE_DIALECT_DICTIONARY]:\n${JSON.stringify(zoneDictionary)}\n\n[PERSONA_MOMENT_ANCHORS]:\n${JSON.stringify(personaMoments)}\n\n[SYSTEM]: STREET-CODED AUDITOR. { "text_message": "...", "audio_script": "..." }`;

    // 🚀 ATOMIC NEURAL CALL
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
    let dataOutput = { text_message: rawContent, audio_script: "" };
    try { dataOutput = JSON.parse(rawContent); } catch(e) {}

    const streamB_Text = dataOutput.text_message || "...";
    const streamA_Native = dataOutput.audio_script || "";

    const isVocalArchetype = ['astra-auditor', 'sovereign-node', 'the-archivist'].includes(finalProfileId.toLowerCase());
    const sendVoice = isVocalArchetype || shouldSendVoiceNote(finalProfileId, streamA_Native.length);

    // 🚀 VOCAL DNA PROVISIONING
    let voiceUrl: string | null = null;
    let voiceB64: string | null = null;
    if (sendVoice && streamA_Native) {
        try {
            const tts = await synthesizeGeminiSpeech(streamA_Native, profileItem?.voice_id || 'Aoede', profileItem?.personality || 'technical');
            if (tts.data) {
                voiceUrl = await uploadSovereignAsset(tts.data, `v5_${finalProfileId}_${Date.now()}.wav`, 'audio/wav');
                voiceB64 = tts.data.toString('base64');
            }
        } catch (err) { console.error('[Neural TTS Fail]:', err); }
    }

    // 🚀 SOVEREIGN BYTE STREAM HANDSHAKE
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        // 🚀 ATOMIC NEURAL HANDSHAKE: Sending full text chunk to ensure UI cohesion
        controller.enqueue(encoder.encode(`0:${JSON.stringify(streamB_Text)}\n`));

        if (voiceUrl) {
            const assetData = { type: 'voice-note', audioUrl: voiceUrl, audioData: voiceB64, audio_script: streamA_Native };
            controller.enqueue(encoder.encode(`d:${JSON.stringify(assetData)}\n`));
        }

        // 🧬 3. RAILWAY PERSISTENCE (Background)
        try {
            await Promise.all([
                db.query(
                    'INSERT INTO chat_messages (user_id, persona_id, role, content, created_at) VALUES ($1, $2, $3, $4, NOW())',
                    [finalUserId, finalProfileId, 'user', messages[messages.length - 1].content]
                ),
                db.query(
                    'INSERT INTO chat_messages (user_id, persona_id, role, content, media_url, audio_script, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
                    [finalUserId, finalProfileId, 'assistant', streamB_Text, voiceUrl, streamA_Native]
                )
            ]);
        } catch (dbErr) { console.error('[Railway Persistence Fail]:', dbErr); }

        controller.close();
      }
    });

    return new Response(readable, {
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
