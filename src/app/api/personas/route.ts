import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const showAll = searchParams.get('all') === 'true';

  try {
    // 🛡️ SOVEREIGN QUERY: Pulling directly from Railway Postgres
    let queryText = `
      SELECT id, name, city, country, flag, age, skin_tone, vibe, syndicate_zone, seed_image_url, is_active, status, system_prompt, created_at
      FROM personas
    `;
    
    if (!showAll) {
      queryText += " WHERE is_active = true";
    }
    
    queryText += " ORDER BY created_at DESC";

    const { rows: personas } = await db.query(queryText);

    // 🧬 INFINITE HUMAN ENGINE: Sanitize technical prompts and randomizing vibes
    const cleanPersonas = personas.map(p => {
        const technicalPrompts = ['HAIR', 'LACE', 'STYLE', 'PROMPT', 'SYNDICATE', 'SYNCING'];
        const isTechnical = technicalPrompts.some(term => p.status?.toUpperCase().includes(term));
        
        if (!p.status || isTechnical || p.status === 'ONLINE NOW') {
            const humanVibes = [
                'Bored.', 'At the gym.', 'Manhattan night.', 'Medellin morning.',
                'Feeling the heat.', 'Dinner with friends.', 'Thinking about it.',
                'Tokyo street.', 'Seeking signal.', 'London fog.', 'Just woke up.',
                'Miami heat.', 'Paris vibes.', 'Not for you.', 'Available.',
                'High-status.', 'Coffee run.', 'Working out.', 'At home chilling.',
                'Watching the market.', 'Gym.', 'Beach day.', 'Lunch.', 'Busy.'
            ];
            p.status = humanVibes[Math.floor(Math.random() * humanVibes.length)];
        }
        return p;
    });

    return NextResponse.json({ success: true, personas: cleanPersonas || [] });
  } catch (e: any) {
    console.error('[Personas API] Fatal:', e.message);
    return NextResponse.json({ success: false, personas: [], error: e.message }, { status: 500 });
  }
}
