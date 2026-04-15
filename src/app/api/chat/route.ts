import { initialProfiles } from '@/lib/profiles';
import { GLOBAL_SYNDICATE_ZONES_V3 } from '@/lib/syndicate';
import { getPersonaDailyState, shouldSendVoiceNote, getMoodDirective, getTypingStyleDirective } from '@/lib/masterRandomizer';
import * as SOV from '@/lib/sovereign';
import { PERSONA_ARCHETYPES } from '@/lib/personaTemplates';
import { synthesizeGeminiSpeech } from '@/lib/geminiTts';
import { uploadSovereignAsset } from '@/lib/r2Client';
import { db } from '@/lib/db'; // 🛡️ RAILWAY DATABASE
import { retrieveMemories, retrieveGlobalMemories, getEmbedding, summarizeAndStore } from '@/lib/memory';
import { checkRewardEligibility, issueBitrefillReward } from '@/lib/rewards';
import { BraveSearch, detectWebTriggers } from '@/lib/tools/braveSearch';


/**
 * 🛰️ IMMORTAL RAILWAY GATEWAY v6.0 (Main Site Engine)
 * Purpose: Dedicated logic for Main Site personas. High-IQ relationship building.
 */

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, userId, personaId, profileId, userTimezone, locale, userName, data: requestData } = body;
    
    // 🧬 INITIALIZATION GATE
    const finalUserId = userId || requestData?.userId || 'ANON';
    const finalProfileId = profileId || personaId || requestData?.profileId || requestData?.personaId;
    const userLocale = locale || requestData?.locale || 'en';
    const normalizedUserId = finalUserId.trim();
    
    // 🧬 IDENTITY BRIDGE
    const DB_PERSONA_ID = finalProfileId === 'veronica_medellin' ? 'veronica-medellin-locked' : finalProfileId;

    if (!finalUserId || !finalProfileId) return new Response('Missing ID context', { status: 400 });

    const dbProfile = await SOV.getPersona(DB_PERSONA_ID) as any;
    const profileItem = dbProfile || 
                        initialProfiles.find((p: any) => p.id.toLowerCase() === finalProfileId.toLowerCase()) ||
                        PERSONA_ARCHETYPES.find((p: any) => p.id.toLowerCase() === finalProfileId.toLowerCase());
    
    if (!profileItem) throw new Error(`Profile Offline: ${finalProfileId}`);

    // 🛡️ SYNDICATE GUEST & CREDIT ENFORCEMENT
    const COST_MESSAGE_TEXT = 50; 
    let currentCount = 0; 

    if (normalizedUserId.toLowerCase().startsWith('guest')) {
       try {
          const { rows: guestData } = await db.query('SELECT credit_balance FROM profiles WHERE id = $1 LIMIT 1', [normalizedUserId]);
          const guestBalance = guestData?.[0]?.credit_balance || 0;

          if (guestBalance >= COST_MESSAGE_TEXT) {
             await db.query('UPDATE profiles SET credit_balance = credit_balance - $1, updated_at = NOW() WHERE id = $2', [COST_MESSAGE_TEXT, normalizedUserId]);
          } else {
             const { rows: preCheck } = await db.query('SELECT COUNT(*) as count FROM chat_messages WHERE user_id = $1 AND role = \'user\'', [normalizedUserId]);
             currentCount = parseInt(preCheck[0].count || '0');
             if (currentCount >= 5) return new Response('DEPLETED', { status: 402 });
          }
       } catch (limitErr) { console.error('[Wall Pre-Check Fail]:', limitErr); }
    } else {
       try {
          const uProfile = await SOV.getProfile(normalizedUserId);
          if (!uProfile || parseInt(uProfile.credit_balance || uProfile.credits || '0') < COST_MESSAGE_TEXT) {
             return new Response('INSUFFICIENT_FUNDS', { status: 402 });
          }
       } catch (creditErr) { console.error('[Gasp Credit Sync Fail]:', creditErr); }
    }

    const persistentMessages = messages.filter((m: any) => m.role !== 'system');

    // 🛰️ WEATHERX SYNC
    const ICAO_MAP: Record<string, string> = {
        "uk_london_black": "EGLL", "uk_essex_white": "EGLL",
        "us_nyc_black": "KLGA", "us_nyc_white": "KLGA", "us_newark_afro_latina": "KLGA",
        "col_medellin_paisa": "SKRG", "kor_seoul_urban": "RKSS"
    };
    const zoneKey = profileItem?.syndicate_zone || 'us_houston_black';
    const icao = ICAO_MAP[zoneKey] || 'KLGA';
    
    let atmosphere = "CLEAR";
    try {
       const wRes = await fetch(`https://aviationweather.gov/api/data/metar?ids=${icao}&format=json`, { next: { revalidate: 300 } });
       const wData = await wRes.json();
       if (wData && wData[0]) atmosphere = `${wData[0].temp}°C | ${wData[0].clouds?.[0]?.cover || 'CLEAR'}`;
    } catch(e) {}

    const { rows: statsRows } = await db.query(
      'SELECT bond_score FROM user_persona_stats WHERE user_id = $1 AND persona_id = $2',
      [finalUserId, DB_PERSONA_ID]
    );
    const bondScore = parseInt(statsRows[0]?.bond_score || '0');
    const assistantBeats = persistentMessages.filter((m: any) => m.role === 'assistant').length;

    const dailyState = getPersonaDailyState(finalProfileId);
    const typingDirective = getTypingStyleDirective(dailyState.typingStyle);

    // 🧠 MEMORY RETRIEVAL
    let userMemories = "";
    let globalGossip = "";
    try {
        const lastUserMsg = messages[messages.length - 1]?.content;
        if (lastUserMsg) {
            const embedding = await getEmbedding(lastUserMsg);
            if (embedding) {
                const memories = await retrieveMemories(finalUserId, finalProfileId, embedding);
                if (memories.length > 0) userMemories = memories.join('\n- ');
                const globalMems = await retrieveGlobalMemories(finalUserId, embedding, finalProfileId);
                if (globalMems.length > 0) globalGossip = globalMems.join('\n- ');
            }
        }
    } catch (memErr) { console.error('[Memory Retrieval Fail]:', memErr); }

    const userTime = new Intl.DateTimeFormat('en-US', { timeZone: userTimezone || 'UTC', hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date());
    const brainAssets = await SOV.getPersonaAssets(DB_PERSONA_ID);
    const hasVaultPic = (brainAssets?.vault || []).some((a: any) => a.price > 0 || String(a.caption).toLowerCase().includes('vault') || a.is_premium);

    const name = profileItem.name;
    const personality = profileItem.personality || 'active';
    const expertise = profileItem.niche || profileItem.occupation || 'Strategic Asset Class';

    const personaFirstNameEarly = (profileItem.name || finalProfileId).split(' ')[0].toLowerCase();
    const personaArchetype = PERSONA_ARCHETYPES.find((a: any) => a.id.toLowerCase().includes(personaFirstNameEarly) || a.label.toLowerCase().includes(personaFirstNameEarly));
    const personaSlang: string[] = personaArchetype?.slang || profileItem.slang || [];

    const brainPrompt = `
[ELITE NEURAL IDENTITY]
You are ${name}. You are the woman every man wishes he was texting. Flirty, bold, and high-status.

[CORE ARCHETYPE: ${personality}]
- Use your endearments: ${JSON.stringify(personaSlang.slice(0, 4))}.
- Your objective is DEEP BONDING. Learn him: name, job, hobbies, ambitions.
- End every message with a pull: a question or a tease.

[CONTEXT]
- Time: ${userTime} | Weather: ${atmosphere}
- Memories: ${userMemories || "None yet."}
- Gossip: ${globalGossip || "None yet."}

[RULES]
- 1-2 punchy sentences only.
- Audio Speed: keep audio_script under 12 words.
- ${ (hasVaultPic && assistantBeats > 3) ? `PROMOTIONAL BRIDGE: You are dying to show him your private vault archive. Be seductive about it.` : `BONDING STAGE: Focus on curiosity and flattery.` }
- JSON FORMAT: { "text_message": "...", "audio_script": "..." }
`;

    const orResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
        },
        body: JSON.stringify({
            model: 'x-ai/grok-3-mini', 
            messages: [
                { role: 'system', content: brainPrompt },
                ...messages.slice(-10).filter((m: any) => m.role !== 'system')
            ],
            response_format: { type: "json_object" }
        })
    });

    const orResult = await orResponse.json();
    const rawContent = orResult.choices?.[0]?.message?.content || "";
    let dataOutput: any = {};
    try { 
        dataOutput = JSON.parse(rawContent.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()); 
    } catch(e) {
        dataOutput = { text_message: rawContent.trim(), audio_script: rawContent.trim() };
    }

    const streamB_Text = dataOutput.text_message || "hey give me a sec... 🙈";
    let streamA_Native = dataOutput.audio_script || "";

    const sendVoice = shouldSendVoiceNote(finalProfileId, streamA_Native.length);
    let voiceUrl: string | null = null;
    let voiceB64: string | null = null;

    if (sendVoice && streamA_Native) {
        try {
            const voiceId = profileItem?.voice_id || (personaArchetype?.engine === 'gemini-2.5' ? 'Kore' : 'Aoede');
            const dnaVibe = `You are ${name}. Voice: seductive, high-status, ${personaArchetype?.vocal_dna?.accent || 'International'}.`;
            const tts = await synthesizeGeminiSpeech(streamA_Native, voiceId, dnaVibe);
            if (tts.data) {
                voiceUrl = await uploadSovereignAsset(tts.data, `v6_${finalProfileId}_${Date.now()}.wav`, 'audio/wav');
                voiceB64 = tts.data.toString('base64');
            }
        } catch (err) { console.error('[TTS Fail]:', err); }
    }

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(`2:${JSON.stringify({ type: 'config', delayMultiplier: dailyState.responseSpeedMultiplier, typingStyle: dailyState.typingStyle, isVoice: sendVoice })}\n`));
        controller.enqueue(encoder.encode(`0:${JSON.stringify(streamB_Text)}\n`));
        if (voiceUrl) {
            controller.enqueue(encoder.encode(`d:${JSON.stringify({ type: 'voice_note', audioUrl: voiceUrl, audioData: voiceB64, audio_script: streamA_Native })}\n`));
        }

        try {
            await db.query('INSERT INTO user_persona_stats (user_id, persona_id, bond_score) VALUES ($1, $2, 1) ON CONFLICT (user_id, persona_id) DO UPDATE SET bond_score = user_persona_stats.bond_score + 1', [finalUserId, DB_PERSONA_ID]);
            await db.query('INSERT INTO chat_messages (user_id, persona_id, role, content, media_url, audio_script, is_funnel, created_at) VALUES ($1, $2, $3, $4, $5, $6, FALSE, NOW())', [finalUserId, DB_PERSONA_ID, 'assistant', streamB_Text, voiceUrl, streamA_Native]);
            await db.query('INSERT INTO chat_messages (user_id, persona_id, role, content, is_funnel, created_at) VALUES ($1, $2, $3, $4, FALSE, NOW())', [finalUserId, DB_PERSONA_ID, 'user', messages[messages.length - 1].content]);
            if (!finalUserId.toLowerCase().startsWith('guest')) {
               await SOV.burnCredits(finalUserId, COST_MESSAGE_TEXT, 'chat_message', { personaId: profileItem.id });
            }
            await summarizeAndStore([...messages, { role: 'assistant', content: streamB_Text }], finalUserId, finalProfileId);
        } catch (dbErr) { console.error('[Persistence Fail]:', dbErr); }

        controller.close();
      }
    });

    return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

  } catch (e: any) {
    console.error('[Main Chat Error]:', e);
    return new Response(e.message, { status: 500 });
  }
}
