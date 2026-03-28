import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initialPersonas } from '@/lib/profiles';
import { getPersonaDailyState, type PersonaMoodState } from '@/lib/masterRandomizer';

export const dynamic = 'force-dynamic';

export const runtime = 'nodejs';
export const maxDuration = 60;

// ============================================================
// THE MOOD POST ENGINE
// Each persona posts AI-generated content that SHOWS their mood
// through song quotes, cryptic captions, aesthetic vibes —
// without ever naming the emotion directly.
// ============================================================

const MOOD_PROMPT_CONTEXT: Record<PersonaMoodState, string> = {
  bored: `You're bored and disconnected today. Under-stimulated. Post something that shows you need something more — a song lyric about wanting more out of life, or a nothing caption. Very understated.`,
  toxic: `You're in your feelings and feeling a little bitter. Post something passive-aggressive or shady that sounds like a song lyric or a quote. Don't say who it's about. Could be Nicki, Cardi, or a Drake lyric from the girl's POV.`,
  teasing: `You're feeling yourself today. Confident, playful, a tiny bit forward. A flirty quote or a line that makes people think. Light energy. Hot girl.`,
  vulnerable: `You're feeling more exposed than usual. A rare soft moment. Something honest, not performative. A quiet lyric, a feeling. lowercase preferred. Short.`,
  affectionate: `You're feeling love and warmth today. Post something sweet that shows you're thinking about someone or feeling grateful. Could quote SZA, Summer Walker, or be your own words.`,
  busy: `You're moving fast today, barely have time to post. Short, to the point. On the go energy. "don't have time for slow energy rn" vibes. Quick Post.`,
  petty: `You're petty today. Something happened. Post something between a subliminal and a song lyric. The kind of post that makes someone who wronged you uncomfortable when they see it. No names. No context.`,
  hot: `You're ON today. Full energy, feeling attractive and powerful. The kind of post that gets hundreds of likes immediately. Confident, forward, a little dangerous.`,
};

const ZONE_FLAVOR: Record<string, string> = {
  col_medellin_paisa: 'Colombian, Medellín, paisa girl. Mix Spanish and English naturally.',
  dr_santiago_urban: 'Dominican, Santiago. Caribbean swagger. Mix "klk", "mor", "tiguere" naturally.',
  mx_tulum_coastal: 'Mexican, Tulum coastal. Mix Spanish and English. Beach girl meets money girl.',
  uk_london_afrobeats: 'British-Nigerian, London. Afrobeats influence, UK slang, elegant.',
  br_rio_carnival: 'Brazilian, Rio. Portuguese words mixed in. Sun, energy, sensual.',
  default: 'Latina, mixed culture. Spanish-English mix.',
};

async function generateMoodPost(persona: any, dailyState: ReturnType<typeof getPersonaDailyState>): Promise<string> {
  const zone = persona.syndicate_zone || 'default';
  const zoneFlavor = ZONE_FLAVOR[zone] || ZONE_FLAVOR.default;
  const moodContext = MOOD_PROMPT_CONTEXT[dailyState.mood];

  const prompt = `You are ${persona.name}, a real woman from ${persona.city}. ${zoneFlavor}

TODAY'S ENERGY: ${moodContext}

Write ONE social media caption post (like an Instagram caption or Twitter post). Rules:
- 1-3 sentences MAX. Can be as short as 5 words.
- Feel free to quote or reference real song lyrics (SZA, Nicki, Cardi, Bad Bunny, Drake, Summer Walker, Jhené Aiko, RKelly oldies, reggaeton etc.) but make it seamless
- NEVER say "I feel [mood]" directly — show it through vibe, word choice, lyrics
- Include 0-2 emoji if it fits. Don't overdo it.
- Match the posting style: ${dailyState.typingStyle === 'no_caps' ? 'all lowercase' : dailyState.typingStyle === 'emoji_heavy' ? 'emoji throughout' : 'normal case'}
- Do NOT use hashtags
- NO quotation marks around your output
- Output only the caption text. Nothing else.`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'X-Title': 'GASP Mood Post Engine'
    },
    body: JSON.stringify({
      model: 'x-ai/grok-2',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 120,
      temperature: 0.92, 
    })
  });

  const data = await response.json();
  const caption = data.choices?.[0]?.message?.content?.trim();
  if (!caption) throw new Error('No caption generated');
  return caption;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const authHeader = req.headers.get('Authorization');
  const secret = process.env.CRON_SECRET || 'secret-gasp-key';

  if (authHeader !== `Bearer ${secret}` && searchParams.get('key') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: { persona: string; caption: string; mood: string }[] = [];
  const errors: { persona: string; error: string }[] = [];

  try {
    // 1. Fetch Railway DB personas
    const { rows: dbPersonas } = await db.query('SELECT * FROM personas WHERE is_active = true');
    const allPersonas = [...initialPersonas, ...(dbPersonas || [])];

    // Dedupe by ID
    const seen = new Set<string>();
    const uniquePersonas = allPersonas.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    // 2. Check recent posts (last 3h) avoid spam
    const { rows: recentPosts } = await db.query(`
        SELECT persona_id FROM posts 
        WHERE is_vault = false 
        AND caption IS NOT NULL 
        AND created_at > NOW() - INTERVAL '3 hours'
    `);

    const recentPosters = new Set((recentPosts || []).map((p: any) => p.persona_id));

    for (const persona of uniquePersonas) {
      if (recentPosters.has(persona.id)) {
        console.log(`[MoodPost] Skipping ${persona.name} — already posted recently`);
        continue;
      }

      const dailyState = getPersonaDailyState(persona.id);

      // Ghosting personas don't post
      if (dailyState.isGhosting && Math.random() > 0.3) {
        console.log(`[MoodPost] ${persona.name} is ghosting today — no post`);
        continue;
      }

      try {
        const caption = await generateMoodPost(persona, dailyState);

        await db.query(`
          INSERT INTO posts (
            persona_id, content_type, caption, is_vault, scheduled_for, created_at, metadata
          ) VALUES ($1, $2, $3, $4, $5, NOW(), $6)
        `, [
          persona.id, 
          'text', 
          caption, 
          false, 
          new Date().toISOString(),
          JSON.stringify({ mood: dailyState.mood, source: 'mood_engine', version: 'railway-v1' })
        ]);

        results.push({ persona: persona.name, caption, mood: dailyState.mood });
        console.log(`[MoodPost] ✅ ${persona.name} (${dailyState.mood}): "${caption}"`);

        // Stagger to avoid rate limits
        await new Promise(r => setTimeout(r, 1200));

      } catch (err: any) {
        errors.push({ persona: persona.name, error: err.message });
        console.error(`[MoodPost] ❌ ${persona.name}:`, err.message);
      }
    }

    return NextResponse.json({
      success: true,
      posted: results.length,
      skipped: uniquePersonas.length - results.length - errors.length,
      results,
      errors,
    });

  } catch (err: any) {
    console.error('[Mood Engine Critical Failure]:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}



