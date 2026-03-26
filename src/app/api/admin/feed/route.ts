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
  const PAGE_COUNT = 20;
  
  try {
    // ✅ Feed: public posts from active personas — hidden posts excluded regardless of hero flag
    const { data: dbPosts, error } = await supabase
        .from('posts')
        .select('*, personas!inner(id, name, city, age, seed_image_url, is_active)')
        .eq('personas.is_active', true)
        .eq('is_vault', false)
        .eq('is_freebie', false)
        .eq('is_gallery', false)
        .not('content_url', 'is', null)
        .not('caption', 'eq', 'DELETED_NODE_SYNC_V15')
        .not('caption', 'like', 'DELETED%')
        .order('is_burner', { ascending: false })          // hero posts float to top
        .order('created_at', { ascending: false })
        .range(page * PAGE_COUNT, (page + 1) * PAGE_COUNT - 1);


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



