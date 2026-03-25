import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '' // SERVICE_ROLE_KEY
);

export async function POST(req: Request) {
  try {
    const { postId } = await req.json();
    console.log(`[Neural Like Hub] Incrementing Node: ${postId}`);

    // Increment logic using RPC or direct SQL if possible
    // For now, let's fetch current and increment to ensure atomic-ish behavior if RPC not ready
    const { data: post } = await supabase.from('posts').select('likes_count').eq('id', postId).single();
    const newCount = (post?.likes_count || 0) + 1;

    const { error } = await supabase.from('posts').update({ likes_count: newCount }).eq('id', postId);

    if (error) throw error;
    return NextResponse.json({ success: true, likes: newCount });
  } catch (e: any) {
    console.error('[Neural Like Failure]:', e.message);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}



