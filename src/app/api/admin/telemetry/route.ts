import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { event, user_id, persona_id, vibe, metadata } = await req.json();

        // 💎 DATA MINING: High-Value Handshake on Railway
        try {
            await db.query(`
                INSERT INTO neural_telemetry (
                    event_type, user_id, persona_id, vibe_at_time, metadata, created_at
                ) VALUES ($1, $2, $3, $4, $5, NOW())
            `, [
                event, 
                user_id || 'guest', 
                persona_id, 
                vibe || '', 
                JSON.stringify(metadata || {})
            ]);

        } catch (error: any) {
            // Table might not exist, attempt auto-heal (God-Mode)
            if (error.code === '42P01') {
                await db.query(`
                  CREATE TABLE IF NOT EXISTS neural_telemetry (
                    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id text,
                    persona_id text,
                    event_type text,
                    vibe_at_time text,
                    metadata jsonb DEFAULT '{}',
                    created_at timestamptz DEFAULT now()
                  );
                `);
                // Retry once
                await db.query(`
                    INSERT INTO neural_telemetry (event_type, user_id, persona_id, metadata, created_at)
                    VALUES ($1, $2, $3, $4, NOW())
                `, [event, user_id || 'guest', persona_id, JSON.stringify(metadata || {})]);
            } else throw error;
        }

        return NextResponse.json({ success: true, message: 'Neural Handshake Recorded on Railway.' });
    } catch (e: any) {
        console.error('[Telemetry Failure]:', e.message);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}



