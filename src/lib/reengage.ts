import { db } from '@/lib/db';
import { initialPersonas } from './profiles';
import { getEnvironmentContext } from './governor';
import { isDaylightHours } from './governor/drip';
import { sendNudgeEmail } from './emails';

/**
 * SYSTEM 3: SPONTANEOUS PING & RE-ENGAGEMENT LOOP
 */
export async function runSpontaneousPingWorker() {
  console.log('[Governor] Searching for ghosting events in daylight zones...');

  // 1. Query active / recent session durations from Railway
  const { rows: sessions } = await db.query(
    'SELECT * FROM chat_sessions ORDER BY last_message_at DESC'
  );

  if (!sessions || sessions.length === 0) return;

  const now = new Date();

  for (const session of sessions) {
    const p = initialPersonas.find(p => p.id === session.persona_id);
    if (!p) continue;

    // SYSTEM 3: DAYLIGHT GATE
    const context = await getEnvironmentContext(p.city);
    if (!isDaylightHours(context.rawHour)) {
        console.log(`[Governor] Skipping ${p.name} - outside daylight hours (${context.rawHour}:00)`);
        continue;
    }

    const lastMsgTime = new Date(session.last_message_at);
    const diffMs = now.getTime() - lastMsgTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    // SYSTEM 3: RANDOMIZED 2-4 HOUR SPONTANEOUS PING
    const targetHours = 2 + Math.random() * 2; // Randomized window
    
    if (diffHours >= targetHours && diffHours < 5) {
      console.log(`[Governor] SPONTANEOUS PING triggered for ${p.name} -> ${session.user_id}`);
      await triggerSpontaneousPing(session, p);
    }
    
    // SYSTEM 4: 24-Hour Vault Tease
    if (diffHours >= 24) {
      console.log(`[Governor] 24h Vault Tease triggered for ${p.name}`);
      await triggerVaultTease(session, p);
    }
  }
}

async function triggerSpontaneousPing(session: any, persona: any) {
  const vibes = [
    "so bored rn",
    "what u doing?", 
    "u got pics? let me see u",
    "thinking about u mmm",
    "u went ghost on me parce lol"
  ];
  
  const ping = vibes[Math.floor(Math.random() * vibes.length)];
  
  // 🛡️ IDENTITY PULSE: Fetch user email from ledger (Railway)
  const { rows: profiles } = await db.query(
    'SELECT email FROM profiles WHERE id = $1 LIMIT 1',
    [session.user_id]
  );
  const profile = profiles[0];

  if (profile?.email) {
    console.log(`[Governor] TRIGGERING EMAIL NUDGE: ${profile.email} (via ${persona.name})`);
    await sendNudgeEmail(profile.email, persona.name, ping);
  }

  // Insert into Chat History in Railway
  await db.query(`
    INSERT INTO chat_messages (session_id, user_id, persona_id, role, content, created_at)
    VALUES ($1, $2, $3, 'assistant', $4, NOW())
  `, [session.id, session.user_id, persona.id, ping]);
 
  console.log(`[Governor] SENT IN-APP: ${ping} by ${persona.name}`);
}

async function triggerVaultTease(session: any, p: any) {
  if (!p.vault || p.vault.length === 0) return;
  const item = p.vault[Math.floor(Math.random() * p.vault.length)];
  
  await db.query(`
    INSERT INTO chat_messages (session_id, user_id, persona_id, role, content, image_url, created_at)
    VALUES ($1, $2, $3, 'assistant', 'was gonna show u this but u quiet 🤫', $4, NOW())
  `, [session.id, session.user_id, p.id, item.blurred_url]);
}


