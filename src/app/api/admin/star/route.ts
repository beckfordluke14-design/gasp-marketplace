import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '' // SERVICE_ROLE_KEY
);

export async function POST(req: Request) {
  try {
    const { postId, personaId, newState, caption, videoUrl, imageUrl, type, isVault } = await req.json();
    console.log(`[Neural Admin Sync] Cloud-Etching Node: ${postId} to state: ${newState}`);

    // Bypass RLS using Service Role over HTTPS (IPv4 Safe)
    const { error } = await supabase.from('posts').upsert([{ 
        id: postId, 
        is_burner: newState, // PROXY FLAG
        persona_id: personaId,
        content_url: videoUrl || imageUrl,
        content_type: type,
        caption: caption,
        is_vault: isVault || false
    }]);

    if (error) throw error;
    return NextResponse.json({ success: true, message: "🏁 Node state etched into cloud." });
  } catch (e: any) {
    console.error('[Neural Admin Failure]:', e.message);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}



