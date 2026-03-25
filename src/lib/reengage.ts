import { createClient } from '@supabase/supabase-js';
import { initialPersonas } from './profiles';
import { getEnvironmentContext } from './governor';
import { isDaylightHours } from './governor/drip';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/**
 * SYSTEM 3: SPONTANEOUS PING & RE-ENGAGEMENT LOOP
 * Objective: Drive users back with randomized, daylight-aware nudges.
 * Hosted on a Cron Job (Railway/Supabase pg_cron).
 */
export async function runSpontaneousPingWorker() {
  console.log('[Governor] Searching for ghosting events in daylight zones...');

  // 1. Query active / recent session durations
  const { data: sessions, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .order('last_message_at', { ascending: false });

  if (error || !sessions) return;

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
    
    // SYSTEM 4: 24-Hour Vault Tease (Legacy logic preserved)
    if (diffHours >= 24) {
      console.log(`[Governor] 24h Vault Tease triggered for ${p.name}`);
      await triggerVaultTease(session, p);
    }
  }
}

async function triggerSpontaneousPing(session: any, persona: any) {
  // SYSTEM 3 Action: "so bored rn", "what u doing?", "u got pics? let me see u"
  const vibes = [
    "so bored rn",
    "what u doing?", 
    "u got pics? let me see u",
    "thinking about u mmm",
    "u went ghost on me parce lol"
  ];
  
  const ping = vibes[Math.floor(Math.random() * vibes.length)];

  // Insert into Chat History to trigger UI "Green Dot" or Push
  await supabase.from('chat_messages').insert({
    session_id: session.id,
    user_id: session.user_id,
    persona_id: persona.id,
    role: 'assistant',
    content: ping
  });

  // Increment 'unread' indicator if UI is configured
  console.log(`[Governor] SENT: ${ping} by ${persona.name}`);
}

async function triggerVaultTease(session: any, p: any) {
  if (!p.vault) return;
  const item = p.vault[Math.floor(Math.random() * p.vault.length)];
  
  await supabase.from('chat_messages').insert({
     session_id: session.id,
     user_id: session.user_id,
     persona_id: p.id,
     role: 'assistant',
     content: `was gonna show u this but u quiet 🤫`,
     image_url: item.blurred_url // Tease with blurred vault item
  });
}


