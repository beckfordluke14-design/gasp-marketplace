import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) return NextResponse.json({ error: 'Key required' }, { status: 400 });

    try {
        const { rows } = await db.query('SELECT value FROM system_config WHERE key = $1', [key]);
        return NextResponse.json({ value: rows[0]?.value || null });
    } catch (err: any) {
        // Fallback if table doesn't exist
        if (err.message.includes('relation "system_config" does not exist')) {
            return NextResponse.json({ value: 'gemini' }); // Default to gemini as requested
        }
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { key, value } = await req.json();

        // 🛡️ SOVEREIGN TABLE INITIALIZATION (if missing)
        await db.query(`
            CREATE TABLE IF NOT EXISTS system_config (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        await db.query(`
            INSERT INTO system_config (key, value, updated_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
        `, [key, value]);

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
