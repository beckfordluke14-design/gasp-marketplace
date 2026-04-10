import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * 🛠️ GASP SUPPORT LOGGING ENGINE
 * Captures all support interactions, metadata, and visitor IDs.
 * Stored as JSON logs for administrative review.
 */

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { userId, email, problem, messages, metadata } = data;

    // 📁 Ensure logs directory exists
    const logDir = path.join(process.cwd(), 'logs', 'support');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // 📝 Generate unique log filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${timestamp}_${userId || 'anonymous'}.json`;
    const filePath = path.join(logDir, filename);

    const logEntry = {
      timestamp: new Date().toISOString(),
      userId,
      email,
      problem,
      messages,
      metadata: {
        ...metadata,
        userAgent: req.headers.get('user-agent'),
        ip: req.headers.get('x-forwarded-for') || 'local',
      }
    };

    fs.writeFileSync(filePath, JSON.stringify(logEntry, null, 2));

    return NextResponse.json({ success: true, logId: filename });
  } catch (err) {
    console.error('[Support Log Error]:', err);
    return NextResponse.json({ success: false, error: 'Internal failure' }, { status: 500 });
  }
}
