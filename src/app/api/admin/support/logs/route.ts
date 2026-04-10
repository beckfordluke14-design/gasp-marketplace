import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * 🛠️ SYNDICATE SUPPORT COMMAND: READ ENGINE
 * Scans the /logs/support directory for all manifest JSONs.
 * Returns sorted list of tickets for administrative audit.
 */

export async function GET() {
  try {
    const logDir = path.join(process.cwd(), 'logs', 'support');
    
    if (!fs.existsSync(logDir)) {
      return NextResponse.json({ success: true, tickets: [] });
    }

    const files = fs.readdirSync(logDir);
    const tickets = files
      .filter(f => f.endsWith('.json'))
      .map(file => {
        const filePath = path.join(logDir, file);
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return {
          id: file,
          ...content
        };
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ success: true, tickets });
  } catch (err) {
    console.error('[Admin Support Read Error]:', err);
    return NextResponse.json({ success: false, error: 'Failed to access logs' }, { status: 500 });
  }
}
