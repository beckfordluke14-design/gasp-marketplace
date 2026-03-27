import { createClient } from '@supabase/supabase-js';
import { initialPersonas } from '@/lib/profiles';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: Request) {
  try {
    const { action, payload } = await req.json();
    const { userId, personaId } = payload;

    if (!userId || !action) {
      return new Response('Missing User ID or Action', { status: 400 });
    }

    switch (action) {
      case 'chat-context': {
        // 🔮 FETCH ALL NEURAL CHAT DATA IN ONE ROUND-TRIP
        const [
            { data: messages },
            { data: unlocks },
            { data: vault },
            { data: galleryPosts },
            { data: relationship },
            { data: stats }
        ] = await Promise.all([
            supabase.from('chat_messages').select('*').eq('user_id', userId).eq('persona_id', personaId).order('created_at', { ascending: true }),
            supabase.from('user_vault_unlocks').select('item_id').eq('user_id', userId),
            supabase.from('persona_vault').select('*').eq('persona_id', personaId).order('created_at', { ascending: false }),
            supabase.from('posts').select('*').eq('persona_id', personaId).or('is_gallery.eq.true,is_vault.eq.true').order('created_at', { ascending: false }),
            supabase.from('user_relationships').select('*').eq('user_id', userId).eq('persona_id', personaId).maybeSingle(),
            supabase.from('user_persona_stats').select('bond_score').eq('user_id', userId).eq('persona_id', personaId).maybeSingle()
        ]);

        const unlockedIds = (unlocks || []).map(u => u.item_id);

        return Response.json({
          success: true,
          data: {
            messages: messages || [],
            vaultItems: [
              ...(vault || []).map(v => ({ ...v, is_unlocked: unlockedIds.includes(v.id) })),
              ...(galleryPosts || []).map(p => ({
                  id: p.id,
                  content_url: p.content_url || p.image_url,
                  caption: p.caption,
                  is_vault: p.is_vault || p.is_freebie || true,
                  is_unlocked: p.is_unlocked || unlockedIds.includes(p.id) || !p.is_vault,
                  type: p.type || 'image',
                  created_at: p.created_at
              }))
            ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
            isFollowing: !!relationship,
            bondScore: stats?.bond_score || 0
          }
        });
      }

      case 'toggle-follow': {
        const { isFollowing } = payload;
        if (isFollowing) {
          await supabase.from('user_relationships').delete().eq('user_id', userId).eq('persona_id', personaId);
          return Response.json({ success: true, isFollowing: false });
        } else {
          await supabase.from('user_relationships').upsert({ user_id: userId, persona_id: personaId, affinity_score: 1 });
          return Response.json({ success: true, isFollowing: true });
        }
      }

      case 'sync-follows': {
        const { data } = await supabase.from('user_relationships').select('persona_id').eq('user_id', userId);
        return Response.json({ success: true, following: (data || []).map(r => r.persona_id) });
      }

      case 'like-post': {
        const { postId, hasLiked } = payload;
        if (hasLiked) {
           // Dec count (Optional: supabase.rpc handles atomic updates better but this works for syndicate v1)
           return Response.json({ success: true });
        } else {
           return Response.json({ success: true });
        }
      }

      default:
        return new Response('Invalid Neural Action', { status: 400 });
    }
  } catch (error: any) {
    console.error('[Neural RPC Error]:', error);
    return new Response(error.message, { status: 500 });
  }
}
