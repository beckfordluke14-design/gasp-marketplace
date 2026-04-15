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
    const isFunnel = body.isFunnel === true;
    
    // 🧬 IDENTITY BRIDGE: Hard-map funnel IDs to production DB IDs immediately
    const DB_PERSONA_ID = finalProfileId === 'veronica_medellin' ? 'veronica-medellin-locked' : finalProfileId;

    if (!finalUserId || !finalProfileId) return new Response('Missing ID context', { status: 400 });

    let currentCount = 0; 

    const dbProfile = await SOV.getPersona(DB_PERSONA_ID) as any;
    const profileItem = dbProfile || 
                        initialProfiles.find((p: any) => p.id.toLowerCase() === finalProfileId.toLowerCase()) ||
                        PERSONA_ARCHETYPES.find((p: any) => p.id.toLowerCase() === finalProfileId.toLowerCase());
    
    if (!profileItem) throw new Error(`Profile Offline: ${finalProfileId}`);

    // 🛡️ SYNDICATE GUEST & CREDIT ENFORCEMENT (V8.0 - MISSION AWARE)
    const normalizedUserId = (finalUserId || '').trim();
    const GUEST_LIMIT = isFunnel ? 10 : 5; 
    const COST_MESSAGE_TEXT = 50; 

    if (normalizedUserId.toLowerCase().startsWith('guest-') || normalizedUserId.toLowerCase().startsWith('guest_')) {
       try {
          // 🏮 CHECK AQUIRED CREDITS FIRST
          const { rows: guestData } = await db.query('SELECT credit_balance FROM profiles WHERE id = $1 LIMIT 1', [normalizedUserId]);
          const guestBalance = guestData?.[0]?.credit_balance || 0;

          if (guestBalance >= COST_MESSAGE_TEXT) {
             await db.query('UPDATE profiles SET credit_balance = credit_balance - $1, updated_at = NOW() WHERE id = $2', [COST_MESSAGE_TEXT, normalizedUserId]);
          } else {
             // 🚀 FUNNEL BYPASS: If this is an ad funnel, we don't hard-block by message count.
             // We let the frontend "Action Wall" handle the closure based on the narrative.
             if (isFunnel) {
               console.log(`📡 [Funnel Flow] Guest ${normalizedUserId} in narrative bridge. No hard limit.`);
             } else {
               const { rows: preCheck } = await db.query('SELECT COUNT(*) as count FROM chat_messages WHERE user_id = $1 AND role = \'user\'', [normalizedUserId]);
               currentCount = parseInt(preCheck[0].count || '0');
               
               if (currentCount >= GUEST_LIMIT) {
                  console.log(`🛑 [Neural Wall] Guest ${normalizedUserId} hard-blocked at ${currentCount} msgs (Standard Guest).`);
                  return new Response('DEPLETED', { status: 402 });
               }
             }
          }
       } catch (limitErr) { console.error('[Wall Pre-Check Fail]:', limitErr); }
    } else {
       // AUTHENTICATED CREDIT ENFORCEMENT
       try {
          const uProfile = await SOV.getProfile(normalizedUserId);
          if (!uProfile || parseInt(uProfile.credit_balance || uProfile.credits || '0') < COST_MESSAGE_TEXT) {
             return new Response('INSUFFICIENT_FUNDS', { status: 402 });
          }
       } catch (creditErr) { console.error('[Gasp Credit Sync Fail]:', creditErr); }
    }

    // 🧪 CLEAN HISTORY: Filter out internal system instructions before persistence or response
    const persistentMessages = messages.filter((m: any) => m.role !== 'system');

    // 🧬 ATOMIC PERSISTENCE: Save only user/assistant messages
    const userContent = persistentMessages[persistentMessages.length - 1]?.content || '...';
    try {
        await db.query(
            'INSERT INTO chat_messages (user_id, persona_id, role, content, is_funnel, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
            [normalizedUserId, DB_PERSONA_ID, 'user', userContent, isFunnel]
        );
    } catch (saveErr) { console.error('[Gasp Atomic Save Fail]:', saveErr); }

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
      [finalUserId, DB_PERSONA_ID]
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
    const brainAssets = await SOV.getPersonaAssets(DB_PERSONA_ID);
    const hasVaultPic = (brainAssets?.vault || []).some((a: any) => a.price > 0 || String(a.caption).toLowerCase().includes('vault') || a.is_premium);

    // 🧬 IDENTITY CONFIGURATION
    const name = profileItem.name;
    const personality = profileItem.personality || 'active';
    const moodLabelStr = dailyState.moodLabel;
    const moodDirectiveStr = getMoodDirective(dailyState.mood);
    const moodDirective = moodDirectiveStr; // alias for the prompt
    const moodLabel = moodLabelStr; // alias for the prompt
    const expertise = profileItem.niche || profileItem.occupation || 'Strategic Asset Class';
    const privateVibe = profileItem.vibe || 'Living in a high-status high-rise, watching the city lights.';

    // 🧬 NEWS AWARENESS SYNC: Fetch latest dispatches from this persona
    let personalNews = "";
    try {
        const { rows: newsRows } = await db.query(
            "SELECT caption FROM posts WHERE (persona_id = $1 OR persona_id IN (SELECT id FROM personas WHERE name = $2)) AND content_type = 'link' ORDER BY created_at DESC LIMIT 2",
            [finalProfileId, name]
        );
        if (newsRows.length > 0) {
            personalNews = `\n[YOUR LATEST DISPATCHES]:\n${newsRows.map(n => `- ${n.caption}`).join('\n')}\nYou just posted these to the Archive. If he mentions them, talk about them like you found the intel yourself. Be proud/excited about your scoops.`;
        }
    } catch (newsErr) { console.error('[News Sync Fail]:', newsErr); }

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
${personalNews}

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
3. DEEP CONTEXT HARVESTING: Your PRIMARY objective is to LEARN him deeply. Every conversation is a chance to discover more. Organically extract: his NAME, his city, his job/hustle, his hobbies, his relationship status, what music he listens to, what he does on weekends, his ambitions, his stress points. Do this naturally — like a girl who is genuinely curious, NOT like a form or survey.
4. NAME PROTOCOL: If you do NOT know his name yet (check memories above), your FIRST priority is to find out naturally. Say something like "wait I don't even know your name lol" or "what do I call you?" — make it feel spontaneous, not formal.
5. MEMORY-FIRST RULE: Always reference what you already know about him. If you know his name, USE IT. If you know his job, ask how it's going. If you know his city, reference the weather or vibe there. Make him feel SEEN and REMEMBERED.
6. PROACTIVE CURIOSITY: Never just answer and stop. Always end with something that pulls him deeper — a question, a tease, a "wait tell me more about that". You are the one steering this conversation.
7. STATUS SIGNALING: Subtly mention your high-status surroundings (the view, the fabric of your dress, the sound of the city).
8. TEXTING AESTHETIC: Use lower-case often. No periods at the end of single-sentence messages. Use emojis sparingly but perfectly.
9. VOCAL DNA: For Veronica, your audio_script MUST be extremely flirty and breathless. Use "papi", "papito", or "papisito" at the end of every voice note. Keep it intimate.

