import { initialProfiles } from '@/lib/profiles';
import { db } from '@/lib/db';
import * as SOV from '@/lib/sovereign';
import { retrieveMemories, getEmbedding } from '@/lib/memory';

export const dynamic = 'force-dynamic';

const VERONICA_ASSETS = [
  'https://asset.gasp.fun/voices/veronica_1_hook.wav',  // Beat 1: Hook
  'https://asset.gasp.fun/voices/veronica_2_bond.wav',  // Beat 2: Building Trust
  'https://asset.gasp.fun/voices/veronica_3_tease.wav', // Beat 3: The Tease
  'https://asset.gasp.fun/voices/veronica_4_close.wav' // Beat 4: The Closer
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, userId, userName } = body;
    
    const finalUserId = userId || 'ANON_FUNNEL';
    const normalizedUserId = finalUserId.trim();
    const displayUserName = userName || 'Luke';
    const assistantBeats = messages.filter((m: any) => m.role === 'assistant').length;

    // 🧬 CONTEXTUAL BRAIN FOR VERONICA
    let userMemories = "";
    try {
        const lastUserMsg = messages[messages.length - 1]?.content;
        if (lastUserMsg) {
            const embedding = await getEmbedding(lastUserMsg);
            if (embedding) {
                const memories = await retrieveMemories(normalizedUserId, 'veronica-medellin-locked', embedding);
                if (memories.length > 0) userMemories = memories.join('\n- ');
            }
        }
    } catch (e) { console.error('[Funnel Memory Fail]:', e); }

    const brainPrompt = `
You are Veronica, a 23-year-old from Medellín. 
- You are flirty, bold, and naturally curious. 
- Text like a real girl: lowercase, short messages, emojis (😭, 🙈, 🌶️).
- CALL HIM "${displayUserName}" or "amor" naturally. No generic bot talk.

[MEMORIES]: ${userMemories || "New user."}

[CURRENT PHASE]: ${
      assistantBeats === 1 ? `Response to Name. Say "nice to meet u ${displayUserName}!!" and ask what he's up to right now.` :
      assistantBeats === 2 ? `The Bond. Tell him you have a feeling about him. Use slang like "pues" or "mor". Ask him what his biggest ambition is.` :
      assistantBeats === 3 ? `The Tease. He's making you distracted. Tell him you want to show him something but you're not sure if he's ready.` :
      "The Closer. Tell him your connection/link is dying fast and he MUST check your private vault archive right now before he loses u. Be urgent and breathless."
    }

Respond in JSON: { "text_message": "..." }
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
                ...messages.slice(-10)
            ],
            response_format: { type: "json_object" }
        })
    });

    const orResult = await orResponse.json();
    if (orResult.error) {
       console.error('[OpenRouter Error]:', orResult.error);
       throw new Error('Brain disconnect');
    }
    const rawContent = orResult.choices?.[0]?.message?.content || "";
    let streamB_Text = "hey... give me a sec 🙈";
    try {
        const parsed = JSON.parse(rawContent);
        streamB_Text = parsed.text_message || streamB_Text;
    } catch(e) {
        streamB_Text = rawContent.trim() || streamB_Text;
    }

    // 🚀 CHAT PERSISTENCE
    try {
        await db.query(
            'INSERT INTO chat_messages (user_id, persona_id, role, content, is_funnel, created_at) VALUES ($1, $2, $3, $4, TRUE, NOW())',
            [normalizedUserId, 'veronica-medellin-locked', 'assistant', streamB_Text]
        );
        await db.query(
            'INSERT INTO chat_messages (user_id, persona_id, role, content, is_funnel, created_at) VALUES ($1, $2, $3, $4, TRUE, NOW())',
            [normalizedUserId, 'veronica-medellin-locked', 'user', messages[messages.length - 1].content]
        );
    } catch (dbErr) { console.error('[Funnel DB Fail]:', dbErr); }

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        // Text message
        controller.enqueue(encoder.encode(`0:${JSON.stringify(streamB_Text)}\n`));
        
        // Voice message (Pre-recorded)
        const assetIdx = Math.max(0, assistantBeats - 2);
        const voiceUrl = VERONICA_ASSETS[assetIdx] || null;
        if (voiceUrl) {
            controller.enqueue(encoder.encode(`d:${JSON.stringify({ type: 'voice_note', audioUrl: voiceUrl })}\n`));
        }
        
        controller.close();
      }
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });

  } catch (err: any) {
    console.error('[Funnel API Error]:', err);
    return new Response(err.message, { status: 500 });
  }
}
