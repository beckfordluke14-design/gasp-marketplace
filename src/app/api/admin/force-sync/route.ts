import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/**
 * THE FORCE-SYNC MASTER (V11.2)
 * Objective: Direct DB Infiltration for Tia & Zola.
 */
export async function GET() {
  const responses = [];
  const targets = [
      { file: 'jamaican-2.mp4', persona: 'tia-jamaica', caption: 'Exclusive JAMAICA Debut. 🇯🇲🏁🦾' },
      { file: 'Nigerian.mp4', persona: 'zola-nigeria', caption: 'NIGERIA Street Pulse. 🇳🇬🦾🏎️' }
  ];

  for (const t of targets) {
      console.log(`📡 Processing ${t.file}...`);
      const fullPath = path.join(process.cwd(), t.file);
      
      if (!fs.existsSync(fullPath)) {
          responses.push({ file: t.file, status: 'error', message: 'Master Not Found in Cluster.' });
          continue;
      }

      try {
          const buffer = fs.readFileSync(fullPath);
          const dest = `v11_master_${t.persona}_${Date.now()}.mp4`;

          // 1. Storage
          await supabase.storage.from('media_vault').upload(dest, buffer, { contentType: 'video/mp4' });
          const { data: { publicUrl } } = supabase.storage.from('media_vault').getPublicUrl(dest);

          // 2. Database (Using .insert with explicit column mapping)
          const { error: dbErr } = await supabase.from('posts').insert({
              persona_id: t.persona,
              content_type: 'video',
              content_url: publicUrl,
              caption: t.caption,
              is_featured: true,
              is_vault: false,
              created_at: new Date().toISOString()
          });

          if (dbErr) throw dbErr;
          responses.push({ file: t.file, status: 'synced', url: publicUrl });

      } catch (e: any) {
          responses.push({ file: t.file, status: 'error', error: e.message });
      }
  }

  return NextResponse.json({ success: true, results: responses });
}



