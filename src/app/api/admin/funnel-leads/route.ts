import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const apiKey = req.headers.get('x-admin-key');

  // 🛡️ SECURITY CHECK: Master Override
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 🛡️ INTERCEPT QUERY: Fetch all guest conversations (GUEST_ prefixed IDs)
    // We group by user_id to see distinct 'Leads'
    const queryText = `
      SELECT 
        m.user_id,
        m.persona_id,
        p.name as persona_name,
        COUNT(m.id) as message_count,
        MAX(m.created_at) as last_activity,
        (
          SELECT content FROM messages 
          WHERE user_id = m.user_id 
          ORDER BY created_at DESC LIMIT 1
        ) as last_message
      FROM messages m
      LEFT JOIN personas p ON m.persona_id = p.id
      WHERE m.user_id LIKE 'GUEST_%'
      GROUP BY m.user_id, m.persona_id, p.name
      ORDER BY last_activity DESC
      LIMIT 100
    `;

    const { rows: leads } = await db.query(queryText);

    return NextResponse.json({ success: true, leads });
  } catch (e: any) {
    console.error('[Intercept API] Fatal:', e.message);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
