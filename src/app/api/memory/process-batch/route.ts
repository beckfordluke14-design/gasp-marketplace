import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

/**
 * SYSTEM 2: THE BATCH ON LOG-OFF MEMORY ENGINE
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.CRON_SECRET) {
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('[Memory] Starting Batch-on-Logoff Synthesis...');

    const inactivityThreshold = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { rows: rawPairs } = await db.query(
      'SELECT DISTINCT user_id, persona_id FROM chat_messages WHERE created_at < $1',
      [inactivityThreshold]
    );

    if (!rawPairs || rawPairs.length === 0) return new Response('No sessions to process', { status: 200 });

    for (const pair of rawPairs) {
      const { user_id: userId, persona_id: personaId } = pair;
      console.log(`[Memory] Synthesizing session: ${userId} <-> ${personaId}`);

      const { rows: messages } = await db.query(
        'SELECT role, content, id FROM chat_messages WHERE user_id = $1 AND persona_id = $2',
        [userId, personaId]
      );

      if (!messages || messages.length === 0) continue;

      const transcript = messages.map(m => `${m.role}: ${m.content}`).join('\n');

      const factRes = await openai.chat.completions.create({
        model: 'meta-llama/llama-3-8b-instruct',
        messages: [
          { 
            role: 'system', 
            content: 'Analyze this chat log. Extract strictly permanent, high-value facts about the user (e.g. hometown, car, outfit, crypto, job). Return ONLY a flat JSON object with a "facts" field as an array of short string facts. If no new facts, return {"facts": []}.' 
          },
          { role: 'user', content: transcript }
        ]
      });

      const factsRaw = factRes.choices[0].message?.content || '{"facts": []}';
      let facts = [];
      try {
        const parsed = JSON.parse(factsRaw);
        facts = parsed.facts || [];
      } catch (e) {
        console.error('[Memory] JSON Parse Failure:', factsRaw);
      }

      if (facts && facts.length > 0) {
        for (const fact of facts) {
          // Store fact in the sovereign vault
          await db.query(`
            INSERT INTO persona_memories (user_id, persona_id, memory_text, created_at)
            VALUES ($1, $2, $3, NOW())
          `, [userId, personaId, fact]);
        }
      }
    }

    return new Response('Batch synthesis complete', { status: 200 });

  } catch (err: any) {
    console.error('[Memory] Fatal Error:', err);
    return new Response(err.message || 'Internal Server Error', { status: 500 });
  }
}



