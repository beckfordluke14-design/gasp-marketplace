import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

const GOOGLE_GEMINI_KEY = process.env.GOOGLE_GEMINI_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function storeMemory(userId: string, personaId: string, text: string, embedding: number[]) {
  const { data, error } = await supabase.from('persona_memories').insert([{
      user_id: userId,
      persona_id: personaId,
      memory_text: text,
      embedding
  }]);
  return { data, error };
}

export async function retrieveMemories(userId: string, personaId: string, queryEmbedding: number[]) {
  const { data, error } = await supabase.rpc('match_memories', {
    query_embedding: queryEmbedding,
    match_threshold: 0.5,
    match_count: 5,
    p_user_id: userId,
    p_persona_id: personaId
  });
  return data || [];
}

/**
 * SYSTEM 2: THE LONG-TERM BRAIN (Memory Summarization)
 * 🔬 V6: ZERO-COST CIRCUIT via Gemini 1.5 Flash
 */
export async function summarizeAndStore(messages: any[], userId: string, personaId: string) {
  if (messages.length < 5) return;
  if (messages.length % 5 !== 0) return;

  try {
    const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GOOGLE_GEMINI_KEY}`;
    const prompt = `Extract key user facts (interests, brands they like, personal details, relationship status with you). Be extremely brief. format as a list. \n\nRecent context: ${JSON.stringify(messages.slice(-10))}`;

    const res = await fetch(googleUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const brainData = await res.json();
    const summary = brainData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!summary) return;

    // Generate Embedding (text-embedding-004)
    const embedUrl = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GOOGLE_GEMINI_KEY}`;
    const embedRes = await fetch(embedUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: { parts: [{ text: summary }] } })
    });
    const { embedding: embedObj } = await embedRes.json();
    
    if (embedObj?.values) {
        await storeMemory(userId, personaId, summary, embedObj.values);
        console.log('[Memory] Deep Consciousness Updated (Gemini Circuit) for User:', userId);
    }
  } catch (err) {
    console.error('[Memory] Summarization Failure:', err);
  }
}


