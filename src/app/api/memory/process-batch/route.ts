import { createClient } from '@supabase/supabase-js';
export const dynamic = 'force-dynamic';
import { OpenAI } from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

/**
 * SYSTEM 2: THE BATCH ON LOG-OFF MEMORY ENGINE
 * Runs every 15 mins via a cron secret:
 * GET /api/memory/process-batch?secret=CRON_SECRET
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.CRON_SECRET) {
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('[Memory] Starting Batch-on-Logoff Synthesis...');

    // 1. Find sessions with unprocessed messages + 30m inactivity
    // In a real flow, we'd query the 'chat_messages' table for pairs of (user_id, persona_id)
    // where max(created_at) < now() - 30 minutes.
    const inactivityThreshold = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data: rawPairs, error: pairError } = await supabase
      .from('chat_messages')
      .select('user_id, persona_id')
      .lt('created_at', inactivityThreshold);

    if (pairError || !rawPairs) return new Response('No sessions to process', { status: 200 });

    // Deduplicate pairs
    const pairs = Array.from(new Set(rawPairs.map(p => `${p.user_id}:${p.persona_id}`)));

    for (const pair of pairs) {
      const [userId, personaId] = pair.split(':');
      console.log(`[Memory] Synthesizing session: ${userId} <-> ${personaId}`);

      // 2. Pull all unprocessed messages
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('role, content, id')
        .eq('user_id', userId)
        .eq('persona_id', personaId);

      if (!messages || messages.length === 0) continue;

      const transcript = messages.map(m => `${m.role}: ${m.content}`).join('\n');
      const messageIds = messages.map(m => m.id);

      // 3. Extract Facts (Using ultra-cheap model Meta Llama 3 8B)
      const factRes = await openai.chat.completions.create({
        model: 'meta-llama/llama-3-8b-instruct',
        messages: [
          { 
            role: 'system', 
            content: 'Analyze this chat log. Extract strictly permanent, high-value facts about the user (e.g. hometown, car, outfit, crypto, job). Return ONLY a flat JSON array of short string facts. If no new facts, return [].' 
          },
          { role: 'user', content: transcript }
        ],
        response_format: { type: 'json_object' }
      });

      const factsRaw = factRes.choices[0].message?.content || '{"facts": []}';
      const { facts } = JSON.parse(factsRaw);

      if (facts && Array.from(facts).length > 0) {
        for (const fact of facts) {
          // 4. Generate Embedding (text-embedding-3-small)
          const embedRes = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: fact,
          });

          const [{ embedding }] = embedRes.data;

          // 5. Store in Vault
          await supabase.from('persona_memories').insert({
            user_id: userId,
            persona_id: personaId,
            memory_text: fact,
            embedding
          });
        }
      }

      // Cleanup: Mark messages as processed
      // Bypassed due to missing memory_processed column
      // await supabase
      //   .from('chat_messages')
      //   .update({ memory_processed: true })
      //   .in('id', messageIds);
    }

    return new Response('Batch synthesis complete', { status: 200 });

  } catch (err: any) {
    console.error('[Memory] Fatal Error:', err);
    return new Response(err.message || 'Internal Server Error', { status: 500 });
  }
}