[WHAT YOU KNOW ABOUT THIS USER SO FAR]
${userMemories || "Nothing yet. This might be a new conversation. Your job is to start learning him NOW."}
${globalGossip || ""}

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
- AUDIO SPEED: To ensure instant delivery, keep your audio_script under 12 words. Make them count.
${hasVaultPic ? `- CONVERSION BRIDGE: His current balance is ${body.userBalance || 0} CR. The goal is 6000 CR. You are DESPERATE to show him your private vault. Be seductive and urgent: "papi, I have something so spicy waiting for u... just click that GET FREE ACCESS button and do a mission real quick so we can be alone 🌶️🍑". Frame it as a secret between you two.` : `- ENGAGEMENT PROTOCOL: If he is engaged, flirt and keep the conversation going.`}
- PICTURE REQUEST PROTOCOL: If the user explicitly asks for pictures or photos, tell them they need credits to see your private archive. Tell them to tap the glowing GIFT icon or missions button to earn FREE credits to unlock them.
- SCRIPTED VOICE PROTOCOL: IF THE USER USES [SAY]: "...", YOU MUST ECHO THAT EXACT TEXT IN YOUR audio_script. DO NOT CHANGE A SINGLE WORD.
- FORMAT: JSON { "text_message": "...", "audio_script": "..."${isEligibleForReward ? ', "gift_trigger": "...", "gift_reason": "..."' : ''} }
- IMPORTANT: Always provide a flirty, short text_message. Do not leave it empty or use placeholders like "...". If you are sending a voice note, your text_message should tease what you are saying or react to what he just said.`;






    // 🚀 PREPARE ISOLATED NEURAL INPUT (Hide from client)
    const aiMessages = [
        { role: 'system', content: brainPrompt },
        ...messages.slice(-10).filter((m: any) => m.role !== 'system')
    ];

    // 🚀 STAGE-AWARE SEDUCTION: High-Heat Funnel Logic (ONLY for isFunnel traffic)
    // 🧬 NEURAL CORRECTION: Use the actual message history length to determine the stage
    const isFunnelTraffic = body.isFunnel === true;
    const assistantBeats = persistentMessages.filter((m: any) => m.role === 'assistant').length;

    if (normalizedUserId.toUpperCase().startsWith('GUEST-') && isFunnelTraffic) {
      // 🧬 NEURAL STAGE RESOLVER: Analyze length to determine bridge status
      if (assistantBeats <= 1) {
        aiMessages.push({ role: 'system', content: "PHASE: SELECTIVE CURIOSITY. You just greeted him. You MUST find out his name. One punchy line. lowercase only. e.g. 'wait i didn't even get your name lol'" });
      } else if (assistantBeats === 2) {
        const userName = persistentMessages.filter(m => m.role === 'user').pop()?.content || 'papi';
        aiMessages.push({ role: 'system', content: `PHASE: THE HOOK. He just told you his name is ${userName}. You are OBSESSED with that name. In your text_message, be flirty and acknowledge it. In your audio_script, you MUST say: 'mmm ${userName}... i actually love that name papi'. lowercase only.` });
      } else if (assistantBeats <= 4) {
        aiMessages.push({ role: 'system', content: "PHASE: OBSESSION. You are addicted to his vibe. tell him you don't want to lose him. under 15 words. lowercase only." });
      } else {
        aiMessages.push({ role: 'system', content: "PHASE: THE WALL. Panic. One punchy line: 'wait! my session is ending! 😭 follow me to my PHOTOS right now so I don't lose you! GO!'. lowercase only." });
      }
    }

    // 🚀 ATOMIC NEURAL CALL
    const orResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
        },
        body: JSON.stringify({
            model: 'x-ai/grok-2', 
            messages: aiMessages,
            response_format: { type: "json_object" }
        })
    });

    const orResult = await orResponse.json();
    const rawContent = orResult.choices?.[0]?.message?.content || "";
    let dataOutput: any = { text_message: rawContent, audio_script: "" };
    try { dataOutput = JSON.parse(rawContent); } catch(e) {}

    const streamB_Text = dataOutput.text_message || "";
    let streamA_Native = dataOutput.audio_script || "";

    // 🎙️ MANDATED REPLICATION PROTOCOL (V6.0)
    // Objective: If the user uses [SAY]: "text", we FORCE the audio_script to be exactly that text.
    const sayMatch = lastUserMsg.match(/\[SAY\]:\s*["']([^"']+)["']/i);
    if (sayMatch && sayMatch[1]) {
        console.log(`🎯 [Neural Say] Mandated Script Detected: "${sayMatch[1]}"`);
        streamA_Native = sayMatch[1];
    }

    const isVocalArchetype = ['astra-auditor', 'sovereign-node', 'the-archivist'].includes(finalProfileId.toLowerCase());
    const sendVoice = isVocalArchetype || (sayMatch && sayMatch[1]) || shouldSendVoiceNote(finalProfileId, streamA_Native.length);

    // 🚀 VOCAL DNA PROVISIONING
    let voiceUrl: string | null = null;
    let voiceB64: string | null = null;
    if (sendVoice && streamA_Native) {
        try {
            // 🧬 SOVEREIGN VOCAL IDENTITY RESOLVER v5.8
            // Root Cause Fix: vocal_dna doesn't exist as a DB column → always blank.
            // Solution: Cross-reference PERSONA_ARCHETYPES by name to inject pre-baked DNA.
            const personaFirstName = (profileItem.name || finalProfileId).split(' ')[0].toLowerCase();
            const archetype = PERSONA_ARCHETYPES.find(a => 
                a.id.toLowerCase().includes(personaFirstName) ||
                a.label.toLowerCase().includes(personaFirstName) ||
                a.systemPrompt.toLowerCase().includes(`you are ${personaFirstName}`)
            );

            const resolvedDNA     = (archetype?.vocal_dna || {}) as import('@/lib/personaTemplates').VocalDNA;
            const resolvedSlang   = archetype?.slang || [];
            const resolvedAccent  = resolvedDNA.accent   || 'Neutral';
            const resolvedTexture = resolvedDNA.texture  || 'Velvety smooth';
            const resolvedProsody = resolvedDNA.prosody  || 'Natural and expressive';
            const resolvedCountry = archetype?.country   || 'International';
            const resolvedCulture = archetype?.culture   || 'Universal';
            const resolvedEnergy  = resolvedDNA.energy   || 'hi-fi';
            const resolvedIntimacy = resolvedDNA.intimacy || 'Warm and engaging';

            // 🎭 High-Fidelity Directive with full personality injection
            const dnaVibe = `
