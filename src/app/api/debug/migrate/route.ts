import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        console.log('📡 [Ghost Migration] Injecting is_read...');
        await db.query('ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE');
        
        const { rows } = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'chat_messages'");
        const columns = rows.map((r: any) => r.column_name);
        
        return NextResponse.json({ 
            success: true, 
            message: 'Database Schema Re-Indexed.', 
            columns 
        });
    } catch (err: any) {
        return NextResponse.json({ 
            success: false, 
            error: err.message 
        }, { status: 500 });
    }
}
