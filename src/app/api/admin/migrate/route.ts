import { NextResponse } from 'next/server';
import { Client } from 'pg';

export async function GET() {
    // FORCE DIRECT IPv4 IP SYNC (AWS US-EAST-1 POOLER)
    const client = new Client({
        connectionString: 'postgresql://postgres.vvcwjlcequbkhlpmwzlc:eFfE7mXkS3Zc8V9@aws-0-us-west-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true',
        ssl: {
            rejectUnauthorized: false
        }
    });
    
    try {
        await client.connect();
        console.log("📡 [IPv4 DIRECT Pulse] Connected to Matrix...");
        
        await client.query(`
            ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
            ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0;
            ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
        `);
        
        await client.end();
        return NextResponse.json({ success: true, message: "🏁 Neural Schema Updated via Direct IP. is_featured Active." });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message });
    }
}



