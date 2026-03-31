import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * ⛽ SYNDICATE POINTS ENGINE: The Live Balance Feed
 * This endpoint fetches the user's GASP Points and total spend history.
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        // 📊 Fetch Global Stats (Always accessible)
        const { rows: burnRows } = await db.query(
            'SELECT total_burned_credits FROM global_burn_stats WHERE id = 1'
        );
        const globalBurn = burnRows[0]?.total_burned_credits || 0;

        // 📊 Fetch User Stats (If ID provided)
        let userPoints = { points: 0, total_spent_credits: 0 };
        if (userId) {
            const { rows: pointsRows } = await db.query(
                'SELECT points, total_spent_credits FROM syndicate_points WHERE user_id = $1',
                [userId]
            );
            userPoints = pointsRows[0] || { points: 0, total_spent_credits: 0 };
        }

        return NextResponse.json({
            success: true,
            data: {
                balance: parseInt(String(userPoints.points)),
                totalSpent: parseInt(String(userPoints.total_spent_credits)),
                globalBurn: parseInt(String(globalBurn))
            }
        });

    } catch (error: any) {
        console.error('[Points API] Fetch Failure:', error.message);
        return NextResponse.json({ success: false, error: 'Nexus Sync Failure' }, { status: 500 });
    }
}
