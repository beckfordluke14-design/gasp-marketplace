import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 📊 NEURAL ANALYTICS PULSE: Collecting 24h metrics
        const now = new Date();
        const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

        // 1. Total Event Pulses (Last 24h)
        const { rows: eventCountRows } = await db.query(`
            SELECT COUNT(*) FROM neural_telemetry WHERE created_at >= $1
        `, [past24h]);
        const totalEvents = parseInt(eventCountRows[0].count);

        // 2. Conversion Funnel (The Million-Dollar Funnel)
        const { rows: funnelData } = await db.query(`
            SELECT event_type FROM neural_telemetry WHERE created_at >= $1
        `, [past24h]);
            
        const funnel = {
            app_load: funnelData?.filter(e => e.event_type === 'app_load').length || 0,
            feed_view: funnelData?.filter(e => e.event_type === 'feed_view').length || 0,
            chat_open: funnelData?.filter(e => e.event_type === 'chat_open').length || 0,
            unlock_intent: funnelData?.filter(e => e.event_type === 'vault_unlock_intent').length || 0
        };

        // 3. Top Personas (By Magnetic Pull)
        const { rows: personaStats } = await db.query(`
            SELECT persona_id FROM neural_telemetry 
            WHERE created_at >= $1 AND persona_id IS NOT NULL
        `, [past24h]);

        const leaderBoard: Record<string, number> = {};
        personaStats?.forEach(s => {
            leaderBoard[s.persona_id] = (leaderBoard[s.persona_id] || 0) + 1;
        });

        const sortedLeaders = Object.entries(leaderBoard)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([id, count]) => ({ id, count }));

        // 4. 🔥 SYNDICATE SHADOW BURN (DAO CORE)
        const { rows: burnStats } = await db.query('SELECT * FROM global_burn_stats WHERE id = 1 LIMIT 1');
        const burn = burnStats[0] || { total_burned_credits: 0, total_points_issued: 0 };

        return NextResponse.json({
            success: true,
            stats: {
                totalEvents,
                funnel,
                leaders: sortedLeaders,
                burn: {
                    burned: parseInt(burn.total_burned_credits),
                    issued: parseInt(burn.total_points_issued)
                },
                lastUpdated: now.toISOString()
            }
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}



