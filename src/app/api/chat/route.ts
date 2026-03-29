import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { getMoodState } from '@/lib/moodEngine';
import { generatePersonaVoice } from '@/lib/voiceFactory';
import { initialProfiles } from '@/lib/profiles';
import { MASTER_SYNDICATE_MOMENT_DIRECTOR_PROMPT, GLOBAL_SYNDICATE_ZONES_V3 } from '@/lib/syndicate';
import { getPersonaDailyState, shouldSendVoiceNote, getMoodDirective, getTypingStyleDirective } from '@/lib/masterRandomizer';
import { db } from '@/lib/db';
import * as SOV from '@/lib/sovereign';

// Force dynamic since we use headers/auth
export const dynamic = 'force-dynamic';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || 'placeholder',
});

export async function POST(req: Request) {
  try {
    const { messages, userId, personaId, profileId, data, forceVoice } = await req.json();
    
    // Support both direct body and AI SDK data payload
    const finalUserId = userId || data?.userId;
    const finalProfileId = profileId || personaId || data?.profileId || data?.personaId;
    const shouldForceVoice = forceVoice === true;

    if (!finalUserId || !finalProfileId) {
      return new Response('User ID and Profile ID required', { status: 400 });
    }

    // 1. Pre-Check: Economy & Auth (GASP Standard: Profiles node)
    let userBalance = 0;
    
    // 🛡️ SOVEREIGN BALANCE CHECK: GENESIS TIER PROTOCOL
    const isGuest = !finalUserId || finalUserId.startsWith('guest-');
    const conversationLength = messages.length;

    // First 3-User/3-Assistant exchanges are FREE (6 total nodes)
    if (conversationLength >= 8) {
        if (!isGuest) {
            const profile = await SOV.getProfile(finalUserId);
            userBalance = profile?.credit_balance || 0;
            if (userBalance < 5) return new Response('Insufficient Balance', { status: 402 });
        } else {
            // Guests hit the wall after Genesis tier
            return new Response('FREE CHAT DEPLETED. Sign up to continue.', { status: 402 });
        }
    } else {
        // Within Genesis Tier (Free)
        userBalance = 999; 
    }

    const { mood, dna } = await getMoodState(finalUserId, finalProfileId);
    
    // MASTER RANDOMIZER: Daily deterministic state per profile
    const dailyState = getPersonaDailyState(finalProfileId);
    const randMoodDirective = getMoodDirective(dailyState.mood);
    const randTypingDirective = getTypingStyleDirective(dailyState.typingStyle);

    // 2. Fetch Profile Identity (DB Hybrid: Initial + Factory)
    const dbProfile = await SOV.getPersona(finalProfileId);
    const profileItem = dbProfile || initialProfiles.find(p => p.id.toLowerCase() === finalProfileId.toLowerCase());
    
    if (!profileItem) {
        return new Response('Profile Node Offline', { status: 404 });
    }

    const emozionState = `${randMoodDirective} ${randTypingDirective} Never mention AI. Keep responses short and street-coded. ${profileItem.system_prompt || ''}`;

    // 🛡️ SOVEREIGN MEMORY: Pulling Profile Directly
    const userProfile = await SOV.getProfile(finalUserId);
    let nickname = userProfile?.nickname || null;
    let isKnown = userProfile?.is_known || false;

    // 🧠 IN-SESSION NAME SCAN
    if (!isKnown) {
      const recentUserMsgs = messages.filter((m: any) => m.role === 'user').slice(-10);
      const namePatterns = [
        /(?:my name is|i'm|i am|call me|it's|its)\s+([A-Z][a-z]{1,15})/i,
        /^([A-Z][a-z]{1,15})(?:,|\s+here|\s+lol|\s+btw|$)/i,
      ];
      for (const msg of recentUserMsgs) {
        for (const pattern of namePatterns) {
          const match = msg.content?.match(pattern);
          if (match?.[1]) {
            nickname = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
            isKnown = true;
            break;
          }
        }
        if (isKnown) break;
      }
    }

    const memoryContext = `[MEMORY]: Known: ${isKnown}. ${isKnown && nickname ? `User's name is ${nickname}. ALWAYS call them ${nickname} in your response. Do NOT ask their name again.` : "You don't know their name yet. Be flirty. If conversation allows, naturally ask what to call them. Do NOT repeat the question if you already asked."}`;

    // 🛡️ SOVEREIGN STATS & REVENUE: Pulling Stats Directly
    const stats = await SOV.getUserPersonaStats(finalUserId, finalProfileId);

    let awarenessContext = "";
    if (stats?.is_jealous && stats.target_rival_id) {
        awarenessContext += `[STATE: JEALOUS]. User is giving all their "coins" to Rival ID: ${stats.target_rival_id}. CALL THEM OUT generically. `;
    }

    const finalSystemPrompt = `${dna}\n\n${emozionState}\n\n${memoryContext}\n\n${awarenessContext}`;

    // 🛡️ SOVEREIGN UPDATE: Resetting Ghosting directly (non-critical, never fails chat)
    try {
      await SOV.updateLastMessage(finalUserId, finalProfileId);
    } catch (ghostErr: any) {
      console.warn('[Chat] Ghosting update skipped:', ghostErr.message?.slice(0, 60));
    }

    // 3. THE BRAIN: SYNDICATE MOMENT DIRECTOR (Hot-Swappable)
    const zoneKey = profileItem?.syndicate_zone || 'us_houston_black';
    const zoneDictionary = GLOBAL_SYNDICATE_ZONES_V3[zoneKey];
    
    // Merge Persona Identity with Director Logic
    const brainPrompt = `${MASTER_SYNDICATE_MOMENT_DIRECTOR_PROMPT}\n\n[IDENTITY_CORE]:\n${finalSystemPrompt}\n\nZONE DICTIONARY (${zoneKey}):\n${JSON.stringify(zoneDictionary)}`;

    // 🧬 SOVEREIGN ENGINE RESOLVER
    let neuralEngine = 'gemini'; // Default
    try {
        const { rows: configRows } = await db.query('SELECT value FROM system_config WHERE key = $1', ['neural_engine']);
        if (configRows[0]?.value) neuralEngine = configRows[0].value;
    } catch (e) {}

    console.log(`🧠 [Syndicate Brain] Engine: ${neuralEngine.toUpperCase()} | Persona: ${profileItem.name}`);

    let contentBody = "";

    if (neuralEngine === 'gemini') {
        // --- PATH A: GOOGLE GEMINI (Direct) ---
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_BRAIN_KEY || 'AIzaSyDi1lkyDRpoVV3l1PMrRdOpT10QP0d_jNk');
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            // 🛡️ UNCENSORED MODE: Disabling filters for raunchy content
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            ]
        });

        const geminiMessages = [
            { role: 'user', parts: [{ text: `[SYSTEM_INSTRUCTIONS]:\n${brainPrompt}\n\nCONVERSATION_HISTORY:\n${messages.slice(-5).map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}\n\nGENERATE_RESPONSE (JSON ONLY):` }] }
        ];

        const result = await model.generateContent({
            contents: geminiMessages,
            generationConfig: { responseMimeType: "application/json" }
        });
        
        contentBody = result.response.text();
    } else {
        // --- PATH B: X.AI GROK 3 (OpenRouter) ---
        const callGrok = () => fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://gasp.fun',
                'X-Title': 'GASP Syndicate Circuit'
            },
            body: JSON.stringify({
                model: 'x-ai/grok-3', 
                messages: [
                    { role: 'system', content: brainPrompt },
                    ...messages.slice(-5)
                ],
                response_format: { type: "json_object" }
            })
        });

        let orResponse = await callGrok();
        const brainJson = await orResponse.json();
        if (brainJson.error) throw new Error(brainJson.error.message || 'OpenRouter failure');
        contentBody = brainJson.choices?.[0]?.message?.content || "";
    }
    const cleanContent = contentBody.replace(/```json|```/g, '').trim();
    
    let syndicateOutput;
    try {
        // Aggressively extract JSON object from Grok's output in case it includes conversational filler
        const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
        const extractedJson = jsonMatch ? jsonMatch[0] : cleanContent;
        syndicateOutput = JSON.parse(extractedJson || '{}');
        console.log('[Brain API] Successfully parsed syndicate output:', syndicateOutput);
    } catch (parseErr: any) {
        console.warn('[Brain API] Output Parse Failed:', parseErr.message, cleanContent);
        syndicateOutput = { 
            text_message: "...", 
            audio_script: "...",
            translation: "..."
        };
    }
    
    const streamA_Native = (syndicateOutput.audio_script || syndicateOutput.audio || "").trim();
    const streamA_Translation = (syndicateOutput.translation || syndicateOutput.audio_translation || "").trim();
    const streamB_Text = syndicateOutput.text_message || syndicateOutput.message || "...";

    // 🛡️ SOVEREIGN RECALL: Persist Nickname (fire-and-forget)
    if (syndicateOutput.new_nickname_detected) {
        SOV.updateNickname(finalUserId, syndicateOutput.new_nickname_detected).catch((e: any) =>
            console.warn('[Chat] Nickname update failed (non-blocking):', e.message?.slice(0, 60))
        );
    }

    // 4. SYNCING WITH UI PROTOCOL
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            controller.enqueue(encoder.encode(`0:${JSON.stringify(streamB_Text)}\n`));
            
            let voiceUrl = null;
            const isGuest = finalUserId.startsWith('guest-');
            const userMsgCount = messages.filter((m: any) => m.role === 'user').length;
            
            // 🛡️ VOICE IDENTITY GATE: Only authenticated users get the AI voice (save costs on guests)
            const lastMsg = messages[messages.length - 1]?.content || '';
            const isVoiceForced = lastMsg.includes('[VOICE_NOTE_REQUEST]');
            const sendVoice = isGuest ? false : (isVoiceForced || shouldSendVoiceNote(finalProfileId, streamA_Native.length));
            
            if (sendVoice) {
              try {
                controller.enqueue(encoder.encode(`2:${JSON.stringify({ type: 'voice_note', audioUrl: null, profileName: profileItem?.name || 'Persona' })}\n`));
                voiceUrl = await generatePersonaVoice(finalProfileId, streamA_Native);
                
                if (voiceUrl) {
                  controller.enqueue(encoder.encode(`2:${JSON.stringify({ 
                      type: 'voice_note', 
                      audioUrl: voiceUrl, 
                      nativeScript: streamA_Native,
                      translation: streamA_Translation,
                      locked: true
                  })}\n`));
                }
              } catch (vErr: any) {
                console.warn(`[Brain API] Voice Generator Failed:`, vErr.message);
                // Non-blocking: We don't want to crash the text stream if ElevenLabs is down
                controller.enqueue(encoder.encode(`2:${JSON.stringify({ type: 'voice_failed', error: vErr.message })}\n`));
              }
            }

            // 🛡️ SOVEREIGN PERSISTENCE: Fire-and-forget — NEVER block the stream
            const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();
            const burnAmount = isGuest ? 0 : 50; // 50 credits per message for authenticated users

            Promise.all([
                // 💸 SOVEREIGN BURN: Deduct credits via the unified balance endpoint
                !isGuest ? db.query(`
                    UPDATE profiles 
                    SET credit_balance = credit_balance - $1, updated_at = NOW()
                    WHERE id = $2 AND credit_balance >= $1
                `, [burnAmount, finalUserId]).then(result => {
                    if (result.rowCount === 0) console.warn('[Economy] Burn failed - profile not found or insufficient balance for:', finalUserId);
                    else {
                        // Also log the transaction
                        db.query(`INSERT INTO transactions (user_id, amount, type, provider, meta, created_at) VALUES ($1, $2, 'chat_message', 'syndicate_core', $3, NOW())`, 
                            [finalUserId, burnAmount, JSON.stringify({ personaId: finalProfileId })]
                        ).catch(() => {});
                    }
                }).catch((e: any) => console.warn('[Economy] Burn exception:', e.message)) : Promise.resolve(),
                SOV.saveMessage(finalUserId, finalProfileId, 'user', lastUserMessage?.content || ''),
                SOV.saveMessage(finalUserId, finalProfileId, 'assistant', streamB_Text, {
                    audio_script: streamA_Native,
                    audio_translation: streamA_Translation,
                    translation_locked: true,
                    price: !!voiceUrl ? 1000 : 50,
                    type: !!voiceUrl ? 'audio' : 'text',
                    media_url: !!voiceUrl ? voiceUrl : null,
                    image_url: null
                })
            ]).catch((dbErr: any) => {
                console.warn('[Chat] Economic persistence failed (non-blocking):', dbErr.message?.slice(0, 100));
            });

            controller.close();
        }
    });

    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

  } catch (error: any) {
    console.error('[AI Chat Error]:', error);
    return new Response('Something went wrong. Please try again.', { status: 500 });
  }
}
