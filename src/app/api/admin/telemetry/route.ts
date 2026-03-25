import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: Request) {
    try {
        const { event, user_id, persona_id, vibe, metadata } = await req.json();

        // 💎 DATA MINING: High-Value Handshake
        const { error } = await supabase.from('neural_telemetry').insert([{
            event_type: event,
            user_id: user_id || 'guest',
            persona_id: persona_id,
            vibe_at_time: vibe,
            metadata: metadata || {},
            created_at: new Date().toISOString()
        }]);

        if (error) {
            // Table might not exist, attempt auto-heal (God-Mode)
            if (error.code === '42P01') {
                await supabase.rpc('exec_sql', { sql: `
                  CREATE TABLE IF NOT EXISTS neural_telemetry (
                    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id text,
                    persona_id text,
                    event_type text,
                    vibe_at_time text,
                    metadata jsonb DEFAULT '{}',
                    created_at timestamptz DEFAULT now()
                  );
                `});
                // Retry once
                await supabase.from('neural_telemetry').insert([{ event_type: event, user_id, persona_id, metadata }]);
            } else throw error;
        }

        return NextResponse.json({ success: true, message: 'Neural Handshake Recorded.' });
    } catch (e: any) {
        // Silent failure to avoid log flooding
        return NextResponse.json({ success: false }, { status: 500 });
    }
}



