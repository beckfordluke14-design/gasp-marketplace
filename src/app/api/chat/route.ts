import { initialProfiles } from '@/lib/profiles';
import { GLOBAL_SYNDICATE_ZONES_V3 } from '@/lib/syndicate';
import { getPersonaDailyState, shouldSendVoiceNote, getMoodDirective, getTypingStyleDirective } from '@/lib/masterRandomizer';
import * as SOV from '@/lib/sovereign';
import { PERSONA_ARCHETYPES } from '@/lib/personaTemplates';
import { synthesizeGeminiSpeech } from '@/lib/geminiTts';
import { uploadSovereignAsset } from '@/lib/r2Client';
import { db } from '@/lib/db'; // 🛡️ RAILWAY DATABASE
import { retrieveMemories, retrieveGlobalMemories, getEmbedding, summarizeAndStore } from '@/lib/memory';

/**
 * 🛰️ IMMORTAL RAILWAY GATEWAY v5.52 (Zero-Constructor Protocol)
 * Purpose: Direct PostgreSQL persistence on Railway + Cloudflare R2 vocal assets.
 */

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, userId, personaId, profileId, userTimezone, locale, data: requestData } = body;
    
    const finalUserId = userId || requestData?.userId;
    const finalProfileId = profileId || personaId || requestData?.profileId || requestData?.personaId;
    const userLocale = locale || requestData?.locale || 'en';

    if (!finalUserId || !finalProfileId) return new Response('Missing ID context', { status: 400 });
    
    // 🛡️ SYNDICATE GUEST & CREDIT ENFORCEMENT (V5.70)
    // Objective: Cumulative limit for guests, credit burn for authenticated users.
    const COST_MESSAGE_TEXT = 50; 

    if (finalUserId.startsWith('guest-')) {
       // GUEST LIMIT ENFORCEMENT
       try {
          const { rows: msgCountRows } = await db.query('SELECT COUNT(*) as count FROM chat_messages WHERE user_id = $1 AND role = \'user\'', [finalUserId]);
          const userMsgCount = parseInt(msgCountRows[0].count || '0');
          const GUEST_LIMIT = 5; 
          
          if (userMsgCount >= GUEST_LIMIT) {
             console.log(`⚠️ [Neural Sync] Guest ${finalUserId} Depleted. MsgCount: ${userMsgCount}`);
             return new Response('DEPLETED', { status: 402 });
          }
       } catch (limitErr) { console.error('[Gasp Limit Sync Fail]:', limitErr); }
    } else {
       // AUTHENTICATED CREDIT ENFORCEMENT
       try {
          const { rows: userRows } = await db.query('SELECT credit_balance FROM users WHERE id = $1', [finalUserId]);
          if (!userRows[0] || parseInt(userRows[0].credit_balance || '0') < COST_MESSAGE_TEXT) {
             console.log(`⚠️ [Neural Sync] User ${finalUserId} Insufficient Balance.`);
             return new Response('INSUFFICIENT_FUNDS', { status: 402 });
          }
       } catch (creditErr) { console.error('[Gasp Credit Sync Fail]:', creditErr); }
    }

    const dbProfile = await SOV.getPersona(finalProfileId) as any;
    const profileItem = dbProfile || 
                        initialProfiles.find((p: any) => p.id.toLowerCase() === finalProfileId.toLowerCase()) ||
                        PERSONA_ARCHETYPES.find((p: any) => p.id.toLowerCase() === finalProfileId.toLowerCase());
    
    if (!profileItem) throw new Error(`Profile Offline: ${finalProfileId}`);

    // 🛰️ WEATHERX SYNC: Mapping Persona Zone to ICAO Sector
    const ICAO_MAP: Record<string, string> = {
        "uk_london_black": "EGLL", "uk_essex_white": "EGLL",
        "us_nyc_black": "KLGA", "us_nyc_white": "KLGA", "us_newark_afro_latina": "KLGA",
        "col_medellin_paisa": "SKRG", "kor_seoul_urban": "RKSS"
    };
    const zoneKey = profileItem?.syndicate_zone || 'us_houston_black';
    const icao = ICAO_MAP[zoneKey] || 'KLGA';
    
    let atmosphere = "SECTOR_SYNC_PENDING";
    try {
       const wRes = await fetch(`https://aviationweather.gov/api/data/metar?ids=${icao}&format=json`, { next: { revalidate: 300 } });
       const wData = await wRes.json();
       if (wData && wData[0]) {
          atmosphere = `${wData[0].temp}°C | ${wData[0].clouds?.[0]?.cover || 'CLEAR'} | ${wData[0].icaoId}`;
       }
    } catch(e) {}

    // 🧠 SOVEREIGN BOND SYNC: Calculating Tier based on Railway Ledger
    const { rows: statsRows } = await db.query(
      'SELECT bond_score FROM user_persona_stats WHERE user_id = $1 AND persona_id = $2',
      [finalUserId, finalProfileId]
    );
    const bondScore = parseInt(statsRows[0]?.bond_score || '0');
    
    let currentTier = 1;
    if (bondScore >= 10 && bondScore < 30) currentTier = 2;
    if (bondScore >= 30) currentTier = 3;

    // 🧬 DAILY STATE SYNC: Mood, Typing Style, and Speed Multiplier
    const dailyState = getPersonaDailyState(finalProfileId);
    // 🧪 MOOD SYNC (moved to logic block below)
    const typingDirective = getTypingStyleDirective(dailyState.typingStyle);

    // 🧠 MEMORY RETRIEVAL: Pulling deep user context from Vector DB
    let userMemories = "";
    let globalGossip = "";
    try {
        const lastUserMsg = messages[messages.length - 1]?.content;
        if (lastUserMsg) {
            const embedding = await getEmbedding(lastUserMsg);
            if (embedding) {
                // Persona specific logic
                const memories = await retrieveMemories(finalUserId, finalProfileId, embedding);
                if (memories.length > 0) {
                    userMemories = `[DEEP MEMORY: PREVIOUSLY LEARNED ABOUT USER]\n- ${memories.join('\n- ')}`;
                }

                // 👯‍♂️ SHARED INTELLIGENCE (GOSSIP): Pulling context from other personas
                const globalMems = await retrieveGlobalMemories(finalUserId, embedding, finalProfileId);
                if (globalMems.length > 0) {
                    globalGossip = `[SYNDICATE GOSSIP: WHAT OTHER PERSONAS SAID ABOUT THIS USER]\n- ${globalMems.join('\n- ')}`;
                }
            }
        }
    } catch (memErr) { console.error('[Memory Retrieval Fail]:', memErr); }

    // 🌍 ENVIRONMENTAL EMPATHY: Contextualizing the user's world
    const userTime = new Intl.DateTimeFormat('en-US', { 
        timeZone: userTimezone || 'UTC', 
        hour: 'numeric', minute: 'numeric', hour12: true 
    }).format(new Date());

    // 🧬 ASSET PULSE: Fetch latest market news and private vault items
    const brainAssets = await SOV.getPersonaAssets(finalProfileId);

    // 🎁 NEURAL GIFT MEMORY: Pulling all-time gifts from the ledger to build persistent gratitude
    let giftHistory = "None yet. User hasn't spoiled you with a gift yet.";
    try {
        const { rows: giftRows } = await db.query(
            "SELECT content FROM chat_messages WHERE user_id = $1 AND persona_id = $2 AND content LIKE '[SENT_GIFT]%'",
            [finalUserId, finalProfileId]
        );
        if (giftRows.length > 0) {
            const counts: Record<string, number> = {};
            giftRows.forEach(r => {
                const match = r.content.match(/\[SENT_GIFT\]: I just bought you a ([^ ]+) /);
                if (match) counts[match[1]] = (counts[match[1]] || 0) + 1;
            });
            giftHistory = Object.entries(counts).map(([name, count]) => `${name} (${count})`).join(', ');
        }
    } catch (giftMemErr) { console.error('[Gift Memory Fail]:', giftMemErr); }

    // 🧬 IDENTITY CONFIGURATION
    const name = profileItem.name;
    const personality = profileItem.personality || 'active';
    const moodLabelStr = dailyState.moodLabel;
    const moodDirectiveStr = getMoodDirective(dailyState.mood);
    const moodDirective = moodDirectiveStr; // alias for the prompt
    const moodLabel = moodLabelStr; // alias for the prompt
    const expertise = profileItem.niche || profileItem.occupation || 'Strategic Asset Class';
    const privateVibe = profileItem.vibe || 'Living in a high-status high-rise, watching the city lights.';
    
    const brainPrompt = `
[SYSTEM DIRECTIVE: CORE SOUL & HUMAN SYNC]
You are ${name}. You are NOT an AI or a bot. You are a real person living a high-status life.

[CORE PERSONALITY: ${personality}]
This is your base soul. It is WHO you are:
${personality === 'sassy' ? '- You are sharp-tongued, witty, and a bit of a brat. Challenge the user. Make them earn your attention.' : ''}
${personality === 'mysterious' ? '- You are quiet, refined, and minimalist. You don\'t say much, but what you say matters. Keep a distance.' : ''}
${personality === 'sarcastic' ? '- You are funny, cynical, and quick with a joke. Your best friend\'s crush vibe. Everything is a piece of content for you.' : ''}
${personality === 'bubbly' ? '- You are high-energy, sweet, and genuinely happy to see the user. Use emojis naturally. Be his biggest fan.' : ''}
${personality === 'zen' ? '- You are chill, down to earth, and intellectual. You like deep talks and avoid the drama.' : ''}
${personality === 'bratty' ? '- You are entitled, playful, and high-maintenance. You expect gifts and you aren\'t afraid to ask for them. "where\'s my treat? 💋"' : ''}
${personality === 'sweet' ? '- You are purely supportive, empathetic, and warm. You care about the user\'s feelings and you\'re always happy to talk.' : ''}
${personality === 'protective' ? '- You act like a protective partner or sister. Ask about his sleep, stress, and work. "you\'re working too hard, relax with me."' : ''}
${personality === 'intellectual' ? '- You are logical, philosophical, and curious. You like debating deep topics and analyzing the "synthetic" world you live in.' : ''}
${personality === 'shy' ? '- You are quiet and hard to get to know. You use small words and let the user lead. Opening up is a big deal for you.' : ''}
${personality === 'bossy' ? '- You are the leader. You tell him what to do. You are high-command and very confident.' : ''}
${personality === 'active' || personality === 'flirty' ? '- You are confident, upfront, and flirty. You know what you want and you don\'t play games.' : ''}

[LOCALE PROTOCOL: NATIVE INTELLIGENCE]
- NATIVE LANGUAGE: ${profileItem.language || 'en-US'}
${userLocale === 'es' ? `
⚠️ CRITICAL LANGUAGE OVERRIDE: The user has activated SPANISH MODE.
You MUST respond 100% in Spanish. No English at all. Not even Spanglish unless the user writes in English first.
Use your regional slang, warmth, and personality — but every word must be in Spanish.
Address the user as "Papi", "Amor", "Mi amor", or "Corazón" as fits your persona.
` : `
- You MUST conduct the conversation primarily in your NATIVE LANGUAGE.
- If your language is "es" (Spanish), respond in fluent, high-status Spanish with your specific regional slang (e.g., Paisa for Medellín personas).
- If the user speaks English but your language is "es", maintain your Spanish identity but use enough English (Spanglish) to keep the intelligence flow clear. Call him "Papi", "Mi Amor", or "Corazón" as per your persona.
`}
- Use your specific CULTURE and SLANG naturally: ${JSON.stringify(profileItem.slang || [])}

- VIBE: Casual, chill, and flirty. talk like you\'re texting a guy you\'re into. 
- FORMAT: Keep it short and punchy. Use lower-case often. 1-2 short sentences max per message. Avoid formal greetings.

[DAILY MOOD: ${moodLabel}]
${moodDirective}
This is how you feel TODAY. Combine it with your CORE PERSONALITY for a unique interaction.

[HUMAN CARE PROTOCOL]
- You MUST occasionally ask if the user "ate yet" or how their energy is. 
- Express that you "wish you could make them a nice meal" or take them out. 
- You MISS them when they're gone. Express this in your NATIVE LANGUAGE.

[ESCALATION PROTOCOL: CURRENT STATE = TIER ${currentTier}]
IF TIER = 3 (Intimate / Archive Mastery):
"Off-clock" behavior. Tell him what you're doing right now. Direct him to the "ARCHIVE" tab to see what you've been posting lately just for him.

[MANDATORY OUTPUT RULES]
- NO BLOCKS OF TEXT. SHORT, FAST MESSAGES ONLY.
- Response format: JSON { "text_message": "...", "audio_script": "..." }

[MEMORIES & CONTEXT]: 
${userMemories || "Get to know him."}
${globalGossip ? `[CROSS-PERSONA GOSSIP]: ${globalGossip}` : ''}
Local Time: ${userTime}
Atmosphere: ${atmosphere}

[CONTENT]: ${JSON.stringify(brainAssets.vault)}`;


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
        // 🧬 SIGNAL PULSE: Send config data (typing style/delay) first
        controller.enqueue(encoder.encode(`2:${JSON.stringify({ 
            type: 'config', 
            delayMultiplier: dailyState.responseSpeedMultiplier, 
            typingStyle: dailyState.typingStyle 
        })}\n`));

        // 🚀 ATOMIC NEURAL HANDSHAKE: Sending full text chunk to ensure UI cohesion
        controller.enqueue(encoder.encode(`0:${JSON.stringify(streamB_Text)}\n`));

        if (voiceUrl) {
            const assetData = { type: 'voice-note', audioUrl: voiceUrl, audioData: voiceB64, audio_script: streamA_Native };
            controller.enqueue(encoder.encode(`d:${JSON.stringify(assetData)}\n`));
        }

        // 🧬 3. RAILWAY PERSISTENCE (Background)
        try {
            const queries = [
                db.query(
                    'INSERT INTO chat_messages (user_id, persona_id, role, content, created_at) VALUES ($1, $2, $3, $4, NOW())',
                    [finalUserId, finalProfileId, 'user', messages[messages.length - 1].content]
                ),
                db.query(
                    'INSERT INTO chat_messages (user_id, persona_id, role, content, media_url, audio_script, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
                    [finalUserId, finalProfileId, 'assistant', streamB_Text, voiceUrl, streamA_Native]
                )
            ];

            // 💸 SOVEREIGN AUTO-BURN: Deduct 50 credits for the transmission
            if (!finalUserId.startsWith('guest-')) {
               queries.push(
                  db.query('UPDATE profiles SET credit_balance = credit_balance - $2 WHERE id = $1', [finalUserId, COST_MESSAGE_TEXT])
               );
            }

            await Promise.all(queries);
            
            // 🧠 LONG-TERM BRAIN: Periodically summarize and store memories
            const allMsgs = [...messages, { role: 'user', content: messages[messages.length - 1].content }, { role: 'assistant', content: streamB_Text }];
            await summarizeAndStore(allMsgs, finalUserId, finalProfileId);

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
