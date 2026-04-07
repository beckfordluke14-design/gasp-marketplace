import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 🛡️ SYNDICATE UNLOCKED: Fetch every single persona (No 'is_active' filter)
    const { rows: dbPersonas } = await db.query(`
        SELECT * FROM personas 
        ORDER BY created_at DESC
    `);

    // 🧬 HUMANIZATION PROTOCOL: High-status status fallbacks
    const cleanPersonas = (dbPersonas || []).map((p: any) => {
        // Since 'status' column is missing, we synthesize one for the UI
        const humanVibes = ['Bored.', 'At the gym.', 'Manhattan night.', 'Medellin morning.', 'Tokyo street.', 'Miami heat.', 'Paris vibes.', 'High-status.', 'Coffee run.', 'Working out.'];
        p.status = humanVibes[Math.floor(Math.random() * humanVibes.length)];
        return p;
    });

    return NextResponse.json({ success: true, personas: cleanPersonas || [] });
  } catch (e: any) {
    console.error('[Personas API] Fatal:', e.message);
    return NextResponse.json({ success: false, personas: [], error: e.message }, { status: 500 });
  }
}
