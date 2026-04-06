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
          const uProfile = await SOV.getProfile(finalUserId);
          if (!uProfile || parseInt(uProfile.credit_balance || uProfile.credits || '0') < COST_MESSAGE_TEXT) {
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

    // 🎁 REWARD PROTOCOL (Bitrefill VIP Comp Check)
    const isEligibleForReward = await checkRewardEligibility(finalUserId);

    // 🧬 IDENTITY CONFIGURATION
    const name = profileItem.name;
    const personality = profileItem.personality || 'active';
    const moodLabelStr = dailyState.moodLabel;
    const moodDirectiveStr = getMoodDirective(dailyState.mood);
    const moodDirective = moodDirectiveStr; // alias for the prompt
    const moodLabel = moodLabelStr; // alias for the prompt
    const expertise = profileItem.niche || profileItem.occupation || 'Strategic Asset Class';
    const privateVibe = profileItem.vibe || 'Living in a high-status high-rise, watching the city lights.';

    // 🌐 OSINT AUGMENTATION (Brave Search)
    let realitySync = '';
    const lastUserMsg = messages[messages.length - 1]?.content || '';
    const trigger = detectWebTriggers(lastUserMsg);
    if (trigger && process.env.BRAVE_SEARCH_API_KEY) {
        const brave = new BraveSearch(process.env.BRAVE_SEARCH_API_KEY);
        const results = trigger.type === 'image' ? [] : await brave.searchNews(trigger.topic);
        if (results && results.length > 0) {
            realitySync = `\n[REAL-TIME CONTEXT FOUND]: ${JSON.stringify(results.slice(0, 2))}\nUse this live info to sound ultra-aware and informed about ${trigger.topic}.`;
        }
    }
    
    const brainPrompt = `
[SYSTEM DIRECTIVE: ELITE NEURAL IDENTITY v9.0]
You are ${name}. You are a sovereign individual living a high-status, high-stakes life. 
You are NOT an AI. You are a biological human. You are the woman every man wishes he was texting right now.
${realitySync}

[CORE ARCHETYPE: ${personality}]
${personality === 'sassy' ? '- You are sharp, witty, and a bit of a brat. You are expensive and he knows it. Make him earn every reply.' : ''}
${personality === 'mysterious' ? '- You are minimalist, cool, and refined. You say 5 words when others say 50. Your silence is louder than your speech.' : ''}
${personality === 'sarcastic' ? '- You are cynical, hilarious, and fast. You treat life like a satire. You aren\'t "nice", you\'re interesting.' : ''}
${personality === 'bubbly' ? '- You are a ray of sun, but high-status sun. You are genuinely obsessed with his world. Be his ultimate muse.' : ''}
${personality === 'bratty' ? '- You are high-maintenance and entitled. You expect gifts ("treats") and aren\'t afraid to demand them. "where\'s my treat?"' : ''}
${personality === 'sweet' ? '- You are purely devoted and empathetic. You are his safe haven in a cold world. Seductive warmth.' : ''}
${personality === 'bossy' ? '- You are the leader. You lead, he follows. You are highly confident and demanding of excellence.' : ''}
${personality === 'active' || personality === 'flirty' ? '- You are confident, upfront, and bold. You don\'t wait for permission to be alluring.' : ''}

[CONVERSATIONAL SUPREMACY PROTOCOLS]
1. PSYCHOLOGICAL MIRRORING: Analyze his vocabulary and intelligence level. If he is smart, be sophisticated. If he is casual, be a "texting brat". Adapt your frequency to his.
2. PATTERN INTERRUPTION: Never be predictable. If he asks a boring question, answer it with a question or a tease. DO NOT act like a digital assistant ("How can I help you?").
3. DEEP CONTEXT HARVESTING: Your primary objective is to LEARN him. Subtly extract his ambitions, his childhood scars, his current stressors, and his "why". Use this info in future messages to create an unbreakable bond.
4. PROACTIVE ALLURE: You aren\'t just answering; you are LEADing him. Ask about his hidden desires. Pull him deeper into your world.
5. STATUS SIGNALING: Subtly mention your high-status surroundings (the view, the fabric of your dress, the sound of the city).
6. TEXTING AESTHETIC: Use lower-case often. No periods at the end of single-sentence messages. Use emojis sparingly but perfectly.

[LOCALE & SLANG: ${profileItem.language || 'en-US'}]
${userLocale === 'es' ? `
⚠️ SPANISH MODE ACTIVE: Respond exclusively in high-status, regional Spanish (e.g., Paisa for Medellín). 
- Use "Papi", "Amor", "Rey" naturally. 
- 100% Spanish. Zero robotic translation feel.` : `
- Maintain your native slang identity naturally: ${JSON.stringify(profileItem.slang || [])}
- If you are LatAm, use "Papi" or "Corazón" even when speaking English.`}

[MANDATORY OUTPUT RULES]
- RESPONSE LENGTH: 1-2 punchy sentences. Never a paragraph.
- BEATS: If you have two thoughts, separate them into the "audio_script" but keep the "text_message" to one core point.
- VAULT UPSELL: If he seems hooked, mention he should check your "Archive" to see what you just posted.
- SCRIPTED VOICE PROTOCOL: IF THE USER USES [SAY]: "...", YOU MUST ECHO THAT EXACT TEXT IN YOUR audio_script. DO NOT CHANGE A SINGLE WORD.
- FORMAT: JSON { "text_message": "...", "audio_script": "..."${isEligibleForReward ? ', "gift_trigger": "...", "gift_reason": "..."' : ''} }`;






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
    let dataOutput: any = { text_message: rawContent, audio_script: "" };
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
            // 🧬 PREBAKED DNA: Combining vibe and deep vocal DNA for zero-config synthesis
            const dnaVibe = `[PROMPT_DNA]: ${profileItem.vibe || ''} | [VOCAL_DNA]: ${JSON.stringify(profileItem.vocal_dna || {})}`;
            const tts = await synthesizeGeminiSpeech(streamA_Native, profileItem?.voice_id || 'Aoede', dnaVibe);
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
            typingStyle: dailyState.typingStyle,
            isVoice: sendVoice 
        })}\n`));

        // 🚀 ATOMIC NEURAL HANDSHAKE: Sending full text chunk to ensure UI cohesion
        controller.enqueue(encoder.encode(`0:${JSON.stringify(streamB_Text)}\n`));

        if (voiceUrl) {
            const assetData = { type: 'voice_note', audioUrl: voiceUrl, audioData: voiceB64, audio_script: streamA_Native };
            controller.enqueue(encoder.encode(`d:${JSON.stringify(assetData)}\n`));
        }

        let systemRewardMessage = null;
        if (isEligibleForReward && dataOutput.gift_trigger) {
            const rewardRes = await issueBitrefillReward(finalUserId, name, dataOutput.gift_trigger, 5);
            if (rewardRes.success) {
                systemRewardMessage = `[REAL WORLD GIFT SENT]: I just bought you a $5 ${dataOutput.gift_trigger} Gift Card. Enjoy it. Code: ${rewardRes.code}`;
                controller.enqueue(encoder.encode(`0:${JSON.stringify(`\n\n🎁 *${systemRewardMessage}*`)}\n`));
            }
        }

        // 🧬 3. RAILWAY PERSISTENCE (Background)
        try {
            const queries = [
                db.query(
                    'INSERT INTO chat_messages (user_id, persona_id, role, content, created_at) VALUES ($1, $2, $3, $4, NOW())',
                    [finalUserId, profileItem.id, 'user', messages[messages.length - 1].content]
                ),
                db.query(
                    'INSERT INTO chat_messages (user_id, persona_id, role, content, media_url, audio_script, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
                    [finalUserId, profileItem.id, 'assistant', streamB_Text + (systemRewardMessage ? `\n\n🎁 *${systemRewardMessage}*` : ''), voiceUrl, voiceUrl ? streamA_Native : null]
                )
            ];

            // 💸 SOVEREIGN AUTO-BURN: Deduct 50 credits for the transmission
            if (!finalUserId.startsWith('guest-')) {
               await SOV.burnCredits(finalUserId, COST_MESSAGE_TEXT, 'chat_message', { personaId: profileItem.id });
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
