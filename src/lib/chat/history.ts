import { db } from '../db';

/**
 * THE CHAT CONTEXT INJECTOR (Affinity Logic)
 * Objective: Fetch history and inject VIP memory for high-status relationships.
 */
export async function getChatContext(userId: string, personaId: string) {
  console.log(`🧠 [History] Injecting Context for ${userId} <-> ${personaId}...`);

  try {
     // 1. Fetch History (Last 15-20 Messages for context window) from Railway
     const { rows: history } = await db.query(`
        SELECT role, content, created_at 
        FROM chat_messages 
        WHERE user_id = $1 AND persona_id = $2 
        ORDER BY created_at DESC 
        LIMIT 20
     `, [userId, personaId]);

     // 2. Fetch User Affinity Score (Whale Status Check) from Railway
     const { rows: statsRows } = await db.query(`
        SELECT bond_score 
        FROM user_persona_stats 
        WHERE user_id = $1 AND persona_id = $2 
        LIMIT 1
     `, [userId, personaId]);

     const affinity = parseInt(statsRows[0]?.bond_score || '0', 10);
     let vipInstruction = '';

     if (affinity >= 1000) {
        console.log(`💎 [Affinity] Whale Detected. Injecting VIP Affinity Memory.`);
        vipInstruction = `
          [Affinity Memory] The user is a VIP/Whale. They have spent significant Breathe Points on you. 
          Be appreciative and loyal but maintain your high-status persona. Do not be submissive, but show they are valued.
        `.trim();
     }

     // 3. Reverse history for chronological AI ingestion
     const contextMessages = (history || []).reverse().map(m => ({
        role: m.role,
        content: m.content
     }));

     return {
        messages: contextMessages,
        affinity,
        vipInstruction
     };

  } catch (err: any) {
     console.error('⚠️ [History] Memory Fetch Fault:', err.message);
     return { messages: [], affinity: 0, vipInstruction: '' };
  }
}


