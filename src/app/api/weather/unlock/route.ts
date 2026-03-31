import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { userId, eventId, cost } = await req.json();
        
        if (!userId || !eventId) {
            return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
        }

        const costAmount = cost || 100;

        // Atomic Transaction: Check credits, Deduct credits, Log unlock
        await db.query('BEGIN');
        
        try {
            // 1. Deduct Credits from profiles (only if balance >= cost)
            const { rows: updated } = await db.query(`
                UPDATE profiles 
                SET credit_balance = credit_balance - $1, updated_at = NOW()
                WHERE id = $2 AND credit_balance >= $1
                RETURNING credit_balance
            `, [costAmount, userId]);

            if (updated.length === 0) {
                await db.query('ROLLBACK');
                return NextResponse.json({ success: false, error: 'Insufficient Balance' }, { status: 402 });
            }

            // 2. Insert into weather_unlocks (valid for 24 hours)
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            await db.query(`
                INSERT INTO weather_unlocks (user_id, event_id, expires_at)
                VALUES ($1, $2, $3)
                ON CONFLICT (user_id, event_id) DO UPDATE 
                SET expires_at = EXCLUDED.expires_at, created_at = NOW()
            `, [userId, eventId, expiresAt]);

            await db.query(`
                INSERT INTO transactions (user_id, amount, type, provider, meta, created_at)
                VALUES ($1, $2, 'weather_unlock', 'syndicate_intel', $3, NOW())
            `, [userId, costAmount, JSON.stringify({ event_id: eventId })]);

            await db.query('COMMIT');
            
            return NextResponse.json({ 
                success: true, 
                newBalance: updated[0].credit_balance,
                expiresAt: expiresAt.toISOString()
            });

        } catch (e) {
            await db.query('ROLLBACK');
            throw e;
        }

    } catch (error: any) {
        console.error('[Weather Unlock] Purchase Failure:', error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
