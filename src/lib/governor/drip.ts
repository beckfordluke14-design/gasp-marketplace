import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/**
 * SYSTEM 1: THE INFORMATION DRIP (Dynamic Prompting)
 * Identifies missing baseline facts about the user and injects strategic goals.
 */
export async function getMissingFactsGoal(userId: string, personaId: string) {
  try {
    const { data: memories } = await supabase
      .from('persona_memories')
      .select('memory_text')
      .eq('user_id', userId)
      .eq('persona_id', personaId);

    const factText = (memories || []).map(m => m.memory_text.toLowerCase()).join(' ');
    
    // Check for baseline gaps
    const missing: string[] = [];
    if (!factText.includes('age')) missing.push('age');
    if (!factText.includes('name')) missing.push('name');
    if (!factText.includes('hometown') && !factText.includes('live')) missing.push('hometown');

    if (missing.length === 0) return "";

    // Pick the easiest one to ask casually
    const target = missing[0];
    const prompts: Record<string, string> = {
      'age': "Strategic Goal: You do not know the user's age. At the end of your next message, casually ask how old they are. Use lowercase slang (e.g. 'wait how old r u?'). Do not ask more than one question.",
      'name': "Strategic Goal: You don't know their real name yet. Casualy ask for it at the end. (e.g. 'wait what's ur name anyway?')",
      'hometown': "Strategic Goal: You don't know where they stay. Ask for their city/hometown (e.g. 'where u stay at?')."
    };

    return prompts[target] || "";

  } catch (err) {
    return "";
  }
}

/**
 * SYSTEM 3: SPONTANEOUS PING (Daylight Check)
 * Enforces local persona daylight hours for re-engagement.
 */
export function isDaylightHours(hour: number) {
  // daylight hours (e.g. 10 AM - 9 PM)
  return hour >= 10 && hour <= 21;
}


