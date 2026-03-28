import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const ip_address = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const user_agent = req.headers.get('user-agent') || 'unknown';

    await db.query(`
        INSERT INTO consent_logs (ip_address, user_agent, site_version, created_at)
        VALUES ($1, $2, 'v77.1_gasp_fun', NOW())
    `, [ip_address, user_agent]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Consent Log Error]:', error.message);
    // Silent fail for user conversion
    return NextResponse.json({ success: false, error: 'Log failed but entry permitted' }, { status: 200 });
  }
}



