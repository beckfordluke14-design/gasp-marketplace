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
    
    // 🛡️ SOVEREIGN BALANCE CHECK
    if (finalUserId && !finalUserId.startsWith('guest-')) {
        const profile = await SOV.getProfile(finalUserId);
        userBalance = profile?.credit_balance || 0;
    } else {
        // Guest user logic - strict 3-message wall (6 messages total in array)
        if (messages.length >= 6) {
           return new Response('Neural Link Depleted. Sign up to continue.', { status: 402 });
        }
        userBalance = 999; 
    }

    if (userBalance < 5 && !finalUserId.startsWith('guest-')) {
       return new Response('Insufficient Balance', { status: 402 });
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

    // 3. THE BRAIN: SYNDICATE MOMENT DIRECTOR (Grok Beta)
    const zoneKey = profileItem?.syndicate_zone || 'us_houston_black';
    const zoneDictionary = GLOBAL_SYNDICATE_ZONES_V3[zoneKey];
    
    const brainPrompt = `${MASTER_SYNDICATE_MOMENT_DIRECTOR_PROMPT}\n\nZONE DICTIONARY (${zoneKey}):\n${JSON.stringify(zoneDictionary)}\n\nMEMORY: ${memoryContext}`;

    const callGrok = () => fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://gasp.fun',
            'X-Title': 'GASP Syndicate Circuit'
        },
        body: JSON.stringify({
            model: 'x-ai/grok-3-fast',
            messages: [
                { role: 'system', content: brainPrompt },
                ...messages.slice(-5)
            ],
            response_format: { type: "json_object" }
        })
    });

    let orResponse = await callGrok();
    const brainJson = await orResponse.json();
    const contentBody = brainJson.choices?.[0]?.message?.content || "";
    const cleanContent = contentBody.replace(/```json|```/g, '').trim();
    
    let syndicateOutput;
    try {
        syndicateOutput = JSON.parse(cleanContent || '{}');
    } catch (parseErr: any) {
        console.warn('[Brain API] Output Parse Failed:', parseErr.message, cleanContent);
        syndicateOutput = { 
            text_message: "...", 
            audio_script: "...",
            translation: "..."
        };
    }
    
    const streamB_Text = syndicateOutput.text_message || "...";
    const streamA_Native = syndicateOutput.audio_script || "";
    const streamA_Translation = syndicateOutput.translation || "";

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
            
            const forceVoiceForDiscovery = isGuest && userMsgCount <= 2;
            const moodAllowsVoice = shouldSendVoiceNote(finalProfileId, streamA_Native.length);
            const sendVoice = shouldForceVoice || forceVoiceForDiscovery || moodAllowsVoice;

            if (sendVoice) {
              try {
                controller.enqueue(encoder.encode(`2:${JSON.stringify({ type: 'voice_note', audioUrl: null, profileName: profileItem?.name })}\n`));
                voiceUrl = await generatePersonaVoice(finalProfileId, streamA_Native);
                
                controller.enqueue(encoder.encode(`2:${JSON.stringify({ 
                    type: 'voice_note', 
                    audioUrl: voiceUrl, 
                    nativeScript: streamA_Native,
                    translation: streamA_Translation,
                    locked: true
                })}\n`));
              } catch (vErr: any) {
                console.warn(`[Brain API] Voice Failed: ${vErr.message}`);
              }
            }

            // 🛡️ SOVEREIGN PERSISTENCE: Fire-and-forget — NEVER block the stream
            const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();
            Promise.all([
                SOV.saveMessage(finalUserId, finalProfileId, 'user', lastUserMessage?.content || ''),
                SOV.saveMessage(finalUserId, finalProfileId, 'assistant', streamB_Text, {
                    audio_script: streamA_Native,
                    audio_translation: streamA_Translation,
                    translation_locked: true,
                    price: !!voiceUrl ? 2000 : 50,
                    type: !!voiceUrl ? 'audio' : 'text',
                    media_url: !!voiceUrl ? voiceUrl : null,
                    image_url: null
                })
            ]).catch((dbErr: any) => {
                console.warn('[Chat] DB persistence failed (non-blocking):', dbErr.message?.slice(0, 100));
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
