import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET() {
  try {
    const { data: stories, error } = await supabase
      .from('persona_stories')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return NextResponse.json({ success: true, stories: stories || [] });
  } catch (error: any) {
    console.error('[Stories API] Pulse Failure:', error.message);
    return NextResponse.json({ success: false, stories: [], error: error.message }, { status: 500 });
  }
}