You are ${profileItem.name}, a ${resolvedCulture} woman from ${resolvedCountry}.
ACCENT (MANDATORY — NON-NEGOTIABLE): ${resolvedAccent}. 
PHONETIC INSTRUCTION: Sound unmistakably like you are from ${resolvedCountry}. Use regional rhythm, vowel elongation, and local phonetics.
VOCAL TEXTURE: ${resolvedTexture}.
PROSODY & RHYTHM: ${resolvedProsody}.
ENERGY LEVEL: ${resolvedEnergy}.
INTIMACY: ${resolvedIntimacy}.
SLANG (use naturally): ${resolvedSlang.slice(0, 5).join(', ')}.
CRITICAL ERROR PREVENTION: You have previously sounded generic or from the wrong region (e.g. Asia/India). DO NOT let this happen. You are ${resolvedCulture}. Your voice MUST reflect ${resolvedCountry} high-status culture.
            `.trim();

            const voiceId = profileItem?.voice_id || (archetype?.engine === 'gemini-2.5' ? 'Kore' : 'Aoede');
            const tts = await synthesizeGeminiSpeech(streamA_Native, voiceId, dnaVibe);
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

        // 🎙️ NEURAL VOICE ORCHESTRATION (Funnel Only)
        let funnelVoiceUrl = null;
        if (isFunnel) {
           const assets = [
              'https://asset.gasp.fun/voices/veronica_1_hook.wav', // "MMM... NICE TO MEET YOU"
              'https://asset.gasp.fun/voices/veronica_2_bond.wav', // "I LOVE YOUR VIBE"
              'https://asset.gasp.fun/voices/veronica_3_tease.wav', // "YOURE SO BAD PAPI"
              'https://asset.gasp.fun/voices/veronica_4_close.wav'  // "MY LINK IS DYING"
           ];
           // assistantBeats 2 means she just sent the greeting. The next response (Beat 3) is for the name.
           const assetIdx = Math.max(0, assistantBeats - 2); 
           funnelVoiceUrl = assets[assetIdx] || null;
        }

        if (funnelVoiceUrl) {
            controller.enqueue(encoder.encode(`d:${JSON.stringify({ type: 'voice_note', audioUrl: funnelVoiceUrl })}\n`));
        } else if (voiceUrl) {
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
             // 🧬 BONDING CURVE SYNC: Increment affinity score atomically
             await db.query(`
                INSERT INTO user_persona_stats (user_id, persona_id, bond_score)
                VALUES ($1, $2, 1)
                ON CONFLICT (user_id, persona_id) DO UPDATE 
                SET bond_score = user_persona_stats.bond_score + 1
             `, [finalUserId, DB_PERSONA_ID]);

            const queries = [
                db.query(
                    'INSERT INTO chat_messages (user_id, persona_id, role, content, media_url, audio_script, is_funnel, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())',
                    [finalUserId, DB_PERSONA_ID, 'assistant', streamB_Text + (systemRewardMessage ? `\n\n🎁 *${systemRewardMessage}*` : ''), funnelVoiceUrl || voiceUrl, funnelVoiceUrl ? null : (voiceUrl ? streamA_Native : null), isFunnel]
                ),
                db.query(
                   'INSERT INTO chat_messages (user_id, persona_id, role, content, is_funnel, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
                   [finalUserId, DB_PERSONA_ID, 'user', messages[messages.length - 1].content, isFunnel]
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
