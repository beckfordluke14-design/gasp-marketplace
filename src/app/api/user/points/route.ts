import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * ⛽ SYNDICATE POINTS ENGINE: The Live Balance Feed
 * This endpoint fetches the user's GASP Points and total spend history.
 * It is used for the header/sidebar balance display.
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ success: false, error: 'Identity Required' }, { status: 400 });
        }

        // 📊 Fetch Points + Global Stats
        const { rows: pointsRows } = await db.query(
            'SELECT points, total_spent_credits FROM syndicate_points WHERE user_id = $1',
            [userId]
        );

        const { rows: burnRows } = await db.query(
            'SELECT total_burned_credits FROM global_burn_stats WHERE id = 1'
        );

        const userPoints = pointsRows[0] || { points: 0, total_spent_credits: 0 };
        const globalBurn = burnRows[0]?.total_burned_credits || 0;

        return NextResponse.json({
            success: true,
            data: {
                balance: parseInt(userPoints.points),
                totalSpent: parseInt(userPoints.total_spent_credits),
                globalBurn: parseInt(globalBurn)
            }
        });

    } catch (error: any) {
        console.error('[Points API] Fetch Failure:', error.message);
        return NextResponse.json({ success: false, error: 'Nexus Sync Failure' }, { status: 500 });
    }
}
