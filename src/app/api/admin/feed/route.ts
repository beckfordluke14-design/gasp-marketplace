import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '0', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const personaIdFilter = searchParams.get('persona_id');
  const allMode = searchParams.get('all') === 'true'; // Admin: show everything including vault/hidden
  
  try {
    let query = supabase
      .from('posts')
      .select('*, personas!inner(id, name, city, age, seed_image_url, is_active)')
      .order('is_burner', { ascending: false })
      .order('created_at', { ascending: false });

    if (personaIdFilter) {
      // Admin linked-posts: just filter by persona, no other restrictions
      query = query.eq('persona_id', personaIdFilter);
    } else if (!allMode) {
      // ✅ Public feed filters
      query = query
        .eq('personas.is_active', true)
        .eq('is_vault', false)
        .eq('is_freebie', false)
        .eq('is_gallery', false)
        .not('content_url', 'is', null)
        .not('caption', 'eq', 'DELETED_NODE_SYNC_V15')
        .not('caption', 'like', 'DELETED%');
    }

    const PAGE_COUNT = limit;
    query = query.range(page * PAGE_COUNT, (page + 1) * PAGE_COUNT - 1);

    const { data: dbPosts, error } = await query;


    if (error) throw error;

    return NextResponse.json({ 
        success: true, 
        posts: dbPosts || [],
        tombstones: []
    });
  } catch (e: any) {
    console.error('[Neural Feed Failure]:', e.message);
    return NextResponse.json({ success: false, posts: [], tombstones: [], error: e.message }, { status: 500 });
  }
}



