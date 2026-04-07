import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 🛡️ SYNDICATE UNLOCKED: Fetch every single persona managed in the admin (No 'is_active' filter)
    const { rows: dbPersonas } = await db.query(`
        SELECT * FROM personas 
        ORDER BY id DESC
    `);

    // 🧬 HUMANIZATION PROTOCOL: Ensure everyone has a high-status human status
    const cleanPersonas = (dbPersonas || []).map((p: any) => {
        const technicalPrompts = ['HAIR', 'LACE', 'STYLE', 'PROMPT', 'SYNDICATE', 'SYNCING'];
        const isTechnical = technicalPrompts.some(term => (p.status || '').toUpperCase().includes(term));
        
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
