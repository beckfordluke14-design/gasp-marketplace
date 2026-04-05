import { db } from './db';

const GOOGLE_GEMINI_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

export async function storeMemory(userId: string, personaId: string, text: string, embedding: number[]) {
  try {
    await db.query(`
      INSERT INTO persona_memories (user_id, persona_id, memory_text, embedding, created_at)
      VALUES ($1, $2, $3, $4::vector, NOW())
    `, [userId, personaId, text, `[${embedding.join(',')}]`]);
    return { success: true };
  } catch (error) {
    console.error('[Memory Store Error]:', error);
    return { error };
  }
}

export async function retrieveMemories(userId: string, personaId: string, queryEmbedding: number[]) {
  try {
    // Vector Similarity Search (Cosine Distance) in Railway Postgres
    const { rows } = await db.query(`
      SELECT memory_text, (embedding <=> $3::vector) as distance
      FROM persona_memories
      WHERE user_id = $1 AND persona_id = $2
      ORDER BY embedding <=> $3::vector
      LIMIT 3
    `, [userId, personaId, `[${queryEmbedding.join(',')}]`]);
    return rows.filter(r => (r.distance || 1) < 0.5).map(r => r.memory_text);
  } catch (error) {
    console.error('[Memory Retrieval Error]:', error);
    return [];
  }
}

/**
 * SHARED INTELLIGENCE: Pulls memories from ANY persona for this user.
 * Allows "Gossip" or cross-persona awareness.
 */
export async function retrieveGlobalMemories(userId: string, queryEmbedding: number[], currentPersonaId: string) {
  try {
    const { rows } = await db.query(`
      SELECT memory_text, persona_id, (embedding <=> $2::vector) as distance
      FROM persona_memories
      WHERE user_id = $1 AND persona_id != $3
      ORDER BY embedding <=> $2::vector
      LIMIT 2
    `, [userId, `[${queryEmbedding.join(',')}]`, currentPersonaId]);
    
    return rows
        .filter(r => (r.distance || 1) < 0.5)
        .map(r => `(Heard via ${r.persona_id}): ${r.memory_text}`);
  } catch (error) {
    console.error('[Global Memory Retrieval Error]:', error);
    return [];
  }
}

export async function getEmbedding(text: string): Promise<number[] | null> {
    try {
        const embedUrl = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GOOGLE_GEMINI_KEY}`;
        const embedRes = await fetch(embedUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: { parts: [{ text }] } })
        });
        const embedData = await embedRes.json();
        return embedData.embedding?.values || null;
    } catch (err) {
        console.error('[Memory] Embedding Failure:', err);
        return null;
    }
}

/**
 * SYSTEM 2: THE LONG-TERM BRAIN (Memory Summarization)
 */
export async function summarizeAndStore(messages: any[], userId: string, personaId: string) {
  if (messages.length < 5) return;
  if (messages.length % 5 !== 0) return;

  try {
    const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_GEMINI_KEY}`;
    const prompt = `Extract key user facts (interests, brands, personal details, relationship status). ALSO: Record any scripted things you were "made to say" via [SAY] commands so you can form an opinion on them later. Be extremely brief. format as a list. \n\nRecent context: ${JSON.stringify(messages.slice(-10))}`;


    const res = await fetch(googleUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const brainData = await res.json();
    const summary = brainData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!summary) return;

    // Generate Embedding (text-embedding-004)
    const embeddingValues = await getEmbedding(summary);
    
    if (embeddingValues) {
        await storeMemory(userId, personaId, summary, embeddingValues);
        console.log('[Memory] Deep Consciousness Updated in Railway for User:', userId);
    }
  } catch (err) {
    console.error('[Memory] Summarization Failure:', err);
  }
}
