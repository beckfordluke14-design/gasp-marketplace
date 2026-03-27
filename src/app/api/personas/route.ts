import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ✅ Service role key bypasses RLS — safe for server-side only
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const showAll = searchParams.get('all') === 'true'; // Admin: show even retired/inactive

  try {
    let query = supabase
      .from('personas')
      .select('id, name, city, country, flag, age, skin_tone, vibe, syndicate_zone, seed_image_url, is_active, status, system_prompt');
    
    if (!showAll) {
      query = query.eq('is_active', true);
    }
    
    const { data: personas, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[Personas API] Supabase error:', error.message);
      return NextResponse.json({ success: false, personas: [], error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, personas: personas || [] });
  } catch (e: any) {
    console.error('[Personas API] Fatal:', e.message);
    return NextResponse.json({ success: false, personas: [], error: e.message }, { status: 500 });
  }
}
