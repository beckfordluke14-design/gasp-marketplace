import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const apiKey = req.headers.get('x-admin-key');

  if (apiKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { rows: transcript } = await db.query(
      "SELECT * FROM messages WHERE user_id = $1 ORDER BY created_at ASC",
      [params.id]
    );

    return NextResponse.json({ success: true, transcript });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
