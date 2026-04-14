import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * 🛰️ SYNDICATE UNREAD RADAR
 * Purpose: Detects new messages for a user across all personas.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ success: false, error: 'Missing User ID' }, { status: 400 });
    }

    try {
        // 🧬 UNREAD LOGIC: 
        // Only count messages where is_read is FALSE.
        const { rows } = await db.query(
            `SELECT persona_id, COUNT(*) as count 
             FROM chat_messages 
             WHERE user_id = $1 AND role = 'assistant' AND is_read = FALSE
             GROUP BY persona_id`,
            [userId]
        );

        const unreadMap: Record<string, number> = {};
        rows.forEach(r => {
            unreadMap[r.persona_id] = parseInt(r.count || '0');
        });
        
        return NextResponse.json({ 
            success: true, 
            unreads: unreadMap
        });

    } catch (err) {
        console.error('[Unread Radar Fail]:', err);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
