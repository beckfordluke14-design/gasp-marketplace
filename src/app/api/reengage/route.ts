import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runSpontaneousPingWorker } from '@/lib/reengage';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export const runtime = 'nodejs';

// GET /api/reengage?key=<CRON_SECRET>
// Called by Railway cron every 3 hours to fire re-engagement pings
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const authHeader = req.headers.get('Authorization');
  const secret = process.env.CRON_SECRET || 'secret-gasp-key';

  if (authHeader !== `Bearer ${secret}` && searchParams.get('key') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[Reengage] Spontaneous ping worker triggered...');
    await runSpontaneousPingWorker();
    return NextResponse.json({ success: true, message: 'Spontaneous ping worker fired.' });
  } catch (err: any) {
    console.error('[Reengage] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}



