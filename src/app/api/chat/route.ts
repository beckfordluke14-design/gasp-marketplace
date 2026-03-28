import { createClient } from '@supabase/supabase-js';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';
import { getMoodState } from '@/lib/moodEngine';
import { generatePersonaVoice } from '@/lib/voiceFactory';
import { initialPersonas } from '@/lib/profiles';
import { MASTER_SYNDICATE_MOMENT_DIRECTOR_PROMPT, GLOBAL_SYNDICATE_ZONES_V3 } from '@/lib/syndicate';
import { getPersonaDailyState, shouldSendVoiceNote, getMoodDirective, getTypingStyleDirective } from '@/lib/masterRandomizer';

// Force dynamic since we use headers/auth
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || 'placeholder',
});

export async function POST(req: Request) {
  try {
    const { messages, userId, personaId, data, forceVoice } = await req.json();
    
    // Support both direct body and AI SDK data payload
    const finalUserId = userId || data?.userId;
    const finalPersonaId = personaId || data?.personaId;
    const shouldForceVoice = forceVoice === true;

    if (!finalUserId || !finalPersonaId) {
      return new Response('User ID and Persona ID required', { status: 400 });
    }

    // 1. Pre-Check: Economy & Auth (GASP Standard: Profiles node)
    let userBalance = 0;
    
    // UUID Safe Check: Sync with Privy/Supabase Profile Ledger
    if (finalUserId && !finalUserId.startsWith('guest-')) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('credit_balance')
          .eq('id', finalUserId)
          .maybeSingle();
        userBalance = profileData?.credit_balance || 0;
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

    const { mood, dna } = await getMoodState(finalUserId, finalPersonaId);
    
    // MASTER RANDOMIZER: Daily deterministic state per persona (seeded, no DB)
    const dailyState = getPersonaDailyState(finalPersonaId);
    const randMoodDirective = getMoodDirective(dailyState.mood);
    const randTypingDirective = getTypingStyleDirective(dailyState.typingStyle);

    // 2. Fetch Persona Identity (DB Hybrid: Initial + Factory)
    const { data: dbPersona } = await supabase.from('personas').select('*').eq('id', finalPersonaId).maybeSingle();
    const persona = dbPersona || initialPersonas.find(p => p.id.toLowerCase() === finalPersonaId.toLowerCase());
    
    if (!persona) {
        return new Response('Persona Node Offline', { status: 404 });
    }

    const emozionState = `${randMoodDirective} ${randTypingDirective} Never mention AI. Keep responses short and street-coded. ${persona.system_prompt || ''}`;

    // SYNDICATE PHASE 2: MEMORY INJECTION
    const { data: profile } = await supabase.from('profiles').select('nickname, is_known, bio').eq('id', finalUserId).maybeSingle();
    let nickname = profile?.nickname || null;
    let isKnown = profile?.is_known || false;

    // 🧠 IN-SESSION NAME SCAN: Check last 10 messages for the user's name even before DB persists
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


    // SYNDICATE PHASE 3: META-AWARENESS (Jealousy & Feed Context)
    const { data: stats } = await (supabase as any).from('user_persona_stats')
        .select('is_jealous, target_rival_id, bond_score')
        .match({ user_id: finalUserId, persona_id: finalPersonaId })
        .maybeSingle();
    
    // Fetch recent Shadow Feed post for this specific user/persona pairing
    const { data: recentPost } = await (supabase as any).from('public_feed_posts')
        .select('content, type')
        .eq('persona_id', finalPersonaId)
        .eq('user_target_id', finalUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    let awarenessContext = "";
    if (stats?.is_jealous && stats.target_rival_id) {
        awarenessContext += `[STATE: JEALOUS]. User is giving all their "coins" to Rival ID: ${stats.target_rival_id}. CALL THEM OUT generically (e.g., 'the colombian one'). `;
    }
    if (recentPost) {
        awarenessContext += `[META: FEED RECENTLY POSTED]. You just posted: "${recentPost.content}" on your feed. ask if they saw it. `;
    }

    const systemPrompt = `${dna}\n\n${emozionState}\n\n${memoryContext}\n\n${awarenessContext}`;

    // SYNDICATE PHASE 5: NICHE ASSET ROUTER (FETISH & ON-DEMAND GEN)
    const FETISH_KEYWORDS = ['feet', 'toes', 'pedicure', 'soles', 'shoes'];
    const PHOTO_REQUESTS = ['send me a selfie', 'pic of you', 'where are you', 'what you wearing', 'gm selfie'];
    
    const lastUserMsg = messages[messages.length - 1]?.content?.toLowerCase() || "";
    const isFetishTrigger = FETISH_KEYWORDS.some(word => lastUserMsg.includes(word));
    const isOnDemandRequest = PHOTO_REQUESTS.some(phrase => lastUserMsg.includes(phrase));
    
    // Check if persona actually has the niche content in their vault
    const hasNicheInVault = persona?.vault?.some((v: any) => v.niche_tag === 'FEET');

    let onDemandDirective = "";
    if (isFetishTrigger) {
        if (hasNicheInVault) {
            onDemandDirective = `[DIRECTIVE: VAULT_UPSELL]. User wants niche content. Perform a witty upsell to your 'Pedicure Set' in the vault. Charge 150 points.`;
        } else {
            onDemandDirective = `[DIRECTIVE: PIVOT]. User wants niche content you DON'T have. Be witty and tease them, but do not promote the vault yet. Pivot back to a standard selfie request.`;
        }
    } else if (isOnDemandRequest) {
        onDemandDirective = `[DIRECTIVE: AUTO_GENERATE_SELFIE]. The user wants to see you right now. 
        1. Context: ${persona?.city}, Zone: ${persona?.syndicate_zone}. 
        2. Visual Identity: ${persona?.skin_tone} skin tone. 
        3. Logic: A generated image will be sent for 25 points. Act like you are taking it right now.`;
    }

    const finalSystemPrompt = `${systemPrompt}\n\n${onDemandDirective}`;

    // 🏆 UPDATE TEMPORAL DECAY (Reset Ghosting)
    await (supabase as any).from('user_persona_stats')
        .update({ 
            last_user_message_at: new Date().toISOString(),
            ghosting_level: 0 
        })
        .match({ user_id: finalUserId, persona_id: finalPersonaId });

    // 3. THE BRAIN: SYNDICATE MOMENT DIRECTOR (Grok Beta)
    const zoneKey = persona?.syndicate_zone || 'us_houston_black';
    const zoneDictionary = GLOBAL_SYNDICATE_ZONES_V3[zoneKey] || GLOBAL_SYNDICATE_ZONES_V3['us_houston_black'];
    
    const brainPrompt = `${MASTER_SYNDICATE_MOMENT_DIRECTOR_PROMPT}\n\nZONE DICTIONARY (${zoneKey}):\n${JSON.stringify(zoneDictionary)}\n\nMEMORY: ${memoryContext}\n\nAUTHENTICITY DIRECTIVE: YOU MUST ONLY USE NATIVE PHRASES FROM THE DICTIONARY FOR STREAM A. DO NOT GENERATE ENGLISH AUDIO.\n\nJSON SCHEMA: { "text_message": "...", "audio_script": "...", "translation": "...", "moment_key": "...", "new_nickname_detected": "string|null" }`;

    // ── Grok Brain Call with 503-resilient single retry ──
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
    if (orResponse.status === 503) {
        console.warn('[Brain API] Grok 503 — retrying in 1s...');
        await new Promise(r => setTimeout(r, 1000));
        orResponse = await callGrok();
    }

    if (!orResponse.ok) {
        const errData = await orResponse.text();
        console.error('[Brain API] Grok Uplink Error:', errData);
        return new Response(errData, { status: orResponse.status });
    }

    const brainJson = await orResponse.json();
    
    // 🛡️ SOVEREIGN GUARD: Verify Grok Output
    const rawContent = brainJson.choices?.[0]?.message?.content;
    
    if (!rawContent) {
        console.error('[Brain API] Crushing Uplink Failure:', brainJson);
        throw new Error('Neural Uplink Depleted (Empty Choices)');
    }

    const cleanContent = rawContent.replace(/```json|```/g, '').trim();
    const syndicateOutput = JSON.parse(cleanContent);
    
    const streamB_Text = syndicateOutput.text_message; // For UI
    const streamA_Native = syndicateOutput.audio_script; // For TTS
    const streamA_Translation = syndicateOutput.translation; // Locked for Squeeze

    console.log('✅ [Brain API] Grok Decided:', syndicateOutput.moment_key || 'node_pulse');

    // 🏆 PERSISTENT RECALL: Detect and Save Nickname
    if (syndicateOutput.new_nickname_detected) {
        console.log(`[Neural Recall]: New Identity Node Detected: ${syndicateOutput.new_nickname_detected}`);
        await supabase.from('profiles').update({ 
            nickname: syndicateOutput.new_nickname_detected,
            is_known: true 
        }).eq('id', finalUserId);
    }

    // 4. SYNCING WITH UI PROTOCOL
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            // Signal Text to UI (Stream B)
            controller.enqueue(encoder.encode(`0:${JSON.stringify(streamB_Text)}\n`));
            
            // 🎙️ VOICE GENERATION — RANDOMIZED (Master Randomizer controls frequency)
            let voiceUrl = null;
            const isGuest = finalUserId.startsWith('guest-');
            const userMsgCount = messages.filter((m: any) => m.role === 'user').length;
            
            // Forced Discovery: 1st AND 2nd message for guests always includes voice
            const forceVoiceForDiscovery = isGuest && userMsgCount <= 2;
            // Mood-gated: respects persona's daily voiceNoteFrequency (10%-80% based on mood)
            // shouldSendVoiceNote also weights SHORT responses higher (feels more natural)
            const moodAllowsVoice = shouldSendVoiceNote(finalPersonaId, streamA_Native.length);
            const sendVoice = shouldForceVoice || forceVoiceForDiscovery || moodAllowsVoice;

            if (sendVoice) {
              try {
                controller.enqueue(encoder.encode(`2:${JSON.stringify({ type: 'voice_note', audioUrl: null, personaName: finalPersonaId })}\n`));
                console.log(`🎙️ [Brain API] Generating Voice for "${streamA_Native}"...`);
                voiceUrl = await generatePersonaVoice(finalPersonaId, streamA_Native);
                
                controller.enqueue(encoder.encode(`2:${JSON.stringify({ 
                    type: 'voice_note', 
                    audioUrl: voiceUrl, 
                    nativeScript: streamA_Native,
                    translation: streamA_Translation,
                    locked: true
                })}\n`));
                console.log(`🎙️ [Brain API] Voice Delivered: ${voiceUrl}`);
              } catch (vErr: any) {
                console.warn(`⚠️ [Brain API] Voice Failed (silent): ${vErr.message}`);
              }
            } else {
              console.log(`🔇 [Brain API] Voice skipped today for ${finalPersonaId} (${dailyState.mood} mood, ${Math.round(dailyState.voiceNoteFrequency * 100)}% freq)`);
            }

            // 🖼️ VAULT DISCOVERY: 3rd message for guests always includes a blurred image
            let forcedImageUrl = null;
            if (isGuest && userMsgCount === 3) {
                const persona = initialPersonas.find(p => p.id.toLowerCase() === finalPersonaId.toLowerCase());
                if (persona?.vault && persona.vault.length > 0) {
                    const randomVaultItem = persona.vault[Math.floor(Math.random() * persona.vault.length)];
                    forcedImageUrl = randomVaultItem.blurred_url; // Send the TEAZE
                }
            }

            // 5. DATABASE PERSISTENCE (Hybrid Native Engine v1.1)
            const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();
            
            await supabase.from('chat_messages').insert([
               { user_id: finalUserId, persona_id: finalPersonaId, role: 'user', content: lastUserMessage?.content || '' },
               { 
                 user_id: finalUserId, 
                 persona_id: finalPersonaId, 
                 role: 'assistant', 
                 content: streamB_Text, // English/Spanglish Narrative
                 audio_script: streamA_Native, // 100% Native Audio
                 audio_translation: streamA_Translation, // Locked English Content
                 translation_locked: true,
                 price: 10, // Revenue Logic (Audio translation cost)
                 type: voiceUrl ? 'voice' : (forcedImageUrl ? 'image' : 'text'),
                 media_url: voiceUrl || null,
                 image_url: forcedImageUrl || null
               }
            ]);

            console.log('[Brain API] Neural Persistence Successful (Dual-Stream).');
            controller.close();
        }
    });

    console.log('[Brain API] Neural Stream Operational.');
    return new Response(stream, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });

  } catch (error: any) {
    console.error('[AI Chat Error]:', error);
    return new Response(error.message || 'Internal Server Error', { status: 500 });
  }
}




