import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET() {
  try {
    const { data: personas, error: fetchErr } = await supabase.from('personas').select('*');
    if (fetchErr) throw fetchErr;

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
      
      const { error: upErr } = await supabase.from('personas').update({ tags }).eq('id', p.id);
      results.push({ id: p.id, success: !upErr, error: upErr?.message });
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
