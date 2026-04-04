import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { rows } = await db.query('SELECT * FROM personas ORDER BY created_at DESC');
    return NextResponse.json(rows);
  } catch (e: any) {
    console.error('[Neural Brain GET Failure]:', e.message);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { personaId, update } = await req.json();
    console.log(`[Neural Brain API] Re-Scripting Persona: ${personaId}`);

    // Build dynamic UPDATE query
    const keys = Object.keys(update);
    const values = Object.values(update);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    
    await db.query(
        `UPDATE personas SET ${setClause}, updated_at = NOW() WHERE id = $${keys.length + 1}`,
        [...values, personaId]
    );

    return NextResponse.json({ success: true, message: "🏁 Brain Re-Scripted on Railway." });
  } catch (e: any) {
    console.error('[Neural Brain Failure]:', e.message);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, seed_image_url } = await req.json();
    const { rows } = await db.query(`
      INSERT INTO personas (name, seed_image_url, is_active, created_at, updated_at, city, age, description) 
      VALUES ($1, $2, true, NOW(), NOW(), 'Global', 22, 'New Persona // System Generation')
      RETURNING id
    `, [name || 'New Persona', seed_image_url]);
    return NextResponse.json({ success: true, id: rows[0].id });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}



