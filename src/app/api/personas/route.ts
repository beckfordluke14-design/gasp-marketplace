import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ✅ Service role key bypasses RLS — safe for server-side only
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export async function GET() {
  try {
    const { data: personas, error } = await supabase
      .from('personas')
      .select('id, name, city, country, flag, age, skin_tone, vibe, syndicate_zone, seed_image_url, is_active, status, system_prompt')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

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
