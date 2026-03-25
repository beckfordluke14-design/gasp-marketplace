import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: Request) {
  try {
    const ip_address = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const user_agent = req.headers.get('user-agent') || 'unknown';

    const { error } = await supabase.from('consent_logs').insert([{
      ip_address,
      user_agent,
      site_version: 'v77.1_gasp_fun'
    }]);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Consent Log Error]:', error.message);
    // Silent fail for user conversion
    return NextResponse.json({ success: false, error: 'Log failed but entry permitted' }, { status: 200 });
  }
}



