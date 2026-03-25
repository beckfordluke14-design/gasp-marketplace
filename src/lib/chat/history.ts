import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * THE CHAT CONTEXT INJECTOR (Affinity Logic)
 * Objective: Fetch history and inject VIP memory for high-status relationships.
 */
export async function getChatContext(userId: string, personaId: string) {
  console.log(`🧠 [History] Injecting Context for ${userId} <-> ${personaId}...`);

  try {
     // 1. Fetch History (Last 15-20 Messages for context window)
     const { data: history } = await supabase
        .from('chat_messages')
        .select('role, content, created_at')
        .eq('user_id', userId)
        .eq('persona_id', personaId)
        .order('created_at', { ascending: false })
        .limit(20);

     // 2. Fetch User Affinity Score (Whale Status Check)
     const { data: stats } = await supabase
        .from('user_persona_stats')
        .select('bond_score')
        .eq('user_id', userId)
        .eq('persona_id', personaId)
        .maybeSingle();

     const affinity = stats?.bond_score || 0;
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


