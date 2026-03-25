import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '' // SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    const { data, error } = await supabase
        .from('personas')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: any) {
    console.error('[Neural Brain GET Failure]:', e.message);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { personaId, update } = await req.json();
    console.log(`[Neural Brain API] Re-Scripting Persona: ${personaId}`);

    const { error } = await supabase
        .from('personas')
        .update(update)
        .eq('id', personaId);

    if (error) throw error;
    return NextResponse.json({ success: true, message: "🏁 Brain Re-Scripted." });
  } catch (e: any) {
    console.error('[Neural Brain Failure]:', e.message);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}



