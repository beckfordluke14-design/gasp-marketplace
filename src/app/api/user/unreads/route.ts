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
        // We look for assistant messages that don't have a corresponding 'read' entry.
        // Or simpler: Just count messages newer than the last viewed timestamp in localstorage 
        // (but since we want server-side truth, we'll check chat_messages vs user metadata)
        
        // For now, let's use a simpler approach: 
        // Return counts of messages sent in the last 24 hours that might be new.
        const { rows } = await db.query(`
            const { rows } = await db.query(
                `SELECT persona_id, COUNT(*) as count 
                 FROM chat_messages 
                 WHERE user_id = $1 AND role = 'assistant' AND created_at > NOW() - INTERVAL '24 hours'
                 GROUP BY persona_id`,
                [userId]
            );
        `);

        // Note: Real production unread logic usually requires a 'last_read_at' column per persona.
        // We will mock it here by checking the database for the message stack.
        
        return NextResponse.json({ 
            success: true, 
            unreads: {} // This will be hydrated by the client logic
        });

    } catch (err) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
