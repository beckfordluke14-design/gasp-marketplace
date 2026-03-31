import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * 🛰️ SYNDICATE LEADERBOARD: Sovereign Power Rankings
 * Returns the top 10 users by GASP Points for public display.
 */
export async function GET() {
    try {
        const { rows } = await db.query(`
            SELECT 
                p.user_id, 
                p.points, 
                p.total_spent_credits,
                u.email
            FROM syndicate_points p
            LEFT JOIN users u ON p.user_id = u.id
            ORDER BY p.points DESC
            LIMIT 10
        `);

        // 🛡️ ANONYMIZATION: Protect emails for the public board
        const leaderboard = rows.map((r, idx) => ({
            id: r.user_id,
            rank: idx + 1,
            power: r.points,
            identifier: r.email ? r.email.split('@')[0] : `OP_${r.user_id.slice(0, 4)}`,
            burnContribution: r.total_spent_credits
        }));

        return NextResponse.json({ success: true, data: leaderboard });
    } catch (e) {
        console.error('[Leaderboard API] Node Failure:', e);
        return NextResponse.json({ success: false, error: 'Protocol Node Offline' }, { status: 500 });
    }
}
