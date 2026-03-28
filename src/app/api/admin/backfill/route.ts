import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { rows: personas } = await db.query('SELECT * FROM personas');
    
    const results = [];
    for (const p of personas) {
      // Basic heuristic for tags if they are missing
      const tags = [
         p.race, 
         p.city, 
         p.country, 
         p.body_type, 
         p.personality,
         p.culture
      ].filter(t => t && t !== 'undefined' && t !== 'null').map(t => t.toLowerCase());
      
      try {
        await db.query('UPDATE personas SET tags = $1 WHERE id = $2', [tags, p.id]);
        results.push({ id: p.id, success: true });
      } catch (upErr: any) {
        results.push({ id: p.id, success: false, error: upErr.message });
      }
    }

    return NextResponse.json({ success: true, results, message: 'Backfill complete on Railway.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
