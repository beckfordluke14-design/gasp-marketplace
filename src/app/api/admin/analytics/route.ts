import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 📊 NEURAL ANALYTICS PULSE: Collecting 24h metrics
        const now = new Date();
        const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

        // 1. Total Event Pulses (Last 24h)
        const { count: totalEvents } = await supabase
            .from('neural_telemetry')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', past24h);

        // 2. Conversion Funnel (The Million-Dollar Funnel)
        const { data: funnelData } = await supabase
            .from('neural_telemetry')
            .select('event_type')
            .gte('created_at', past24h);
            
        const funnel = {
            app_load: funnelData?.filter(e => e.event_type === 'app_load').length || 0,
            feed_view: funnelData?.filter(e => e.event_type === 'feed_view').length || 0,
            chat_open: funnelData?.filter(e => e.event_type === 'chat_open').length || 0,
            unlock_intent: funnelData?.filter(e => e.event_type === 'vault_unlock_intent').length || 0
        };

        // 3. Top Personas (By Magnetic Pull)
        const { data: personaStats } = await supabase
            .from('neural_telemetry')
            .select('persona_id')
            .not('persona_id', 'is', null)
            .gte('created_at', past24h);

        const leaderBoard: Record<string, number> = {};
        personaStats?.forEach(s => {
            leaderBoard[s.persona_id] = (leaderBoard[s.persona_id] || 0) + 1;
        });

        const sortedLeaders = Object.entries(leaderBoard)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([id, count]) => ({ id, count }));

        return NextResponse.json({
            success: true,
            stats: {
                totalEvents,
                funnel,
                leaders: sortedLeaders,
                lastUpdated: now.toISOString()
            }
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}



