import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * 🛰️ SYNDICATE READ PROTOCOL
 * Purpose: Clears unread status for a specific persona session.
 */
export async function POST(req: NextRequest) {
    try {
        const { userId, personaId } = await req.json();

        if (!userId || !personaId) {
            return NextResponse.json({ success: false, error: 'Missing Identity Data' }, { status: 400 });
        }

        // 🧠 NEURAL ACKNOWLEDGEMENT: Set all user's unread messages for this persona to READ
        await db.query(
            `UPDATE chat_messages 
             SET is_read = TRUE 
             WHERE user_id = $1 AND persona_id = $2 AND role = 'assistant' AND is_read = FALSE`,
            [userId, personaId]
        );

        return NextResponse.json({ 
            success: true, 
            message: 'Session Acknowledged.' 
        });

    } catch (err: any) {
        console.error('[Read Signal Fail]:', err);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
