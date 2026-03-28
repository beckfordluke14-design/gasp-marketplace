import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { rows: stories } = await db.query(`
        SELECT * FROM persona_stories 
        WHERE expires_at > NOW() 
        ORDER BY created_at DESC
    `);
    
    return NextResponse.json({ success: true, stories: stories || [] });
  } catch (error: any) {
    console.error('[Stories API] Pulse Failure:', error.message);
    return NextResponse.json({ success: false, stories: [], error: error.message }, { status: 500 });
  }
}
