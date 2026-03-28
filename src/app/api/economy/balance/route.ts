import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('credit_balance')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    
    return NextResponse.json({ success: true, balance: profile?.credit_balance || 0 });
  } catch (error: any) {
    console.error('[Balance API] Pulse Failure:', error.message);
    return NextResponse.json({ success: false, balance: 0, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
    const { userId, action } = await req.json();
    if (!userId) return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });

    try {
        if (action === 'starter_claim') {
            const { data, error } = await supabase.rpc('process_spend', {
                p_user_id: userId,
                p_amount: -5000, 
                p_type: 'starter_claim',
                p_persona_id: 'system'
            });
            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }
        return NextResponse.json({ success: false, error: 'Invalid Action' }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
