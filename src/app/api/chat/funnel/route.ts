import { db } from '@/lib/db';
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

Respond with only your message text.
`;

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
                ...messages.slice(-10)
            ],
            stream: true,
        })
    });

    if (!orResponse.ok) throw new Error(`Brain offline: ${orResponse.status}`);

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const reader = orResponse.body?.getReader();

    const readable = new ReadableStream({
      async start(controller) {
        let fullContent = "";
        let buffer = "";

        // 🚀 PERSIST USER MESSAGE IMMEDIATELY
        try {
            await db.query(
                'INSERT INTO chat_messages (user_id, persona_id, role, content, is_funnel, created_at) VALUES ($1, $2, $3, $4, TRUE, NOW())',
                [normalizedUserId, 'veronica-medellin-locked', 'user', messages[messages.length - 1].content]
            );
        } catch (e) {}

        while (true) {
            const { done, value } = await reader!.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const cleanLine = line.replace(/^data: /, '').trim();
                if (!cleanLine || cleanLine === '[DONE]') continue;

                try {
                    const json = JSON.parse(cleanLine);
                    const delta = json.choices[0]?.delta?.content || "";
                    if (delta) {
                        fullContent += delta;
                        controller.enqueue(encoder.encode(`0:${JSON.stringify(fullContent)}\n`));
                    }
                } catch (e) {}
            }
        }

        // 🎙️ ATTACH VOICE ASSET & PERSIST ASSISTANT REPLY
        const voiceUrl = VERONICA_ASSETS[Math.min(assistantBeats, VERONICA_ASSETS.length - 1)];
        if (voiceUrl) {
            controller.enqueue(encoder.encode(`d:${JSON.stringify({ type: 'voice_note', audioUrl: voiceUrl })}\n`));
        }

        try {
            await db.query(
                'INSERT INTO chat_messages (user_id, persona_id, role, content, media_url, is_funnel, created_at) VALUES ($1, $2, $3, $4, $5, TRUE, NOW())',
                [normalizedUserId, 'veronica-medellin-locked', 'assistant', fullContent, voiceUrl]
            );
        } catch (e) {}

        controller.close();
      }
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });

  } catch (err: any) {
    console.error('[Funnel Flush Error]:', err);
    const encoder = new TextEncoder();
    return new Response(new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`0:${JSON.stringify("hey... u there? my connection is acting crazy 😭")}\n`));
        controller.close();
      }
    }), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
}
