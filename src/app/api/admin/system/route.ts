import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const personaId = searchParams.get('personaId');

  try {
    switch (action) {
      case 'persona-details': {
        if (!personaId) throw new Error('Persona ID required.');
        
        const [
            { data: persona },
            { data: assets },
            { count: relationshipsCount }
        ] = await Promise.all([
            supabase.from('personas').select('*').eq('id', personaId).single(),
            supabase.from('posts').select('*').eq('persona_id', personaId).order('created_at', { ascending: false }),
            supabase.from('user_relationships').select('*', { count: 'exact', head: true }).eq('persona_id', personaId)
        ]);

        return NextResponse.json({ 
            success: true, 
            data: { persona, assets: assets || [], relationshipsCount: relationshipsCount || 0 } 
        });
      }

      case 'scan-orphans': {
        // 🔍 SCAN STORAGE BUCKETS FOR UNMAPPED ASSETS
        const slug = personaId?.split('-')[0] || '';
        const buckets = [
          { name: 'chat_media', paths: personaId ? [`personas/${personaId}`, `personas/${slug}`, 'personas', ''] : ['personas', ''] },
          { name: 'posts', paths: [''] },
          { name: 'media_vault', paths: [''] }
        ];

        let allFiles: any[] = [];
        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

        for (const buck of buckets) {
          for (const path of buck.paths) {
            try {
              const { data } = await supabase.storage.from(buck.name).list(path, { limit: 100 });
              if (data) {
                allFiles.push(...data.filter(f => f.id).map(f => ({
                  name: f.name,
                  bucket: buck.name,
                  url: `${baseUrl}/storage/v1/object/public/${buck.name}/${path ? path + '/' : ''}${f.name}`
                })));
              }
            } catch(e) {}
          }
        }

        // 👻 SCAN DATABASE FOR GHOST POSTS
        const { data: dbOrphans } = await supabase.from('posts').select('*').is('persona_id', null);
        if (dbOrphans) {
            allFiles.push(...dbOrphans.map(o => ({
                name: `DB_GHOST_${o.id.slice(0,4)}`,
                bucket: 'posts_table',
                url: o.content_url
            })));
        }

        return NextResponse.json({ success: true, files: allFiles });
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid System Action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Admin System API] Error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
