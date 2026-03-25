import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Need service role to bypass RLS for engine
);

export type PersonaMood = 'bored' | 'toxic' | 'teasing' | 'vulnerable' | 'affectionate';

export async function getMoodState(userId: string, personaId: string) {
  // 1. Fetch user_persona_stats (verified in factory_init.sql)
  const { data: stats, error: statError } = await supabase
    .from('user_persona_stats')
    .select('*')
    .eq('user_id', userId)
    .eq('persona_id', personaId)
    .single();

  const { data: persona, error: perError } = await supabase
    .from('personas')
    .select('vibe, system_prompt')
    .eq('id', personaId)
    .single();

  if (perError || !persona) {
    return { mood: 'bored' as PersonaMood, dna: 'Unknown persona' };
  }

  // Logic: 
  // Use 'vibe' as a proxy for mood if current_global_mood is missing
  const mood = (persona.vibe?.includes('teasing') ? 'teasing' : 'bored') as PersonaMood;

  // 3. If bond_score < 10, lean heavily toward 'bored' or 'toxic'
  if (!stats || (stats.bond_score || 0) < 10) {
    const coinFlip = Math.random() > 0.5;
    return { mood: (coinFlip ? 'toxic' : 'bored') as PersonaMood, dna: persona.system_prompt };
  }

  // 4. Otherwise, use what we have
  return { 
    mood, 
    dna: persona.system_prompt 
  };
}


