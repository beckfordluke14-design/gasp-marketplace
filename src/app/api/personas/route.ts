import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const showAll = searchParams.get('all') === 'true';

  try {
    // 🛡️ SOVEREIGN QUERY: Pulling directly from Railway Postgres
    let queryText = `
      SELECT id, name, city, country, flag, age, skin_tone, vibe, syndicate_zone, seed_image_url, is_active, status, system_prompt 
      FROM personas
    `;
    
    if (!showAll) {
      queryText += " WHERE is_active = true";
    }
    
    queryText += " ORDER BY created_at DESC";

    const { rows: personas } = await db.query(queryText);

    return NextResponse.json({ success: true, personas: personas || [] });
  } catch (e: any) {
    console.error('[Personas API] Fatal:', e.message);
    return NextResponse.json({ success: false, personas: [], error: e.message }, { status: 500 });
  }
}
