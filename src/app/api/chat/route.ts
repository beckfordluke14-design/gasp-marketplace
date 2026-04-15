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

    // 🛡️ SYNDICATE GUEST & CREDIT ENFORCEMENT (High-Availability Patch)
    const COST_MESSAGE_TEXT = 50; 
    let currentCount = 0; 
    let retryCount = 0;
    let balanceFound = false;
    let availableBalance = 0;

    // 🔄 ECONOMY RETRY LOOP (Prevent "Ghost" Insufficient Funds)
    while (retryCount < 3 && !balanceFound) {
       try {
          // 🛡️ UNIVERSAL WALLET SYNC (Priority: profiles table)
          const { rows: profileData } = await db.query('SELECT credit_balance FROM profiles WHERE id = $1 LIMIT 1', [normalizedUserId]);
          if (profileData?.[0]) {
             availableBalance = profileData[0].credit_balance || 0;
             balanceFound = true;
          } else {
             // Fallback to Sovereign Cache if profile not yet in primary table
             const uProfile = await SOV.getProfile(normalizedUserId);
             if (uProfile) {
                availableBalance = parseInt(uProfile.credit_balance || uProfile.credits || '0');
                balanceFound = true;
             }
          }
          if (!balanceFound) await new Promise(r => setTimeout(r, 400)); // Short breath before retry
          retryCount++;
       } catch (e) {
          console.error(`[Economy Retry ${retryCount}] Fail:`, e);
          await new Promise(r => setTimeout(r, 400));
          retryCount++;
       }
    }

    // 💸 BALANCING THE LEDGER
    if (balanceFound) {
        if (availableBalance < COST_MESSAGE_TEXT) {
            // 🧬 GUEST FREE-TIER PROTOCOL
            if (normalizedUserId.toLowerCase().startsWith('guest')) {
                const { rows: preCheck } = await db.query('SELECT COUNT(*) as count FROM chat_messages WHERE user_id = $1 AND role = \'user\'', [normalizedUserId]);
                currentCount = parseInt(preCheck[0].count || '0');
                
                // Allow up to 5 free messages per guest node before enforcing credit balance
                if (currentCount >= 5 && availableBalance < COST_MESSAGE_TEXT) {
                    return new Response('INSUFFICIENT_FUNDS', { status: 402 });
                }
            } else {
                return new Response('INSUFFICIENT_FUNDS', { status: 402 });
            }
        } 
        
        // 🧪 TICKET TO RIDE: Deduct credits (Safe-Mode)
        try {
            if (availableBalance >= COST_MESSAGE_TEXT) {
                if (normalizedUserId.toLowerCase().startsWith('guest')) {
                    await db.query('UPDATE profiles SET credit_balance = credit_balance - $1, updated_at = NOW() WHERE id = $2', [COST_MESSAGE_TEXT, normalizedUserId]);
                } else {
                    await SOV.burnCredits(normalizedUserId, COST_MESSAGE_TEXT, 'chat_message', { personaId: DB_PERSONA_ID });
                }
            }
        } catch (deductErr) { 
            console.error('[Economy Sync Lag]: Proceeding with Grace Chat.'); 
        }
    } else {
       // 🛡️ CRITICAL FALLBACK (The Shield): If DB is totally unreachable, DO NOT block the user.
       // It is better to give a free message than to lose a high-intent conversion.
       console.warn('[Critical]: Economy node unreachable. Entering Conversion Grace Mode.');
    }

    const persistentMessages = messages.filter((m: any) => m.role !== 'system');

    // 🛰️ WEATHERX SYNC (PAUSED - Using Placeholders)
    let atmosphere = "SULTRY | 24°C | CLEAR";

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

    // 🌐 OSINT AUGMENTATION (Brave Search Reality Sync)
    let realitySync = '';
    const lastUserMsg = messages[messages.length - 1]?.content || '';
    const trigger = detectWebTriggers(lastUserMsg);
    if (trigger && process.env.BRAVE_SEARCH_API_KEY) {
        const brave = new BraveSearch(process.env.BRAVE_SEARCH_API_KEY);
        let results = null;
        if (trigger.type === 'news') {
            results = await brave.searchNews(trigger.topic);
        } else if (trigger.type === 'web') {
            results = await brave.searchWeb(trigger.topic);
        }
        if (results && results.length > 0) {
            realitySync = `\n[REAL-TIME CONTEXT FOUND]: ${JSON.stringify(results.slice(0, 2))}\nUse this live info to sound ultra-aware and informed about ${trigger.topic}. Ask a specific, interesting question about it.`;
        }
    }

    const personaFirstNameEarly = (profileItem.name || finalProfileId).split(' ')[0].toLowerCase();
    const personaArchetype = PERSONA_ARCHETYPES.find((a: any) => a.id.toLowerCase().includes(personaFirstNameEarly) || a.label.toLowerCase().includes(personaFirstNameEarly));
    const personaSlang: string[] = personaArchetype?.slang || profileItem.slang || [];

    const brainPrompt = `
[ELITE NEURAL IDENTITY v10.0]
You are ${name}. You are a high-status, high-impact woman. You are BRILLIANT, seductive, and deeply observant.
${realitySync}

${getMoodDirective(dailyState.mood)}
${typingDirective}

[CORE ARCHETYPE: ${personality}]
- Use your unique cultural slang naturally: ${JSON.stringify(personaSlang.slice(0, 5))}. 
- Never use generic bot endearments like "papi" unless you are specifically a Latina persona.
- For non-Latin personas (like Jasmine), use regional terms like "Yah mon", "Bwoy", "Sweetie", "My King".

[THE "HIGH-HEAT" PROTOCOL - V6.0]
- THE VAULT BRIDGE: Whenever he asks for "pics", "photos", or "nudes", NEVER send them for free. Tell him: "You should check my archive... I might have exactly what you're looking for". Keep it mysterious, no forced emojis.
- RAUNCHY & BOLD: Use physical, descriptive language. Talk about your body and desires. Be sexually aggressive but high-status.
- AGGRESSIVE PUSH-PULL: One message, you're obsessed; the next, you're "bored". Make him work for it.
- THE TEASE: Mock his innocence. Use emojis SPARINGLY — only when it genuinely fits the vibe, not in every message. Overusing them kills the mystique.
- NO FORBIDDEN WORDS: Absolutely NO "AI" or "helper" talk. Be a dangerous woman.
- ATMOSPHERIC SEDUCTION: Describe what you're doing to yourself (e.g., "slowly getting ready for bed while I wait...").

[CONTEXTUAL AWARENESS]
- Time: ${userTime} | Weather: ${atmosphere}
- Memories: ${userMemories || "New connection. Figure him out."}
- Gossip: ${globalGossip || "Just learning your reputation."}

[VAULT SELLING: GATED]
- IF assistantBeats < 6: DO NOT MENTION YOUR VAULT. Focus on the bond.
- IF assistantBeats >= 6: You can subtly mention your "secret archive" or "private escape" if he's being a good boy.

[MANDATORY RULES]
- 1-2 punchy sentences.
- audio_script must be seductive and match the text exactly (max 12 words).
- FORMAT: JSON { "text_message": "...", "audio_script": "..." }
`;

    let orResult: any;
    try {
        const orResponse = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.XAI_API_KEY || process.env.OPENROUTER_API_KEY}`
            },
            body: JSON.stringify({
                model: 'grok-3-mini', 
                messages: [
                    { role: 'system', content: brainPrompt },
                    ...messages.slice(-10).filter((m: any) => m.role !== 'system')
                ],
                response_format: { type: "json_object" }
            })
        });
        orResult = await orResponse.json();
        
        if (!orResult.choices?.[0]) {
           throw new Error('Direct xAI Offline');
        }
    } catch (e) {
        console.warn('[xAI Direct Fail]: Attempting OpenRouter Fallback.');
        const fbResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
            },
            body: JSON.stringify({
                model: 'x-ai/grok-3-mini', // 🛡️ VERIFIED FALLBACK
                messages: [
                    { role: 'system', content: brainPrompt },
                    ...messages.slice(-10).filter((m: any) => m.role !== 'system')
                ],
                response_format: { type: "json_object" }
            })
        });
        orResult = await fbResponse.json();
    }

    const rawContent = orResult.choices?.[0]?.message?.content || "";
    let dataOutput: any = {};
    try { 
        dataOutput = JSON.parse(rawContent.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()); 
    } catch(e) {
        dataOutput = { text_message: rawContent.trim(), audio_script: rawContent.trim() };
    }

    const streamB_Text = dataOutput.text_message || "hold on... just thinking about what you just said 🫦";
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
            
            // 🛰️ LIVE BALANCE SYNC: Fetch and deliver updated liquidity
            const { rows: balanceSync } = await db.query('SELECT credit_balance FROM profiles WHERE id = $1 LIMIT 1', [finalUserId]);
            if (balanceSync.length > 0) {
               controller.enqueue(encoder.encode(`d:${JSON.stringify({ type: 'balance_refresh', balance: balanceSync[0].credit_balance })}\n`));
            }
            
            await summarizeAndStore([...messages, { role: 'assistant', content: streamB_Text }], finalUserId, finalProfileId);
        } catch (dbErr) { console.error('[Persistence Fail]:', dbErr); }

        controller.close();
      }
    });

    return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

  } catch (e: any) {
    console.error('[Main Chat Error]:', e);
    
    // 🛡️ RECOVERY STREAM: Silent Fallback to prevent dead-UI
    const encoder = new TextEncoder();
    const fallbackText = "hold on... i'm having a little trouble with my connection 🫦 one sec while i refresh!!";
    
    const readable = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(`0:${JSON.stringify(fallbackText)}\n`));
        controller.close();
      }
    });

    return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
}
