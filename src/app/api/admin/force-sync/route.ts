import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * THE FORCE-SYNC MASTER (V12.0 - Sovereign Edition)
 */
export async function GET() {
  const responses = [];
  const targets = [
      { file: 'jamaican-2.mp4', persona: 'tia-jamaica', caption: 'Exclusive JAMAICA Debut. 🇯🇲🏁🦾' },
      { file: 'Nigerian.mp4', persona: 'zola-nigeria', caption: 'NIGERIA Street Pulse. 🇳🇬🦾🏎️' }
  ];

  for (const t of targets) {
      console.log(`📡 [Admin Master] Processing ${t.file}...`);
      const fullPath = path.join(process.cwd(), t.file);
      
      if (!fs.existsSync(fullPath)) {
          responses.push({ file: t.file, status: 'error', message: 'Master Not Found in Cluster.' });
          continue;
      }

      try {
          const dest = `v12_master_${t.persona}_${Date.now()}.mp4`;
          const publicUrl = `https://asset.gasp.fun/posts/videos/${dest}`;

          // 🛡️ SOVEREIGN REGISTRATION: Writing to the Railway vault
          await db.query(`
              INSERT INTO posts (
                  persona_id, 
                  content_type, 
                  content_url, 
                  caption, 
                  is_featured, 
                  is_vault, 
                  created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
          `, [
              t.persona,
              'video',
              publicUrl,
              t.caption,
              true,
              false
          ]);

          responses.push({ file: t.file, status: 'synced', url: publicUrl });

      } catch (e: any) {
          responses.push({ file: t.file, status: 'error', error: e.message });
      }
  }

  return NextResponse.json({ success: true, results: responses });
}



