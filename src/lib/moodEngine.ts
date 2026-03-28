import { db } from './db';

export type PersonaMood = 'bored' | 'toxic' | 'teasing' | 'vulnerable' | 'affectionate';

export async function getMoodState(userId: string, personaId: string) {
  // 🛡️ SOVEREIGN STATS: Fetch user_persona_stats from Railway
  const { rows: statsRows } = await db.query(
    'SELECT * FROM user_persona_stats WHERE user_id = $1 AND persona_id = $2 LIMIT 1',
    [userId, personaId]
  );
  const stats = statsRows[0];

  const { rows: personas } = await db.query(
    'SELECT vibe, system_prompt FROM personas WHERE id = $1 LIMIT 1',
    [personaId]
  );
  const persona = personas[0];

  if (!persona) {
    return { mood: 'bored' as PersonaMood, dna: 'Unknown persona' };
  }

  // Logic: 
  // Use 'vibe' as a proxy for mood if current_global_mood is missing
  const mood = (persona.vibe?.includes('teasing') ? 'teasing' : 'bored') as PersonaMood;

  // 3. If bond_score < 10, lean heavily toward 'bored' or 'toxic'
  if (!stats || (parseInt(stats.bond_score || '0', 10)) < 10) {
    const coinFlip = Math.random() > 0.5;
    return { mood: (coinFlip ? 'toxic' : 'bored') as PersonaMood, dna: persona.system_prompt };
  }

  // 4. Otherwise, use what we have
  return { 
    mood, 
    dna: persona.system_prompt 
  };
}


